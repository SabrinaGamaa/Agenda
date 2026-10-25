// Testes para js/regras/painel.js
// Cobrem os quatro blocos do painel principal e a janela de 7 dias.

import { describe } from "./testes.js";
import {
  tarefasDoPainel,
  metasAtivasDoPainel,
  resumoFinanceiroDoPainel,
  contasAVencerDoPainel,
  resumoPainel
} from "../js/regras/painel.js";

const HOJE = "2026-10-24";

let contador = 0;

function proximoId(prefixo) {
  contador += 1;
  return `${prefixo}-${contador}`;
}

function estadoBase() {
  return {
    config: {
      categoriasTarefas: ["Trabalho", "Pessoal", "Saúde"],
      categoriasFinancas: ["Moradia", "Alimentação", "Outros"]
    },
    tarefas: [],
    metas: [],
    lancamentos: [],
    contasFixas: [],
    pagamentos: []
  };
}

function tarefaFalsa(campos = {}) {
  return {
    id: proximoId("tarefa"),
    titulo: "Tarefa de teste",
    descricao: null,
    categoria: "Trabalho",
    prioridade: "media",
    data: HOJE,
    horaInicio: "09:00",
    duracaoMinutos: 30,
    recorrencia: null,
    metaId: null,
    excecoes: {},
    criadaEm: "2026-10-01T10:00:00.000Z",
    atualizadaEm: "2026-10-01T10:00:00.000Z",
    ...campos
  };
}

function metaFalsa(campos = {}) {
  return {
    id: proximoId("meta"),
    titulo: "Meta de teste",
    descricao: null,
    tipo: "pessoal",
    prazo: null,
    situacao: "ativa",
    etapas: [],
    valorAlvoCentavos: null,
    valorAtualCentavos: 0,
    progressoManual: 0,
    criadaEm: "2026-10-01T10:00:00.000Z",
    atualizadaEm: "2026-10-01T10:00:00.000Z",
    ...campos
  };
}

function lancamentoFalso(campos = {}) {
  return {
    id: proximoId("lancamento"),
    tipo: "despesa",
    data: "2026-10-10",
    valorCentavos: 1000,
    descricao: "Lançamento de teste",
    categoria: "Outros",
    origem: "manual",
    origemId: null,
    criadoEm: "2026-10-01T10:00:00.000Z",
    ...campos
  };
}

function contaFalsa(campos = {}) {
  return {
    id: proximoId("conta"),
    nome: "Conta de teste",
    tipo: "despesa",
    valorPrevistoCentavos: 10000,
    diaVencimento: 10,
    categoria: "Moradia",
    ativa: true,
    inicioEm: null,
    fimEm: null,
    ...campos
  };
}

describe("painel — tarefas", (suite) => {
  suite.test("separa pendentes de hoje e próximas e ignora concluídas", (Assert) => {
    const estado = estadoBase();
    estado.tarefas = [
      tarefaFalsa({ titulo: "Hoje pendente", horaInicio: "10:00" }),
      tarefaFalsa({
        titulo: "Hoje concluída",
        horaInicio: "08:00",
        excecoes: { [HOJE]: { concluida: true } }
      }),
      tarefaFalsa({
        titulo: "Amanhã",
        data: "2026-10-25",
        horaInicio: "09:00"
      }),
      tarefaFalsa({
        titulo: "Daqui a 7 dias",
        data: "2026-10-31",
        horaInicio: "09:00"
      }),
      tarefaFalsa({
        titulo: "Fora da janela",
        data: "2026-11-01",
        horaInicio: "09:00"
      })
    ];

    const resultado = tarefasDoPainel(estado, HOJE);

    Assert.equals(resultado.dataBase, HOJE);
    Assert.equals(resultado.limite, "2026-10-31");
    Assert.equals(resultado.totalHoje, 1);
    Assert.equals(resultado.totalProximas, 2);
    Assert.equals(resultado.concluidasHoje, 1);
    Assert.equals(resultado.hoje[0].titulo, "Hoje pendente");
    Assert.deepEquals(
      resultado.proximas.map((tarefa) => tarefa.titulo),
      ["Amanhã", "Daqui a 7 dias"]
    );
  });

  suite.test("inclui recorrência e respeita exceções por ocorrência", (Assert) => {
    const estado = estadoBase();
    estado.tarefas = [
      tarefaFalsa({
        titulo: "Série diária",
        data: HOJE,
        recorrencia: {
          tipo: "diaria",
          intervalo: 1,
          fim: { tipo: "nunca" }
        },
        excecoes: {
          "2026-10-25": { concluida: true },
          "2026-10-26": { cancelada: true }
        }
      })
    ];

    const resultado = tarefasDoPainel(estado, HOJE);

    Assert.equals(resultado.totalHoje, 1);
    Assert.equals(resultado.totalProximas, 5, "7 dias menos 1 concluída e 1 cancelada");
    Assert.equals(resultado.proximas.length, 3, "a lista exibida é limitada");
    Assert.deepEquals(
      resultado.proximas.map((tarefa) => tarefa.dataOcorrencia),
      ["2026-10-27", "2026-10-28", "2026-10-29"]
    );
  });

  suite.test("limita a lista, mas mantém os totais completos", (Assert) => {
    const estado = estadoBase();
    estado.tarefas = [
      ...Array.from({ length: 5 }, (_, indice) =>
        tarefaFalsa({
          titulo: `Hoje ${indice}`,
          horaInicio: `0${indice + 1}:00`
        })
      ),
      ...Array.from({ length: 4 }, (_, indice) =>
        tarefaFalsa({
          titulo: `Amanhã ${indice}`,
          data: "2026-10-25",
          horaInicio: `0${indice + 1}:00`
        })
      )
    ];

    const resultado = tarefasDoPainel(estado, HOJE);

    Assert.equals(resultado.hoje.length, 3);
    Assert.equals(resultado.totalHoje, 5);
    Assert.equals(resultado.proximas.length, 3);
    Assert.equals(resultado.totalProximas, 4);
  });

  suite.test("carrega 500 tarefas sem perder a contagem", (Assert) => {
    const estado = estadoBase();
    estado.tarefas = Array.from({ length: 500 }, (_, indice) =>
      tarefaFalsa({
        titulo: `Tarefa ${indice}`,
        horaInicio: "09:00"
      })
    );

    const resultado = tarefasDoPainel(estado, HOJE);

    Assert.equals(resultado.totalHoje, 500);
    Assert.equals(resultado.hoje.length, 3);
  });
});

