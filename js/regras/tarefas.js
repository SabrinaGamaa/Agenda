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
    recorrencia: null, // sem repetição, por enquanto
    metaId: null,
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
// (Tarefas únicas usam a própria data; as recorrências, na fase 3, vão usar cada ocorrência.)
export function estaConcluida(tarefa, dataISO) {
  return tarefa.excecoes?.[dataISO]?.concluida === true;
}

// Liga/desliga a conclusão de uma tarefa em uma data.
export function alternarConclusao(estado, tarefaId, dataISO) {
  const tarefa = encontrarTarefa(estado, tarefaId);
  if (tarefa === null) return null;

  if (!tarefa.excecoes) {
    tarefa.excecoes = {};
  }

  const concluidaAgora = !estaConcluida(tarefa, dataISO);
  tarefa.excecoes[dataISO] = { ...tarefa.excecoes[dataISO], concluida: concluidaAgora };
  tarefa.atualizadaEm = new Date().toISOString();
  return tarefa;
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
