// Regras de negócio das tarefas: criar, consultar, concluir, editar, excluir e ordenar.
// Ficam separadas da tela para serem testáveis e reaproveitadas.

import { ocorrenciasNoPeriodo } from "./recorrencia.js";

// Campos que uma exceção de ocorrência pode sobrescrever só naquela data.
const CAMPOS_AJUSTAVEIS_NA_OCORRENCIA = [
  "titulo",
  "descricao",
  "categoria",
  "prioridade",
  "horaInicio",
  "duracaoMinutos"
];

// Cria uma tarefa nova (ainda não salva) a partir dos campos do formulário.
export function criarTarefa(campos) {
  const agora = new Date().toISOString();
  const tarefa = {
    id: crypto.randomUUID(),
    titulo: "",
    descricao: null,
    categoria: "",
    prioridade: "media",
    data: "",
    horaInicio: "",
    duracaoMinutos: 0,
    recorrencia: null, // sem repetição por padrão; o formulário pode enviar uma regra
    metaId: null, // o vínculo é validado e aplicado por vincularTarefa (regras de metas)
    excecoes: {}, // ajustes por ocorrência (fase das recorrências)
    criadaEm: agora,
    atualizadaEm: agora
  };
  aplicarCampos(tarefa, campos);
  return tarefa;
}

// Aplica os campos vindos do formulário à tarefa (usado ao criar e ao editar).
function aplicarCampos(tarefa, campos) {
  tarefa.titulo = campos.titulo.trim();
  tarefa.descricao = campos.descricao.trim() || null;
  tarefa.categoria = campos.categoria;
  tarefa.prioridade = campos.prioridade; // "baixa" | "media" | "alta"
  tarefa.data = campos.data; // "AAAA-MM-DD"
  tarefa.horaInicio = campos.horaInicio; // "HH:MM"
  tarefa.duracaoMinutos = campos.duracaoMinutos;

  // Só mexe na recorrência quando o campo foi enviado. Assim, uma edição
  // antiga que não conhece o campo não apaga a série sem querer.
  if ("recorrencia" in campos) {
    tarefa.recorrencia = campos.recorrencia ?? null;
  }

  // metaId fica de fora de propósito: o vínculo só muda por vincularTarefa,
  // que valida se a meta existe. Assim, editar outros campos o preserva.
}

// Devolve as tarefas (definições) cuja data inicial é o dia informado.
// Para exibição, use ocorrenciasDoDia: ele também inclui as recorrências.
export function tarefasDoDia(estado, dataISO) {
  return estado.tarefas.filter((tarefa) => tarefa.data === dataISO);
}

// Monta o "retrato" de uma ocorrência para exibição:
// - parte da definição da tarefa (título, horário, categoria...);
// - aplica os ajustes feitos só para aquela data (exceções);
// - guarda a data da ocorrência em dataOcorrencia (tarefa.data continua
//   sendo o início da série, importante para editar a série inteira);
// - guarda uma referência à definição original em tarefaOriginal.
export function criarOcorrencia(tarefa, dataISO) {
  const excecao = tarefa.excecoes?.[dataISO] ?? {};
  const ocorrencia = { ...tarefa, dataOcorrencia: dataISO, tarefaOriginal: tarefa };

  for (const campo of CAMPOS_AJUSTAVEIS_NA_OCORRENCIA) {
    if (excecao[campo] !== undefined) {
      ocorrencia[campo] = excecao[campo];
    }
  }

  return ocorrencia;
}

// Devolve as ocorrências que aparecem no dia, incluindo tarefas únicas e
// todas as séries recorrentes. As ocorrências canceladas não entram.
export function ocorrenciasDoDia(estado, dataISO) {
  return estado.tarefas
    .filter((tarefa) => ocorrenciasNoPeriodo(tarefa, dataISO, dataISO).length > 0)
    .map((tarefa) => criarOcorrencia(tarefa, dataISO));
}

// Procura uma tarefa pelo id (ou null se não existir).
export function encontrarTarefa(estado, tarefaId) {
  return estado.tarefas.find((tarefa) => tarefa.id === tarefaId) ?? null;
}

// Uma tarefa está concluída quando existe a exceção "concluida" para aquela data.
// Tarefas únicas usam a própria data; nas séries, cada ocorrência tem sua data.
export function estaConcluida(tarefa, dataISO) {
  return tarefa.excecoes?.[dataISO]?.concluida === true;
}

