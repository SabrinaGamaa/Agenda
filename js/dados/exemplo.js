// Dados fictícios usados na primeira execução do aplicativo (e para demonstração).
// São somente para desenvolvimento: nenhum dado pessoal ou financeiro real.

import { hojeISO, somarDias } from "../regras/datas.js";

let contador = 0;

function tarefaExemplo(
  titulo,
  descricao,
  categoria,
  prioridade,
  horaInicio,
  duracaoMinutos,
  data = hojeISO()
) {
  contador += 1;
  const agora = new Date().toISOString();
  return {
    id: `exemplo-${contador}`,
    titulo,
    descricao,
    categoria,
    prioridade, // "baixa" | "media" | "alta"
    data,
    horaInicio, // "HH:MM"
    duracaoMinutos,
    recorrencia: null, // as tarefas de exemplo são únicas
    metaId: null,
    excecoes: {}, // ajustes por ocorrência (usado pelas séries recorrentes)
    criadaEm: agora,
    atualizadaEm: agora
  };
}

// Data do mês atual, para os exemplos financeiros aparecerem no resumo do mês.
function dataNoMesAtual(dia) {
  return `${hojeISO().slice(0, 7)}-${String(dia).padStart(2, "0")}`;
}

// Tarefas de exemplo: três para hoje e duas nos próximos dias, para o painel
// principal mostrar tanto "Hoje" quanto "Próximas".
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
    ),
    tarefaExemplo(
      "Revisão semanal",
      "Fechar pendências e planejar a próxima semana.",
      "Trabalho",
      "media",
      "10:00",
      45,
      somarDias(hojeISO(), 1)
    ),
    tarefaExemplo(
      "Consulta médica",
      null,
      "Saúde",
      "alta",
      "15:00",
      60,
      somarDias(hojeISO(), 3)
    )
  ];
}

// Metas fictícias para o painel principal nascer com conteúdo.
// A meta financeira usa o valor atual para mostrar progresso sem etapas.
export function metasDeExemplo() {
  const agora = new Date().toISOString();

  return [
    {
      id: "exemplo-meta-1",
      titulo: "Reserva de emergência",
      descricao: "Guardar 10 mil reais para imprevistos.",
      tipo: "financeira",
      prazo: somarDias(hojeISO(), 120),
      situacao: "ativa",
      etapas: [],
      valorAlvoCentavos: 1000000,
      valorAtualCentavos: 350000,
      progressoManual: 0,
      criadaEm: agora,
      atualizadaEm: agora
    },
    {
      id: "exemplo-meta-2",
      titulo: "Curso de JavaScript",
      descricao: "Concluir os módulos do curso.",
      tipo: "pessoal",
      prazo: somarDias(hojeISO(), 60),
      situacao: "ativa",
      etapas: [
        { id: "exemplo-etapa-1", titulo: "Módulo 1", concluida: true },
        { id: "exemplo-etapa-2", titulo: "Módulo 2", concluida: false },
        { id: "exemplo-etapa-3", titulo: "Módulo 3", concluida: false }
      ],
      valorAlvoCentavos: null,
      valorAtualCentavos: 0,
      progressoManual: 0,
      criadaEm: agora,
      atualizadaEm: agora
    },
    {
      id: "exemplo-meta-3",
      titulo: "Organizar o home office",
      descricao: "Melhorar o espaço de trabalho em casa.",
      tipo: "profissional",
      prazo: null,
      situacao: "ativa",
      etapas: [],
      valorAlvoCentavos: null,
      valorAtualCentavos: 0,
      progressoManual: 60,
      criadaEm: agora,
      atualizadaEm: agora
    }
  ];
}

// Lançamentos fictícios do mês atual, para o resumo financeiro do painel.
export function lancamentosDeExemplo() {
  const agora = new Date().toISOString();

  return [
    {
      id: "exemplo-lancamento-1",
      tipo: "receita",
      data: dataNoMesAtual(5),
      valorCentavos: 320000,
      descricao: "Salário",
      categoria: "Outros",
      origem: "manual",
      origemId: null,
      criadoEm: agora
    },
    {
      id: "exemplo-lancamento-2",
      tipo: "despesa",
      data: dataNoMesAtual(10),
      valorCentavos: 120000,
      descricao: "Aluguel",
      categoria: "Moradia",
      origem: "manual",
      origemId: null,
      criadoEm: agora
    },
    {
      id: "exemplo-lancamento-3",
      tipo: "despesa",
      data: dataNoMesAtual(15),
      valorCentavos: 45000,
      descricao: "Mercado",
      categoria: "Alimentação",
      origem: "manual",
      origemId: null,
      criadoEm: agora
    },
    {
      id: "exemplo-lancamento-4",
      tipo: "despesa",
      data: dataNoMesAtual(20),
      valorCentavos: 12000,
      descricao: "Internet",
      categoria: "Moradia",
      origem: "manual",
      origemId: null,
      criadoEm: agora
    }
  ];
}

// Contas fixas fictícias com vencimentos próximos, para o bloco de 7 dias.
export function contasFixasDeExemplo() {
  const hoje = hojeISO();
  const emDoisDias = Number(somarDias(hoje, 2).slice(8, 10));
  const emCincoDias = Number(somarDias(hoje, 5).slice(8, 10));

  return [
    {
      id: "exemplo-conta-1",
      nome: "Aluguel",
      tipo: "despesa",
      valorPrevistoCentavos: 120000,
      diaVencimento: emDoisDias,
      categoria: "Moradia",
      ativa: true,
      inicioEm: null,
      fimEm: null
    },
    {
      id: "exemplo-conta-2",
      nome: "Internet",
      tipo: "despesa",
      valorPrevistoCentavos: 12000,
      diaVencimento: emCincoDias,
      categoria: "Moradia",
      ativa: true,
      inicioEm: null,
      fimEm: null
    },
    {
      id: "exemplo-conta-3",
      nome: "Salário",
      tipo: "receita",
      valorPrevistoCentavos: 320000,
      diaVencimento: 5,
      categoria: "Outros",
      ativa: true,
      inicioEm: null,
      fimEm: null
    }
  ];
}
