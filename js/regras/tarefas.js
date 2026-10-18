// Regras de negócio das tarefas: criar e consultar.
// Ficam separadas da tela para serem testáveis e reaproveitadas.

// Cria uma tarefa nova (ainda não salva) a partir dos campos do formulário.
export function criarTarefa(campos) {
  const agora = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    titulo: campos.titulo.trim(),
    descricao: campos.descricao.trim() || null,
    categoria: campos.categoria,
    prioridade: campos.prioridade, // "baixa" | "media" | "alta"
    data: campos.data, // "AAAA-MM-DD"
    horaInicio: campos.horaInicio, // "HH:MM"
    duracaoMinutos: campos.duracaoMinutos,
    recorrencia: null, // sem repetição, por enquanto
    metaId: null,
    excecoes: {}, // ajustes de ocorrência (fase das recorrências)
    criadaEm: agora,
    atualizadaEm: agora
  };
}

// Devolve as tarefas de um dia específico.
export function tarefasDoDia(estado, dataISO) {
  return estado.tarefas.filter((tarefa) => tarefa.data === dataISO);
}