describe("painel — metas", (suite) => {
  suite.test("filtra ativas, calcula progresso e ordena por prazo", (Assert) => {
    const estado = estadoBase();
    estado.metas = [
      metaFalsa({
        titulo: "Financeira",
        tipo: "financeira",
        prazo: "2027-03-01",
        valorAlvoCentavos: 100000,
        valorAtualCentavos: 25000
      }),
      metaFalsa({
        titulo: "Com etapas",
        prazo: "2027-01-10",
        etapas: [
          { id: "etapa-1", titulo: "Primeira", concluida: true },
          { id: "etapa-2", titulo: "Segunda", concluida: false }
        ]
      }),
      metaFalsa({
        titulo: "Manual",
        prazo: null,
        progressoManual: 70
      }),
      metaFalsa({
        titulo: "Concluída",
        situacao: "concluida",
        progressoManual: 100
      }),
      metaFalsa({
        titulo: "Abandonada",
        situacao: "abandonada"
      })
    ];

    const resultado = metasAtivasDoPainel(estado);

    Assert.equals(resultado.total, 3);
    Assert.deepEquals(
      resultado.itens.map((item) => item.meta.titulo),
      ["Com etapas", "Financeira", "Manual"]
    );
    Assert.equals(resultado.itens[0].progresso, 50);
    Assert.equals(resultado.itens[1].progresso, 25);
    Assert.equals(resultado.itens[2].progresso, 70);
  });

  suite.test("limita a quantidade exibida e informa o total", (Assert) => {
    const estado = estadoBase();
    estado.metas = Array.from({ length: 4 }, (_, indice) =>
      metaFalsa({ titulo: `Meta ${indice}` })
    );

    const resultado = metasAtivasDoPainel(estado, 2);

    Assert.equals(resultado.itens.length, 2);
    Assert.equals(resultado.total, 4);
  });
});

describe("painel — finanças", (suite) => {
  suite.test("resume a competência da data-base", (Assert) => {
    const estado = estadoBase();
    estado.lancamentos = [
      lancamentoFalso({
        tipo: "receita",
        data: "2026-10-05",
        valorCentavos: 100000
      }),
      lancamentoFalso({
        tipo: "despesa",
        data: "2026-10-10",
        valorCentavos: 40000
      }),
      lancamentoFalso({
        tipo: "despesa",
        data: "2026-09-30",
        valorCentavos: 99999
      })
    ];

    const resultado = resumoFinanceiroDoPainel(estado, HOJE);

    Assert.equals(resultado.competencia, "2026-10");
    Assert.equals(resultado.receitasCentavos, 100000);
    Assert.equals(resultado.despesasCentavos, 40000);
    Assert.equals(resultado.saldoCentavos, 60000);
    Assert.equals(resultado.quantidadeLancamentos, 2);
    Assert.false(resultado.vazio);
  });

  suite.test("marca mês sem lançamentos como vazio", (Assert) => {
    const resultado = resumoFinanceiroDoPainel(estadoBase(), HOJE);

    Assert.equals(resultado.competencia, "2026-10");
    Assert.equals(resultado.quantidadeLancamentos, 0);
    Assert.true(resultado.vazio);
  });
});

