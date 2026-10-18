// Dados fictícios usados na primeira execução do aplicativo (e para demonstração).
// São somente para desenvolvimento: nenhum dado pessoal ou financeiro real.

import { hojeISO, somarDias } from "../regras/datas.js";

let contador = 0;

function tarefaExemplo(titulo, descricao, categoria, prioridade, horaInicio, duracaoMinutos) {
  contador += 1;
  const agora = new Date().toISOString();
  return {
    id: `exemplo-${contador}`,
    titulo,
    descricao,
    categoria,
    prioridade, // "baixa" | "media" | "alta"
    data: hojeISO(),
    horaInicio, // "HH:MM"
    duracaoMinutos,
    recorrencia: null, // sem repetição, por enquanto
    metaId: null,
    excecoes: {}, // ajustes de ocorrência (fase das recorrências)
    criadaEm: agora,
    atualizadaEm: agora
  };
}

// As tarefas de exemplo são sempre "de hoje", para a lista do dia já nascer com conteúdo.
export function tarefasDeExemplo() {
  return [
    tarefaExemplo(
      "Planejamento do dia",
      "Revisar prioridades e organizar a agenda.",
      "Trabalho",
      "alta",
      "09:00",
      30
    ),
    tarefaExemplo(
      "Almoço em família",
      null,
      "Pessoal",
      "media",
      "12:00",
      90
    ),
    tarefaExemplo(
      "Caminhada no parque",
      "30 minutos de caminhada leve.",
      "Saúde",
      "baixa",
      "18:30",
      45
    )
  ];
}
