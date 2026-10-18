// Regras de negócio das tarefas: criar, consultar, concluir, editar e excluir.
// Ficam separadas da tela para serem testáveis e reaproveitadas.

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

// Devolve as tarefas de um dia específico.
export function tarefasDoDia(estado, dataISO) {
  return estado.tarefas.filter((tarefa) => tarefa.data === dataISO);
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