describe("painel — contas a vencer", (suite) => {
  suite.test("inclui a virada de mês e ignora pagas, vencidas e fora da janela", (Assert) => {
    const estado = estadoBase();
    estado.contasFixas = [
      contaFalsa({
        id: "conta-outubro",
        nome: "Outubro",
        diaVencimento: 30
      }),
      contaFalsa({
        id: "conta-novembro",
        nome: "Novembro",
        diaVencimento: 2
      }),
      contaFalsa({
        id: "conta-fora",
        nome: "Fora da janela",
        diaVencimento: 5
      }),
      contaFalsa({
        id: "conta-vencida",
        nome: "Vencida",
        diaVencimento: 27
      }),
      contaFalsa({
        id: "conta-paga",
        nome: "Paga",
        diaVencimento: 29
      }),
      contaFalsa({
        id: "conta-inativa",
        nome: "Inativa",
        diaVencimento: 30,
        ativa: false
      })
    ];
    estado.lancamentos = [
      lancamentoFalso({
        id: "lancamento-pago",
        data: "2026-10-29",
        valorCentavos: 10000
      })
    ];
    estado.pagamentos = [
      {
        id: "pagamento-pago",
        contaFixaId: "conta-paga",
        competencia: "2026-10",
        valorPagoCentavos: 10000,
        dataPagamento: "2026-10-29",
        lancamentoId: "lancamento-pago",
        criadoEm: "2026-10-29T10:00:00.000Z"
      }
    ];

    const resultado = contasAVencerDoPainel(estado, "2026-10-28");

    Assert.equals(resultado.limite, "2026-11-04");
    Assert.equals(resultado.total, 2);
    Assert.equals(resultado.temContasFixas, true);
    Assert.deepEquals(
      resultado.itens.map((conta) => conta.nome),
      ["Outubro", "Novembro"]
    );
    Assert.deepEquals(
      resultado.itens.map((conta) => conta.dataVencimento),
      ["2026-10-30", "2026-11-02"]
    );
    Assert.deepEquals(
      resultado.itens.map((conta) => conta.competencia),
      ["2026-10", "2026-11"]
    );
  });

  suite.test("diferencia nenhuma conta cadastrada de nenhuma conta na janela", (Assert) => {
    const semContas = contasAVencerDoPainel(estadoBase(), HOJE);
    Assert.false(semContas.temContasFixas);
    Assert.equals(semContas.total, 0);

    const estado = estadoBase();
    estado.contasFixas = [
      contaFalsa({ nome: "Longe", diaVencimento: 10 })
    ];

    const semVencimento = contasAVencerDoPainel(estado, HOJE);
    Assert.true(semVencimento.temContasFixas);
    Assert.equals(semVencimento.total, 0);
  });

  suite.test("carrega 500 contas e limita os itens exibidos", (Assert) => {
    const estado = estadoBase();
    estado.contasFixas = Array.from({ length: 500 }, (_, indice) =>
      contaFalsa({
        nome: `Conta ${indice}`,
        diaVencimento: 30
      })
    );

    const resultado = contasAVencerDoPainel(estado, "2026-10-28");

    Assert.equals(resultado.total, 500);
    Assert.equals(resultado.itens.length, 3);
  });
});

describe("painel — resumo completo", (suite) => {
  suite.test("devolve os quatro blocos com a mesma data-base", (Assert) => {
    const estado = estadoBase();
    estado.tarefas = [
      tarefaFalsa({ titulo: "Tarefa de hoje", horaInicio: "09:00" })
    ];
    estado.metas = [metaFalsa({ titulo: "Meta ativa" })];
    estado.lancamentos = [
      lancamentoFalso({
        tipo: "receita",
        data: "2026-10-05",
        valorCentavos: 50000
      })
    ];
    estado.contasFixas = [
      contaFalsa({ nome: "Conta próxima", diaVencimento: 26 })
    ];

    const resultado = resumoPainel(estado, HOJE);

    Assert.equals(resultado.dataBase, HOJE);
    Assert.equals(resultado.tarefas.totalHoje, 1);
    Assert.equals(resultado.metas.total, 1);
    Assert.equals(resultado.financas.competencia, "2026-10");
    Assert.equals(resultado.contas.total, 1);
  });
});
