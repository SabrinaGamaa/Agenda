// Testes para js/regras/financas.js

import { describe } from "./testes.js";
import {
  criarLancamento,
  encontrarLancamento,
  atualizarLancamento,
  excluirLancamento,
  validarLancamento,
  lancamentosDoMes,
  resumoDoMes,
  resumoDoDia,
  totaisPorCategoria,
  percentualDoTotal,
  compararComMesAnterior,
  possivelDuplicata,
  competenciaDaData,
  somarCompetencias,
  formatarCompetencia
} from "../js/regras/financas.js";

const CATEGORIAS = ["Moradia", "Alimentação", "Transporte", "Lazer", "Outros"];

function criarEstado(lancamentos = []) {
  return {
    config: { categoriasFinancas: [...CATEGORIAS] },
    lancamentos
  };
}

function criarLancamentoFalso(campos = {}) {
  return {
    id: campos.id ?? crypto.randomUUID(),
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

describe("finanças — lançamentos", (suite) => {
  suite.test("criarLancamento gera um lançamento completo", (Assert) => {
    const novo = criarLancamento({
      tipo: "receita",
      data: "2026-10-24",
      valorCentavos: 250050,
      descricao: "  Salário  ",
      categoria: "Outros"
    });

    Assert.true(typeof novo.id === "string" && novo.id.length > 0, "gera id");
    Assert.equals(novo.tipo, "receita");
    Assert.equals(novo.data, "2026-10-24");
    Assert.equals(novo.valorCentavos, 250050);
    Assert.equals(novo.descricao, "Salário", "remove espaços da descrição");
    Assert.equals(novo.categoria, "Outros");
    Assert.equals(novo.origem, "manual");
    Assert.equals(novo.origemId, null);
    Assert.true(typeof novo.criadoEm === "string", "registra criadoEm em ISO");
  });

  suite.test("criarLancamento usa padrões seguros", (Assert) => {
    const padrao = criarLancamento();
    Assert.equals(padrao.tipo, "despesa");
    Assert.equals(padrao.data, null);
    Assert.equals(padrao.valorCentavos, 0);
    Assert.equals(padrao.descricao, null);
    Assert.equals(padrao.categoria, null);

    const invalido = criarLancamento({
      tipo: "doacao",
      data: "2026-02-31",
      valorCentavos: -50,
      descricao: "   ",
      categoria: "   "
    });
    Assert.equals(invalido.tipo, "despesa", "tipo inválido vira despesa");
    Assert.equals(invalido.data, null, "data inexistente vira null");
    Assert.equals(invalido.valorCentavos, 0, "valor negativo vira zero");
    Assert.equals(invalido.descricao, null, "descrição vazia vira null");
    Assert.equals(invalido.categoria, null, "categoria vazia vira null");
  });

  suite.test("validarLancamento aceita um lançamento correto", (Assert) => {
    const erros = validarLancamento({
      tipo: "despesa",
      data: "2026-10-10",
      valorCentavos: 2590,
      descricao: "Mercado",
      categoria: "Alimentação"
    }, CATEGORIAS);

    Assert.deepEquals(erros, []);
  });

  suite.test("validarLancamento aponta todos os problemas", (Assert) => {
    const erros = validarLancamento({
      tipo: "doacao",
      data: "2026-02-31",
      valorCentavos: 0,
      descricao: "   ",
      categoria: "Viagem"
    }, CATEGORIAS);

    Assert.equals(erros.length, 5, "um erro para cada campo inválido");
    Assert.includes(erros, "Escolha o tipo do lançamento (receita ou despesa).");
    Assert.includes(erros, "Informe uma data válida.");
    Assert.includes(erros, "Informe um valor maior que zero.");
    Assert.includes(erros, "Informe a descrição do lançamento.");
    Assert.includes(erros, "Escolha uma categoria da lista de categorias financeiras.");
  });

  suite.test("validarLancamento recusa valor decimal e data impossível", (Assert) => {
    const base = {
      tipo: "receita",
      data: "2024-02-29",
      valorCentavos: 100,
      descricao: "Teste",
      categoria: "Outros"
    };

    Assert.deepEquals(validarLancamento(base, CATEGORIAS), [], "29/02 em ano bissexto é válido");
    Assert.equals(
      validarLancamento({ ...base, data: "2026-02-29" }, CATEGORIAS).length,
      1,
      "29/02 em ano comum é recusado"
    );
    Assert.equals(
      validarLancamento({ ...base, valorCentavos: 12.5 }, CATEGORIAS).length,
      1,
      "valor em reais (decimal) é recusado: use centavos"
    );
  });

  suite.test("validarLancamento sem lista de categorias só exige preenchimento", (Assert) => {
    const campos = {
      tipo: "despesa",
      data: "2026-10-10",
      valorCentavos: 500,
      descricao: "Café",
      categoria: "Categoria nova"
    };

    Assert.deepEquals(validarLancamento(campos), []);
    Assert.equals(validarLancamento({ ...campos, categoria: "  " }).length, 1);
  });

  suite.test("atualizarLancamento altera só os campos enviados", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ id: "l1", descricao: "Mercado", valorCentavos: 1000 })
    ]);
    const criadoEmOriginal = estado.lancamentos[0].criadoEm;

    const atualizado = atualizarLancamento(estado, "l1", {
      valorCentavos: 2500,
      descricao: "Mercado do mês"
    });

    Assert.equals(atualizado.valorCentavos, 2500);
    Assert.equals(atualizado.descricao, "Mercado do mês");
    Assert.equals(atualizado.data, "2026-10-10", "data não enviada é preservada");
    Assert.equals(atualizado.criadoEm, criadoEmOriginal, "criadoEm é preservado");
    Assert.equals(encontrarLancamento(estado, "l1").valorCentavos, 2500);
    Assert.equals(atualizarLancamento(estado, "nao-existe", { valorCentavos: 1 }), null);
  });

  suite.test("excluirLancamento remove e devolve o lançamento", (Assert) => {
    const estado = criarEstado([criarLancamentoFalso({ id: "l1" })]);

    const removido = excluirLancamento(estado, "l1");
    Assert.equals(removido.id, "l1");
    Assert.equals(estado.lancamentos.length, 0);
    Assert.equals(excluirLancamento(estado, "l1"), null);
  });
});