// Liga/desliga a conclusão de uma tarefa em uma data.
export function alternarConclusao(estado, tarefaId, dataISO) {
  const tarefa = encontrarTarefa(estado, tarefaId);
  if (tarefa === null) return null;

  garantirExcecoes(tarefa);

  const concluidaAgora = !estaConcluida(tarefa, dataISO);
  tarefa.excecoes[dataISO] = { ...tarefa.excecoes[dataISO], concluida: concluidaAgora };
  tarefa.atualizadaEm = new Date().toISOString();
  return tarefa;
}

// Cancela uma ocorrência sem mexer na definição da série.
// As demais datas continuam acontecendo normalmente.
export function cancelarOcorrencia(estado, tarefaId, dataISO) {
  const tarefa = encontrarTarefa(estado, tarefaId);
  if (tarefa === null || !ocorrenciaExiste(tarefa, dataISO)) return null;

  garantirExcecoes(tarefa);
  tarefa.excecoes[dataISO] = { ...tarefa.excecoes[dataISO], cancelada: true };
  tarefa.atualizadaEm = new Date().toISOString();
  return tarefa;
}

// Ajusta os campos de uma ocorrência só naquela data.
// Guardamos apenas o que difere da série: se o valor voltar ao original,
// aquele ajuste é removido. A definição da série nunca é alterada.
export function ajustarOcorrencia(estado, tarefaId, dataISO, campos) {
  const tarefa = encontrarTarefa(estado, tarefaId);
  if (tarefa === null || !ocorrenciaExiste(tarefa, dataISO)) return null;

  garantirExcecoes(tarefa);
  const excecao = { ...tarefa.excecoes[dataISO] };

  for (const campo of CAMPOS_AJUSTAVEIS_NA_OCORRENCIA) {
    if (!(campo in campos)) continue; // campo não enviado: mantém o ajuste atual

    const valor = normalizarValorDoCampo(campo, campos[campo]);
    const valorDaSerie = normalizarValorDoCampo(campo, tarefa[campo]);

    if (valor === valorDaSerie) {
      delete excecao[campo];
    } else {
      excecao[campo] = valor;
    }
  }

  // Exceção vazia não precisa ser guardada (mantém o JSON limpo).
  if (Object.keys(excecao).length === 0) {
    delete tarefa.excecoes[dataISO];
  } else {
    tarefa.excecoes[dataISO] = excecao;
  }

  tarefa.atualizadaEm = new Date().toISOString();
  return tarefa;
}

// A data existe na série? Inclui ocorrências já canceladas, para que
// possamos ajustá-las ou consultá-las sem erro.
function ocorrenciaExiste(tarefa, dataISO) {
  return ocorrenciasNoPeriodo(tarefa, dataISO, dataISO, { incluirCanceladas: true }).length > 0;
}

// Garante o objeto de exceções em tarefas antigas, que podem não tê-lo.
function garantirExcecoes(tarefa) {
  if (!tarefa.excecoes || typeof tarefa.excecoes !== "object") {
    tarefa.excecoes = {};
  }
}

// Normaliza o valor antes de comparar com a série. É a mesma limpeza que
// aplicarCampos faz: título sem espaços e descrição vazia vira null.
function normalizarValorDoCampo(campo, valor) {
  if (campo === "titulo") {
    return String(valor ?? "").trim();
  }

  if (campo === "descricao") {
    const texto = String(valor ?? "").trim();
    return texto === "" ? null : texto;
  }

  if (campo === "duracaoMinutos") {
    return Number(valor);
  }

  return valor;
}

// Atualiza os campos de uma tarefa existente.
export function atualizarTarefa(estado, tarefaId, campos) {
  const tarefa = encontrarTarefa(estado, tarefaId);
  if (tarefa === null) return null;
  aplicarCampos(tarefa, campos);
  tarefa.atualizadaEm = new Date().toISOString();
  return tarefa;
}

// Remove uma tarefa da lista. Devolve a tarefa removida (ou null).
export function excluirTarefa(estado, tarefaId) {
  const indice = estado.tarefas.findIndex((tarefa) => tarefa.id === tarefaId);
  if (indice === -1) return null;
  const [removida] = estado.tarefas.splice(indice, 1);
  return removida;
}

// Ordena as tarefas de um dia para exibição:
// primeiro as pendentes (da mais cedo para a mais tarde) e, no fim, as concluídas.
// Devolve uma lista nova: a ordem original (do estado) não é alterada.
export function ordenarTarefasDoDia(tarefas, dataISO) {
  return [...tarefas].sort((a, b) => {
    const concluidaA = estaConcluida(a, dataISO) ? 1 : 0;
    const concluidaB = estaConcluida(b, dataISO) ? 1 : 0;
    if (concluidaA !== concluidaB) {
      return concluidaA - concluidaB; // pendentes primeiro
    }
    return a.horaInicio.localeCompare(b.horaInicio); // "HH:MM" ordena como texto
  });
}