describe("finanças — relatórios", (suite) => {
  suite.test("lancamentosDoMes filtra e ordena por data", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ id: "a", data: "2026-10-20" }),
      criarLancamentoFalso({ id: "b", data: "2026-10-01" }),
      criarLancamentoFalso({ id: "c", data: "2026-09-30" }),
      criarLancamentoFalso({ id: "d", data: "2026-11-01" }),
      criarLancamentoFalso({ id: "e", data: null })
    ]);

    const outubro = lancamentosDoMes(estado, "2026-10");
    Assert.equals(outubro.length, 2);
    Assert.deepEquals(outubro.map((item) => item.id), ["b", "a"]);
    Assert.equals(lancamentosDoMes(estado, "2026-13").length, 0, "competência inválida");
  });

  suite.test("resumoDoMes soma centavos exatos", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "receita", data: "2026-10-05", valorCentavos: 1000 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-05", valorCentavos: 10 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-06", valorCentavos: 10 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-07", valorCentavos: 10 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-09-30", valorCentavos: 999 })
    ]);

    const resumo = resumoDoMes(estado, "2026-10");
    Assert.equals(resumo.receitasCentavos, 1000);
    Assert.equals(resumo.despesasCentavos, 30, "3 x R$ 0,10 = R$ 0,30");
    Assert.equals(resumo.saldoCentavos, 970);
    Assert.equals(resumo.quantidadeLancamentos, 4);

    const vazio = resumoDoMes(estado, "2026-08");
    Assert.equals(vazio.receitasCentavos, 0);
    Assert.equals(vazio.despesasCentavos, 0);
    Assert.equals(vazio.saldoCentavos, 0);
    Assert.equals(vazio.quantidadeLancamentos, 0);
  });

  suite.test("resumoDoMes ignora valores inválidos vindos de backup", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "despesa", valorCentavos: "abc" }),
      criarLancamentoFalso({ tipo: "despesa", valorCentavos: -500 }),
      criarLancamentoFalso({ tipo: "despesa", valorCentavos: 250 })
    ]);

    Assert.equals(resumoDoMes(estado, "2026-10").despesasCentavos, 250);
  });

  suite.test("resumoDoDia soma só o dia escolhido", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "receita", data: "2026-10-10", valorCentavos: 500 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-10", valorCentavos: 200 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-11", valorCentavos: 999 })
    ]);

    const resumo = resumoDoDia(estado, "2026-10-10");
    Assert.equals(resumo.data, "2026-10-10");
    Assert.equals(resumo.receitasCentavos, 500);
    Assert.equals(resumo.despesasCentavos, 200);
    Assert.equals(resumo.saldoCentavos, 300);
    Assert.equals(resumo.quantidadeLancamentos, 2);

    const vazio = resumoDoDia(estado, "2026-10-12");
    Assert.equals(vazio.saldoCentavos, 0);
    Assert.equals(vazio.quantidadeLancamentos, 0);
  });

  suite.test("resumoDoDia recusa data inválida", (Assert) => {
    const estado = criarEstado([criarLancamentoFalso()]);
    const resumo = resumoDoDia(estado, "2026-02-31");

    Assert.equals(resumo.data, null);
    Assert.equals(resumo.receitasCentavos, 0);
    Assert.equals(resumo.despesasCentavos, 0);
    Assert.equals(resumo.quantidadeLancamentos, 0);
  });

  suite.test("totaisPorCategoria agrupa, soma e ordena", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-02", valorCentavos: 1000, categoria: "Alimentação" }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-03", valorCentavos: 2000, categoria: "Alimentação" }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-04", valorCentavos: 5000, categoria: "Transporte" }),
      criarLancamentoFalso({ tipo: "receita", data: "2026-10-05", valorCentavos: 9000, categoria: "Outros" })
    ]);

    const despesas = totaisPorCategoria(estado, "2026-10", "despesa");
    Assert.equals(despesas.length, 2);
    Assert.equals(despesas[0].categoria, "Transporte");
    Assert.equals(despesas[0].totalCentavos, 5000);
    Assert.equals(despesas[0].quantidade, 1);
    Assert.equals(despesas[1].categoria, "Alimentação");
    Assert.equals(despesas[1].totalCentavos, 3000);
    Assert.equals(despesas[1].quantidade, 2);

    const receitas = totaisPorCategoria(estado, "2026-10", "receita");
    Assert.equals(receitas.length, 1);
    Assert.equals(receitas[0].categoria, "Outros");
    Assert.equals(receitas[0].totalCentavos, 9000);
  });

  suite.test("totaisPorCategoria separa receita e despesa da mesma categoria", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "despesa", valorCentavos: 1000, categoria: "Outros" }),
      criarLancamentoFalso({ tipo: "receita", valorCentavos: 3000, categoria: "Outros" })
    ]);

    const todas = totaisPorCategoria(estado, "2026-10");
    Assert.equals(todas.length, 2);
    Assert.equals(todas[0].tipo, "receita");
    Assert.equals(todas[0].totalCentavos, 3000);
    Assert.equals(todas[1].tipo, "despesa");
    Assert.equals(todas[1].totalCentavos, 1000);
  });

  suite.test("totaisPorCategoria usa 'Sem categoria' para dados antigos", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ categoria: null, valorCentavos: 700 })
    ]);

    const totais = totaisPorCategoria(estado, "2026-10");
    Assert.equals(totais[0].categoria, "Sem categoria");
    Assert.equals(totais[0].totalCentavos, 700);
  });

  suite.test("compararComMesAnterior calcula R$ e %", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "receita", data: "2026-09-10", valorCentavos: 80000 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-09-11", valorCentavos: 20000 }),
      criarLancamentoFalso({ tipo: "receita", data: "2026-10-10", valorCentavos: 100000 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-11", valorCentavos: 30000 })
    ]);

    const comparacao = compararComMesAnterior(estado, "2026-10");
    Assert.equals(comparacao.competenciaAnterior, "2026-09");

    Assert.equals(comparacao.receitas.atualCentavos, 100000);
    Assert.equals(comparacao.receitas.anteriorCentavos, 80000);
    Assert.equals(comparacao.receitas.diferencaCentavos, 20000);
    Assert.equals(comparacao.receitas.percentual, 25);

    Assert.equals(comparacao.despesas.diferencaCentavos, 10000);
    Assert.equals(comparacao.despesas.percentual, 50);

    Assert.equals(comparacao.saldo.atualCentavos, 70000);
    Assert.equals(comparacao.saldo.anteriorCentavos, 60000);
    Assert.equals(comparacao.saldo.diferencaCentavos, 10000);
    Assert.equals(comparacao.saldo.percentual, 16.7, "arredonda para uma casa decimal");
  });

  suite.test("compararComMesAnterior atravessa a virada do ano", (Assert) => {
    const estado = criarEstado();
    const comparacao = compararComMesAnterior(estado, "2026-01");

    Assert.equals(comparacao.competenciaAnterior, "2025-12");
    Assert.equals(compararComMesAnterior(estado, "2026-13"), null);
  });

  suite.test("compararComMesAnterior sem base anterior devolve percentual null", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "receita", data: "2026-10-01", valorCentavos: 500 })
    ]);

    const comparacao = compararComMesAnterior(estado, "2026-10");
    Assert.equals(comparacao.receitas.anteriorCentavos, 0);
    Assert.equals(comparacao.receitas.diferencaCentavos, 500);
    Assert.equals(comparacao.receitas.percentual, null, "sem base de comparação");
    Assert.equals(comparacao.despesas.percentual, 0, "zero contra zero é 0%");
  });

  suite.test("compararComMesAnterior usa base absoluta no saldo negativo", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ tipo: "despesa", data: "2026-09-10", valorCentavos: 20000 }),
      criarLancamentoFalso({ tipo: "despesa", data: "2026-10-10", valorCentavos: 10000 })
    ]);

    const comparacao = compararComMesAnterior(estado, "2026-10");
    Assert.equals(comparacao.saldo.anteriorCentavos, -20000);
    Assert.equals(comparacao.saldo.atualCentavos, -10000);
    Assert.equals(comparacao.saldo.diferencaCentavos, 10000);
    Assert.equals(comparacao.saldo.percentual, 50, "melhora de 50% sobre a base absoluta");
  });

  suite.test("percentualDoTotal calcula a participação com uma casa", (Assert) => {
    Assert.equals(percentualDoTotal(500, 1000), 50);
    Assert.equals(percentualDoTotal(1, 3), 33.3);
    Assert.equals(percentualDoTotal(2, 3), 66.7);
    Assert.equals(percentualDoTotal(0, 1000), 0);
    Assert.equals(percentualDoTotal(500, 0), null, "sem total não há percentual");
    Assert.equals(percentualDoTotal(-1, 1000), null, "valor negativo não participa");
  });

  suite.test("relatório de 20 lançamentos confere com a conferência manual", (Assert) => {
    // Outubro tem exatamente 20 lançamentos, com valores escolhidos para conferir na mão:
    // receitas: 3.500,00 + 1.250,50 + 45,90 = 4.796,40
    // despesas: 3.454,73
    // saldo: 1.341,67
    const outubro = [
      { tipo: "receita", data: "2026-10-05", valorCentavos: 350000, categoria: "Outros", descricao: "Salário" },
      { tipo: "receita", data: "2026-10-12", valorCentavos: 125050, categoria: "Outros", descricao: "Freelance" },
      { tipo: "receita", data: "2026-10-20", valorCentavos: 4590, categoria: "Outros", descricao: "Venda" },
      { tipo: "despesa", data: "2026-10-05", valorCentavos: 120000, categoria: "Moradia", descricao: "Aluguel" },
      { tipo: "despesa", data: "2026-10-05", valorCentavos: 45000, categoria: "Moradia", descricao: "Condomínio" },
      { tipo: "despesa", data: "2026-10-10", valorCentavos: 18735, categoria: "Moradia", descricao: "Luz" },
      { tipo: "despesa", data: "2026-10-10", valorCentavos: 9990, categoria: "Moradia", descricao: "Internet" },
      { tipo: "despesa", data: "2026-10-06", valorCentavos: 45678, categoria: "Alimentação", descricao: "Mercado" },
      { tipo: "despesa", data: "2026-10-13", valorCentavos: 12345, categoria: "Alimentação", descricao: "Feira" },
      { tipo: "despesa", data: "2026-10-13", valorCentavos: 1890, categoria: "Alimentação", descricao: "Padaria" },
      { tipo: "despesa", data: "2026-10-07", valorCentavos: 25000, categoria: "Transporte", descricao: "Combustível" },
      { tipo: "despesa", data: "2026-10-08", valorCentavos: 450, categoria: "Transporte", descricao: "Ônibus" },
      { tipo: "despesa", data: "2026-10-09", valorCentavos: 7890, categoria: "Saúde", descricao: "Farmácia" },
      { tipo: "despesa", data: "2026-10-15", valorCentavos: 20000, categoria: "Saúde", descricao: "Consulta" },
      { tipo: "despesa", data: "2026-10-16", valorCentavos: 3500, categoria: "Lazer", descricao: "Cinema" },
      { tipo: "despesa", data: "2026-10-17", valorCentavos: 3990, categoria: "Lazer", descricao: "Streaming" },
      { tipo: "despesa", data: "2026-10-18", valorCentavos: 5990, categoria: "Lazer", descricao: "Livro" },
      { tipo: "despesa", data: "2026-10-19", valorCentavos: 15000, categoria: "Outros", descricao: "Presente" },
      { tipo: "despesa", data: "2026-10-21", valorCentavos: 1250, categoria: "Alimentação", descricao: "Café" },
      { tipo: "despesa", data: "2026-10-22", valorCentavos: 8765, categoria: "Outros", descricao: "Material" }
    ].map((item) => criarLancamentoFalso(item));

    // Setembro serve de base para a comparação:
    // receitas 4.800,00; despesas 1.750,00; saldo 3.050,00.
    const setembro = [
      { tipo: "receita", data: "2026-09-05", valorCentavos: 400000, categoria: "Outros", descricao: "Salário" },
      { tipo: "receita", data: "2026-09-20", valorCentavos: 80000, categoria: "Outros", descricao: "Freelance" },
      { tipo: "despesa", data: "2026-09-05", valorCentavos: 120000, categoria: "Moradia", descricao: "Aluguel" },
      { tipo: "despesa", data: "2026-09-10", valorCentavos: 40000, categoria: "Alimentação", descricao: "Mercado" },
      { tipo: "despesa", data: "2026-09-15", valorCentavos: 15000, categoria: "Lazer", descricao: "Lazer" }
    ].map((item) => criarLancamentoFalso(item));

    const estado = criarEstado([...setembro, ...outubro]);

    const resumo = resumoDoMes(estado, "2026-10");
    Assert.equals(resumo.quantidadeLancamentos, 20);
    Assert.equals(resumo.receitasCentavos, 479640);
    Assert.equals(resumo.despesasCentavos, 345473);
    Assert.equals(resumo.saldoCentavos, 134167);

    const dia5 = resumoDoDia(estado, "2026-10-05");
    Assert.equals(dia5.receitasCentavos, 350000);
    Assert.equals(dia5.despesasCentavos, 165000);
    Assert.equals(dia5.saldoCentavos, 185000);
    Assert.equals(dia5.quantidadeLancamentos, 3);

    const despesas = totaisPorCategoria(estado, "2026-10", "despesa");
    Assert.deepEquals(
      despesas.map((item) => [item.categoria, item.totalCentavos, item.quantidade]),
      [
        ["Moradia", 193725, 4],
        ["Alimentação", 61163, 4],
        ["Saúde", 27890, 2],
        ["Transporte", 25450, 2],
        ["Outros", 23765, 2],
        ["Lazer", 13480, 3]
      ]
    );
    Assert.equals(
      percentualDoTotal(despesas[0].totalCentavos, resumo.despesasCentavos),
      56.1
    );

    const receitas = totaisPorCategoria(estado, "2026-10", "receita");
    Assert.deepEquals(
      receitas.map((item) => [item.categoria, item.totalCentavos, item.quantidade]),
      [["Outros", 479640, 3]]
    );

    const comparacao = compararComMesAnterior(estado, "2026-10");
    Assert.equals(comparacao.receitas.anteriorCentavos, 480000);
    Assert.equals(comparacao.receitas.diferencaCentavos, -360);
    Assert.equals(comparacao.receitas.percentual, -0.1);
    Assert.equals(comparacao.despesas.anteriorCentavos, 175000);
    Assert.equals(comparacao.despesas.diferencaCentavos, 170473);
    Assert.equals(comparacao.despesas.percentual, 97.4);
    Assert.equals(comparacao.saldo.anteriorCentavos, 305000);
    Assert.equals(comparacao.saldo.diferencaCentavos, -170833);
    Assert.equals(comparacao.saldo.percentual, -56);

    const totalDespesas = despesas.reduce(
      (soma, item) => soma + item.totalCentavos,
      0
    );
    Assert.equals(
      totalDespesas,
      resumo.despesasCentavos,
      "as categorias fecham com o total do mês"
    );
  });
});

describe("finanças — duplicatas e competências", (suite) => {
  suite.test("possivelDuplicata compara tipo, data e valor", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({
        id: "existente",
        tipo: "despesa",
        data: "2026-10-10",
        valorCentavos: 2500
      })
    ]);

    const encontrado = possivelDuplicata(estado, {
      tipo: "despesa",
      data: "2026-10-10",
      valorCentavos: 2500
    });
    Assert.equals(encontrado?.id, "existente");

    Assert.equals(
      possivelDuplicata(estado, { tipo: "receita", data: "2026-10-10", valorCentavos: 2500 }),
      null,
      "tipo diferente não é duplicata"
    );
    Assert.equals(
      possivelDuplicata(estado, { tipo: "despesa", data: "2026-10-10", valorCentavos: 2501 }),
      null,
      "valor diferente não é duplicata"
    );
    Assert.equals(
      possivelDuplicata(estado, { tipo: "despesa", data: "2026-10-11", valorCentavos: 2500 }),
      null,
      "data diferente não é duplicata"
    );
  });

  suite.test("possivelDuplicata ignora o próprio lançamento na edição", (Assert) => {
    const estado = criarEstado([
      criarLancamentoFalso({ id: "l1", valorCentavos: 2500, data: "2026-10-10" })
    ]);

    Assert.equals(
      possivelDuplicata(estado, { tipo: "despesa", data: "2026-10-10", valorCentavos: 2500 }, "l1"),
      null
    );
  });

  suite.test("possivelDuplicata ignora campos inválidos", (Assert) => {
    const estado = criarEstado([criarLancamentoFalso({ id: "l1" })]);

    Assert.equals(possivelDuplicata(estado, {}, null), null);
    Assert.equals(
      possivelDuplicata(estado, { tipo: "doacao", data: "2026-10-10", valorCentavos: 1000 }),
      null
    );
  });

  suite.test("competenciaDaData extrai o mês", (Assert) => {
    Assert.equals(competenciaDaData("2026-10-24"), "2026-10");
    Assert.equals(competenciaDaData("2026-01-01"), "2026-01");
    Assert.equals(competenciaDaData("2026-13-01"), null);
    Assert.equals(competenciaDaData("texto"), null);
    Assert.equals(competenciaDaData(null), null);
  });

  suite.test("somarCompetencias anda para frente e para trás", (Assert) => {
    Assert.equals(somarCompetencias("2026-10", 1), "2026-11");
    Assert.equals(somarCompetencias("2026-10", 3), "2027-01");
    Assert.equals(somarCompetencias("2026-01", -1), "2025-12");
    Assert.equals(somarCompetencias("2026-01", -13), "2024-12");
    Assert.equals(somarCompetencias("2026-01", 0), "2026-01");
    Assert.equals(somarCompetencias("2026-13", 1), null);
    Assert.equals(somarCompetencias("2026-01", 1.5), null);
  });

  suite.test("formatarCompetencia mostra mês e ano em português", (Assert) => {
    Assert.equals(formatarCompetencia("2026-10"), "Outubro de 2026");
    Assert.equals(formatarCompetencia("2026-01"), "Janeiro de 2026");
    Assert.equals(formatarCompetencia("2026-12"), "Dezembro de 2026");
    Assert.equals(formatarCompetencia("2026-13"), "");
    Assert.equals(formatarCompetencia(""), "");
  });
});
