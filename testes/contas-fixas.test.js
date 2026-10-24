// Testes para js/regras/contas-fixas.js

import { describe } from "./testes.js";
import {
  MESES_HISTORICO_PROJECAO,
  criarContaFixa,
  encontrarContaFixa,
  atualizarContaFixa,
  excluirContaFixa,
  validarContaFixa,
  dataVencimento,
  contaVigenteNaCompetencia,
  contasDoMes,
  resumoContasDoMes,
  encontrarPagamento,
  pagamentosDaConta,
  pagamentoDaContaNaCompetencia,
  validarPagamento,
  registrarPagamento,
  atualizarPagamento,
  excluirPagamento,
  mediaMensalVariavel,
  projetarMes
} from "../js/regras/contas-fixas.js";
import { resumoDoMes } from "../js/regras/financas.js";

const CATEGORIAS = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Outros"
];

function criarEstado({
  contasFixas = [],
  pagamentos = [],
  lancamentos = []
} = {}) {
  return {
    config: { categoriasFinancas: [...CATEGORIAS] },
    contasFixas,
    pagamentos,
    lancamentos
  };
}

function criarContaFalsa(campos = {}) {
  return {
    id: campos.id ?? crypto.randomUUID(),
    nome: "Aluguel",
    tipo: "despesa",
    valorPrevistoCentavos: 120000,
    diaVencimento: 5,
    categoria: "Moradia",
    ativa: true,
    inicioEm: null,
    fimEm: null,
    ...campos
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

function mensagemInclui(mensagens, trecho) {
  return mensagens.some((mensagem) => mensagem.includes(trecho));
}

// --- Cadastro ---

describe("contas fixas — cadastro", (suite) => {
  suite.test("criar conta fixa normaliza os campos", (Assert) => {
    const conta = criarContaFixa({
      nome: "  Aluguel  ",
      tipo: "receita",
      valorPrevistoCentavos: "123456",
      diaVencimento: "31",
      categoria: "  Moradia ",
      ativa: "false",
      inicioEm: "2026-10-01",
      fimEm: "2026-12-31"
    });

    Assert.true(typeof conta.id === "string" && conta.id.length > 0, "gera id");
    Assert.equals(conta.nome, "Aluguel");
    Assert.equals(conta.tipo, "receita");
    Assert.equals(conta.valorPrevistoCentavos, 123456);
    Assert.equals(conta.diaVencimento, 31);
    Assert.equals(conta.categoria, "Moradia");
    Assert.false(conta.ativa);
    Assert.equals(conta.inicioEm, "2026-10-01");
    Assert.equals(conta.fimEm, "2026-12-31");
  });

  suite.test("criar conta fixa usa padrões seguros", (Assert) => {
    const conta = criarContaFixa();

    Assert.equals(conta.nome, null);
    Assert.equals(conta.tipo, "despesa");
    Assert.equals(conta.valorPrevistoCentavos, 0);
    Assert.equals(conta.diaVencimento, 0);
    Assert.equals(conta.categoria, null);
    Assert.true(conta.ativa);
    Assert.equals(conta.inicioEm, null);
    Assert.equals(conta.fimEm, null);
  });

  suite.test("criar conta fixa descarta valores inválidos", (Assert) => {
    const conta = criarContaFixa({
      tipo: "invalido",
      valorPrevistoCentavos: -10,
      diaVencimento: 32,
      inicioEm: "2026-02-31",
      fimEm: "2026-13-01"
    });

    Assert.equals(conta.tipo, "despesa");
    Assert.equals(conta.valorPrevistoCentavos, 0);
    Assert.equals(conta.diaVencimento, 0);
    Assert.equals(conta.inicioEm, null);
    Assert.equals(conta.fimEm, null);
  });

  suite.test("atualizar conta fixa altera só os campos enviados", (Assert) => {
    const conta = criarContaFalsa();
    const estado = criarEstado({ contasFixas: [conta] });

    const atualizada = atualizarContaFixa(estado, conta.id, {
      nome: "Aluguel novo",
      valorPrevistoCentavos: 130000,
      ativa: false
    });

    Assert.equals(atualizada.id, conta.id);
    Assert.equals(atualizada.nome, "Aluguel novo");
    Assert.equals(atualizada.valorPrevistoCentavos, 130000);
    Assert.false(atualizada.ativa);
    Assert.equals(atualizada.diaVencimento, 5);
    Assert.equals(atualizada.categoria, "Moradia");
    Assert.equals(atualizarContaFixa(estado, "nao-existe", {}), null);
  });

  suite.test("excluir conta sem pagamentos remove do estado", (Assert) => {
    const conta = criarContaFalsa();
    const estado = criarEstado({ contasFixas: [conta] });

    const resultado = excluirContaFixa(estado, conta.id);

    Assert.true(resultado.sucesso);
    Assert.length(resultado.erros, 0);
    Assert.length(estado.contasFixas, 0);
    Assert.equals(resultado.conta.id, conta.id);
  });

  suite.test("excluir conta com pagamentos é bloqueado", (Assert) => {
    const conta = criarContaFalsa();
    const pagamento = {
      id: "pagamento-1",
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05",
      lancamentoId: null
    };
    const estado = criarEstado({
      contasFixas: [conta],
      pagamentos: [pagamento]
    });

    const resultado = excluirContaFixa(estado, conta.id);

    Assert.false(resultado.sucesso);
    Assert.true(mensagemInclui(resultado.erros, "pagamentos"));
    Assert.length(estado.contasFixas, 1);
    Assert.length(estado.pagamentos, 1);
  });

  suite.test("validar conta fixa aceita dados completos", (Assert) => {
    const erros = validarContaFixa(
      {
        nome: "Aluguel",
        tipo: "despesa",
        valorPrevistoCentavos: 120000,
        diaVencimento: 5,
        categoria: "Moradia",
        inicioEm: "2026-10-01",
        fimEm: null
      },
      CATEGORIAS
    );

    Assert.length(erros, 0);
  });

  suite.test("validar conta fixa aponta campos obrigatórios", (Assert) => {
    const erros = validarContaFixa(
      {
        nome: "   ",
        tipo: "invalido",
        valorPrevistoCentavos: 0,
        diaVencimento: 32,
        categoria: ""
      },
      CATEGORIAS
    );

    Assert.true(mensagemInclui(erros, "nome"));
    Assert.true(mensagemInclui(erros, "tipo"));
    Assert.true(mensagemInclui(erros, "valor previsto"));
    Assert.true(mensagemInclui(erros, "dia de vencimento"));
    Assert.true(mensagemInclui(erros, "categoria"));
  });

  suite.test("validar conta fixa confere categoria, datas e ordem", (Assert) => {
    const categoriaErrada = validarContaFixa(
      {
        nome: "Aluguel",
        tipo: "despesa",
        valorPrevistoCentavos: 120000,
        diaVencimento: 5,
        categoria: "Casa"
      },
      CATEGORIAS
    );
    Assert.true(mensagemInclui(categoriaErrada, "categoria"));

    const dataErrada = validarContaFixa({
      nome: "Aluguel",
      tipo: "despesa",
      valorPrevistoCentavos: 120000,
      diaVencimento: 5,
      categoria: "Moradia",
      inicioEm: "2026-02-31",
      fimEm: "2026-13-01"
    });
    Assert.true(mensagemInclui(dataErrada, "início"));
    Assert.true(mensagemInclui(dataErrada, "fim"));

    const ordemErrada = validarContaFixa({
      nome: "Aluguel",
      tipo: "despesa",
      valorPrevistoCentavos: 120000,
      diaVencimento: 5,
      categoria: "Moradia",
      inicioEm: "2026-12-01",
      fimEm: "2026-11-01"
    });
    Assert.true(mensagemInclui(ordemErrada, "anterior"));
  });
});

// --- Vencimentos e contas do mês ---

describe("contas fixas — vencimentos e mês", (suite) => {
  suite.test("data de vencimento ajusta o último dia do mês", (Assert) => {
    const conta31 = criarContaFalsa({ diaVencimento: 31 });

    Assert.equals(dataVencimento(conta31, "2026-02"), "2026-02-28");
    Assert.equals(dataVencimento(conta31, "2028-02"), "2028-02-29");
    Assert.equals(dataVencimento(conta31, "2026-04"), "2026-04-30");
    Assert.equals(dataVencimento(conta31, "2026-10"), "2026-10-31");
    Assert.equals(
      dataVencimento(criarContaFalsa({ diaVencimento: 10 }), "2026-10"),
      "2026-10-10"
    );
    Assert.equals(
      dataVencimento(criarContaFalsa({ diaVencimento: 0 }), "2026-10"),
      null
    );
    Assert.equals(dataVencimento(conta31, "2026-13"), null);
  });

  suite.test("conta vigente respeita ativa, início e fim", (Assert) => {
    const conta = criarContaFalsa();

    Assert.true(contaVigenteNaCompetencia(conta, "2026-10"));
    Assert.false(
      contaVigenteNaCompetencia({ ...conta, ativa: false }, "2026-10")
    );
    Assert.false(
      contaVigenteNaCompetencia(
        { ...conta, inicioEm: "2026-11-01" },
        "2026-10"
      )
    );
    Assert.true(
      contaVigenteNaCompetencia(
        { ...conta, inicioEm: "2026-11-01" },
        "2026-11"
      )
    );
    Assert.false(
      contaVigenteNaCompetencia({ ...conta, fimEm: "2026-09-30" }, "2026-10")
    );
    Assert.true(
      contaVigenteNaCompetencia({ ...conta, fimEm: "2026-09-30" }, "2026-09")
    );
    Assert.false(contaVigenteNaCompetencia(conta, "2026-13"));
  });

  suite.test("contas do mês misturam vigentes e contas inativas pagas", (Assert) => {
    const aluguel = criarContaFalsa({
      nome: "Aluguel",
      diaVencimento: 5,
      valorPrevistoCentavos: 120000
    });
    const salario = criarContaFalsa({
      nome: "Salário",
      tipo: "receita",
      diaVencimento: 5,
      valorPrevistoCentavos: 300000
    });
    const internet = criarContaFalsa({
      nome: "Internet",
      ativa: false,
      diaVencimento: 10,
      valorPrevistoCentavos: 10000
    });
    const academia = criarContaFalsa({
      nome: "Academia",
      ativa: false,
      diaVencimento: 20,
      valorPrevistoCentavos: 5000
    });
    const futuro = criarContaFalsa({
      nome: "Futuro",
      inicioEm: "2026-11-01",
      diaVencimento: 15
    });
    const encerrada = criarContaFalsa({
      nome: "Encerrada",
      fimEm: "2026-09-30",
      diaVencimento: 25
    });
    const pagamentoAcademia = {
      id: "pg-academia",
      contaFixaId: academia.id,
      competencia: "2026-10",
      valorPagoCentavos: 4500,
      dataPagamento: "2026-10-20",
      lancamentoId: null
    };
    const estado = criarEstado({
      contasFixas: [aluguel, salario, internet, academia, futuro, encerrada],
      pagamentos: [pagamentoAcademia]
    });

    const contas = contasDoMes(estado, "2026-10");

    Assert.length(contas, 3);
    Assert.equals(contas[0].nome, "Aluguel");
    Assert.equals(contas[1].nome, "Salário");
    Assert.equals(contas[2].nome, "Academia");
    Assert.equals(contas[0].dataVencimento, "2026-10-05");
    Assert.equals(contas[0].status, "pendente");
    Assert.false(contas[0].pago);
    Assert.true(contas[2].pago);
    Assert.false(contas[2].vigente);
    Assert.equals(contas[2].pagamento.id, "pg-academia");
    Assert.length(contasDoMes(estado, "2026-13"), 0);
  });

  suite.test("resumo de contas separa previsto e pago", (Assert) => {
    const aluguel = criarContaFalsa({
      nome: "Aluguel",
      diaVencimento: 5,
      valorPrevistoCentavos: 120000
    });
    const salario = criarContaFalsa({
      nome: "Salário",
      tipo: "receita",
      diaVencimento: 5,
      valorPrevistoCentavos: 300000
    });
    const academia = criarContaFalsa({
      nome: "Academia",
      ativa: false,
      diaVencimento: 20,
      valorPrevistoCentavos: 5000
    });
    const estado = criarEstado({
      contasFixas: [aluguel, salario, academia],
      pagamentos: [
        {
          id: "pg-academia",
          contaFixaId: academia.id,
          competencia: "2026-10",
          valorPagoCentavos: 4500,
          dataPagamento: "2026-10-20",
          lancamentoId: null
        }
      ]
    });

    const resumo = resumoContasDoMes(estado, "2026-10");

    Assert.equals(resumo.quantidade, 3);
    Assert.equals(resumo.quantidadePendentes, 2);
    Assert.equals(resumo.quantidadePagas, 1);
    Assert.equals(resumo.previstasReceitasCentavos, 300000);
    Assert.equals(resumo.previstasDespesasCentavos, 120000);
    Assert.equals(resumo.saldoPrevistoCentavos, 180000);
    Assert.equals(resumo.pagasReceitasCentavos, 0);
    Assert.equals(resumo.pagasDespesasCentavos, 4500);
    Assert.equals(resumo.saldoPagoCentavos, -4500);
  });

  suite.test("resumo conta pagamento de conta ativa sem descontar do previsto", (Assert) => {
    const aluguel = criarContaFalsa({
      valorPrevistoCentavos: 120000
    });
    const pagamento = {
      id: "pg-aluguel",
      contaFixaId: aluguel.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05",
      lancamentoId: null
    };
    const estado = criarEstado({
      contasFixas: [aluguel],
      pagamentos: [pagamento]
    });

    const resumo = resumoContasDoMes(estado, "2026-10");

    Assert.equals(resumo.quantidadePendentes, 0);
    Assert.equals(resumo.quantidadePagas, 1);
    Assert.equals(resumo.previstasDespesasCentavos, 120000);
    Assert.equals(resumo.pagasDespesasCentavos, 118000);
    Assert.equals(resumo.saldoPrevistoCentavos, -120000);
    Assert.equals(resumo.saldoPagoCentavos, -118000);
  });
});

// --- Pagamentos ---

describe("contas fixas — pagamentos", (suite) => {
  function estadoComConta(campos = {}) {
    const conta = criarContaFalsa(campos);
    return {
      conta,
      estado: criarEstado({ contasFixas: [conta] })
    };
  }

  suite.test("registrar pagamento cria o lançamento real vinculado", (Assert) => {
    const { conta, estado } = estadoComConta();
    const resultado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    Assert.true(resultado.sucesso);
    Assert.length(resultado.erros, 0);
    Assert.length(estado.pagamentos, 1);
    Assert.length(estado.lancamentos, 1);

    const { pagamento, lancamento } = resultado;
    Assert.equals(pagamento.contaFixaId, conta.id);
    Assert.equals(pagamento.competencia, "2026-10");
    Assert.equals(pagamento.valorPagoCentavos, 118000);
    Assert.equals(pagamento.dataPagamento, "2026-10-05");
    Assert.equals(pagamento.lancamentoId, lancamento.id);
    Assert.equals(lancamento.origem, "pagamento");
    Assert.equals(lancamento.origemId, pagamento.id);
    Assert.equals(lancamento.tipo, "despesa");
    Assert.equals(lancamento.descricao, "Aluguel");
    Assert.equals(lancamento.categoria, "Moradia");
    Assert.equals(lancamento.valorCentavos, 118000);
    Assert.equals(lancamento.data, "2026-10-05");
    Assert.equals(resumoDoMes(estado, "2026-10").despesasCentavos, 118000);
  });

  suite.test("buscar pagamento por conta e competência", (Assert) => {
    const { conta, estado } = estadoComConta();
    const resultado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    Assert.equals(encontrarPagamento(estado, resultado.pagamento.id).id, resultado.pagamento.id);
    Assert.length(pagamentosDaConta(estado, conta.id), 1);
    Assert.equals(
      pagamentoDaContaNaCompetencia(estado, conta.id, "2026-10").id,
      resultado.pagamento.id
    );
    Assert.equals(
      pagamentoDaContaNaCompetencia(estado, conta.id, "2026-11"),
      null
    );
  });

  suite.test("segundo pagamento na mesma competência é bloqueado", (Assert) => {
    const { conta, estado } = estadoComConta();
    registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    const segundo = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 125000,
      dataPagamento: "2026-10-06"
    });

    Assert.false(segundo.sucesso);
    Assert.true(mensagemInclui(segundo.erros, "já tem um pagamento"));
    Assert.length(estado.pagamentos, 1);
    Assert.length(estado.lancamentos, 1);
  });

  suite.test("pagamento em conta inativa ou fora da vigência é bloqueado", (Assert) => {
    const inativa = estadoComConta({ ativa: false });
    const resultadoInativa = registrarPagamento(inativa.estado, {
      contaFixaId: inativa.conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    Assert.false(resultadoInativa.sucesso);
    Assert.true(mensagemInclui(resultadoInativa.erros, "não está ativa"));
    Assert.length(inativa.estado.pagamentos, 0);
    Assert.length(inativa.estado.lancamentos, 0);

    const futura = estadoComConta({ inicioEm: "2026-11-01" });
    const resultadoFutura = registrarPagamento(futura.estado, {
      contaFixaId: futura.conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    Assert.false(resultadoFutura.sucesso);
    Assert.true(mensagemInclui(resultadoFutura.erros, "não está ativa"));
  });

  suite.test("validar pagamento aponta conta, competência, valor e data", (Assert) => {
    const { estado } = estadoComConta();

    const semConta = validarPagamento(estado, {
      contaFixaId: "nao-existe",
      competencia: "2026-13",
      valorPagoCentavos: 0,
      dataPagamento: "2026-02-31"
    });

    Assert.true(mensagemInclui(semConta, "conta fixa"));
    Assert.true(mensagemInclui(semConta, "competência"));
    Assert.true(mensagemInclui(semConta, "valor pago"));
    Assert.true(mensagemInclui(semConta, "data de pagamento"));
  });

  suite.test("lançamento usa a data do pagamento, mesmo em outro mês", (Assert) => {
    const { conta, estado } = estadoComConta();
    const resultado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-11-05"
    });

    Assert.true(resultado.sucesso);
    Assert.equals(resultado.pagamento.competencia, "2026-10");
    Assert.equals(resultado.lancamento.data, "2026-11-05");
    Assert.equals(resumoDoMes(estado, "2026-10").despesasCentavos, 0);
    Assert.equals(resumoDoMes(estado, "2026-11").despesasCentavos, 118000);
  });

  suite.test("editar pagamento atualiza valor e data do lançamento", (Assert) => {
    const { conta, estado } = estadoComConta();
    const registrado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    const atualizado = atualizarPagamento(estado, registrado.pagamento.id, {
      valorPagoCentavos: 125000,
      dataPagamento: "2026-10-06"
    });

    Assert.true(atualizado.sucesso);
    Assert.equals(atualizado.pagamento.valorPagoCentavos, 125000);
    Assert.equals(atualizado.pagamento.dataPagamento, "2026-10-06");
    Assert.equals(atualizado.lancamento.valorCentavos, 125000);
    Assert.equals(atualizado.lancamento.data, "2026-10-06");
    Assert.equals(atualizado.lancamento.descricao, "Aluguel");
    Assert.equals(atualizado.lancamento.categoria, "Moradia");
    Assert.equals(resumoDoMes(estado, "2026-10").despesasCentavos, 125000);
  });

  suite.test("reclassificar conta não reescreve o pagamento já realizado", (Assert) => {
    const { conta, estado } = estadoComConta();
    const registrado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    atualizarContaFixa(estado, conta.id, { tipo: "receita" });

    Assert.equals(registrado.lancamento.tipo, "despesa");
    const item = contasDoMes(estado, "2026-10")[0];
    Assert.equals(item.tipo, "receita");
    Assert.equals(item.tipoPagamento, "despesa");
    Assert.equals(item.lancamentoPagamento.tipo, "despesa");

    const resumo = resumoContasDoMes(estado, "2026-10");
    Assert.equals(resumo.previstasReceitasCentavos, 120000);
    Assert.equals(resumo.previstasDespesasCentavos, 0);
    Assert.equals(resumo.pagasReceitasCentavos, 0);
    Assert.equals(resumo.pagasDespesasCentavos, 118000);
  });

  suite.test("editar pagamento inexistente ou com dados inválidos não altera nada", (Assert) => {
    const { conta, estado } = estadoComConta();
    const registrado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    const inexistente = atualizarPagamento(estado, "nao-existe", {
      valorPagoCentavos: 125000,
      dataPagamento: "2026-10-06"
    });
    Assert.false(inexistente.sucesso);
    Assert.true(mensagemInclui(inexistente.erros, "não encontrado"));

    const invalido = atualizarPagamento(estado, registrado.pagamento.id, {
      valorPagoCentavos: 0,
      dataPagamento: "2026-02-31"
    });
    Assert.false(invalido.sucesso);
    Assert.equals(registrado.pagamento.valorPagoCentavos, 118000);
    Assert.equals(registrado.pagamento.dataPagamento, "2026-10-05");
    Assert.equals(registrado.lancamento.valorCentavos, 118000);
    Assert.equals(registrado.lancamento.data, "2026-10-05");
  });

  suite.test("editar pagamento recria lançamento vinculado ausente", (Assert) => {
    const { conta, estado } = estadoComConta();
    const registrado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    estado.lancamentos = [];

    const atualizado = atualizarPagamento(estado, registrado.pagamento.id, {
      valorPagoCentavos: 121000,
      dataPagamento: "2026-10-07"
    });

    Assert.true(atualizado.sucesso);
    Assert.length(estado.lancamentos, 1);
    Assert.equals(atualizado.lancamento.id, estado.lancamentos[0].id);
    Assert.equals(atualizado.pagamento.lancamentoId, atualizado.lancamento.id);
    Assert.equals(atualizado.lancamento.origem, "pagamento");
    Assert.equals(atualizado.lancamento.origemId, atualizado.pagamento.id);
    Assert.equals(atualizado.lancamento.valorCentavos, 121000);
    Assert.equals(atualizado.lancamento.data, "2026-10-07");
  });

  suite.test("excluir pagamento remove o lançamento gerado", (Assert) => {
    const { conta, estado } = estadoComConta();
    const registrado = registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    const resultado = excluirPagamento(estado, registrado.pagamento.id);

    Assert.true(resultado.sucesso);
    Assert.length(estado.pagamentos, 0);
    Assert.length(estado.lancamentos, 0);
    Assert.equals(resumoDoMes(estado, "2026-10").despesasCentavos, 0);

    const inexistente = excluirPagamento(estado, "nao-existe");
    Assert.false(inexistente.sucesso);
    Assert.true(mensagemInclui(inexistente.erros, "não encontrado"));
  });

  suite.test("excluir conta só funciona depois de excluir os pagamentos", (Assert) => {
    const { conta, estado } = estadoComConta();
    registrarPagamento(estado, {
      contaFixaId: conta.id,
      competencia: "2026-10",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-10-05"
    });

    const bloqueado = excluirContaFixa(estado, conta.id);
    Assert.false(bloqueado.sucesso);
    Assert.length(estado.contasFixas, 1);
    Assert.length(estado.pagamentos, 1);

    excluirPagamento(estado, estado.pagamentos[0].id);
    const liberado = excluirContaFixa(estado, conta.id);
    Assert.true(liberado.sucesso);
    Assert.length(estado.contasFixas, 0);
  });
});

// --- Projeção ---

describe("contas fixas — projeção", (suite) => {
  function estadoComLancamentos(lancamentos = []) {
    const aluguel = criarContaFalsa({
      nome: "Aluguel",
      valorPrevistoCentavos: 120000
    });
    const salario = criarContaFalsa({
      nome: "Salário",
      tipo: "receita",
      valorPrevistoCentavos: 300000
    });
    const internet = criarContaFalsa({
      nome: "Internet",
      ativa: false,
      valorPrevistoCentavos: 10000
    });

    return {
      aluguel,
      salario,
      internet,
      estado: criarEstado({
        contasFixas: [aluguel, salario, internet],
        lancamentos
      })
    };
  }

  suite.test("média variável usa até três meses e ignora pagamentos", (Assert) => {
    Assert.equals(MESES_HISTORICO_PROJECAO, 3);

    const estado = criarEstado({
      lancamentos: [
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-07-10",
          valorCentavos: 50000
        }),
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-08-10",
          valorCentavos: 10000
        }),
        criarLancamentoFalso({
          tipo: "despesa",
          data: "2026-08-11",
          valorCentavos: 1000
        }),
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-09-10",
          valorCentavos: 20000
        }),
        criarLancamentoFalso({
          tipo: "despesa",
          data: "2026-09-11",
          valorCentavos: 3000
        }),
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-10-10",
          valorCentavos: 30000
        }),
        criarLancamentoFalso({
          tipo: "despesa",
          data: "2026-10-11",
          valorCentavos: 5000
        }),
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-10-12",
          valorCentavos: 99999,
          origem: "pagamento"
        })
      ]
    });

    const media = mediaMensalVariavel(estado, "2026-11");

    Assert.equals(media.mesesUsados, 3);
    Assert.equals(media.competencias.length, 3);
    Assert.equals(media.receitasCentavos, 20000);
    Assert.equals(media.despesasCentavos, 3000);
    Assert.true(media.historicoSuficiente);
  });

  suite.test("média variável funciona com menos de três meses", (Assert) => {
    const estado = criarEstado({
      lancamentos: [
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-10-10",
          valorCentavos: 10000
        })
      ]
    });

    const media = mediaMensalVariavel(estado, "2026-11");

    Assert.equals(media.mesesUsados, 1);
    Assert.equals(media.receitasCentavos, 10000);
    Assert.equals(media.despesasCentavos, 0);
    Assert.true(media.historicoSuficiente);
  });

  suite.test("sem lançamentos variáveis o histórico é insuficiente", (Assert) => {
    const estado = criarEstado({
      lancamentos: [
        criarLancamentoFalso({
          tipo: "receita",
          data: "2026-10-10",
          valorCentavos: 99999,
          origem: "pagamento"
        })
      ]
    });

    const media = mediaMensalVariavel(estado, "2026-11");

    Assert.equals(media.mesesUsados, 0);
    Assert.equals(media.receitasCentavos, null);
    Assert.equals(media.despesasCentavos, null);
    Assert.false(media.historicoSuficiente);

    const invalida = mediaMensalVariavel(estado, "2026-13");
    Assert.false(invalida.historicoSuficiente);
  });

  suite.test("projeção soma contas fixas ativas e variáveis em blocos", (Assert) => {
    const { estado } = estadoComLancamentos([
      criarLancamentoFalso({
        tipo: "receita",
        data: "2026-08-10",
        valorCentavos: 10000
      }),
      criarLancamentoFalso({
        tipo: "despesa",
        data: "2026-08-11",
        valorCentavos: 1000
      }),
      criarLancamentoFalso({
        tipo: "receita",
        data: "2026-09-10",
        valorCentavos: 20000
      }),
      criarLancamentoFalso({
        tipo: "despesa",
        data: "2026-09-11",
        valorCentavos: 3000
      }),
      criarLancamentoFalso({
        tipo: "receita",
        data: "2026-10-10",
        valorCentavos: 30000
      }),
      criarLancamentoFalso({
        tipo: "despesa",
        data: "2026-10-11",
        valorCentavos: 5000
      })
    ]);

    const projecao = projetarMes(estado, "2026-11");

    Assert.equals(projecao.contasFixas.quantidade, 2);
    Assert.equals(projecao.contasFixas.receitasCentavos, 300000);
    Assert.equals(projecao.contasFixas.despesasCentavos, 120000);
    Assert.equals(projecao.contasFixas.saldoCentavos, 180000);
    Assert.equals(projecao.variaveis.receitasCentavos, 20000);
    Assert.equals(projecao.variaveis.despesasCentavos, 3000);
    Assert.true(projecao.incluiVariaveis);
    Assert.equals(projecao.receitasPrevistasCentavos, 320000);
    Assert.equals(projecao.despesasPrevistasCentavos, 123000);
    Assert.equals(projecao.saldoPrevistoCentavos, 197000);
    Assert.equals(projecao.realizado.receitasCentavos, 0);
    Assert.equals(projecao.realizado.despesasCentavos, 0);
  });

  suite.test("projeção sem histórico mostra só contas fixas", (Assert) => {
    const { estado } = estadoComLancamentos();
    const projecao = projetarMes(estado, "2026-11");

    Assert.false(projecao.incluiVariaveis);
    Assert.false(projecao.variaveis.historicoSuficiente);
    Assert.equals(projecao.receitasPrevistasCentavos, 300000);
    Assert.equals(projecao.despesasPrevistasCentavos, 120000);
    Assert.equals(projecao.saldoPrevistoCentavos, 180000);
  });

  suite.test("realizado fica separado do previsto", (Assert) => {
    const { estado } = estadoComLancamentos([
      criarLancamentoFalso({
        tipo: "receita",
        data: "2026-11-10",
        valorCentavos: 777
      }),
      criarLancamentoFalso({
        tipo: "despesa",
        data: "2026-11-11",
        valorCentavos: 333
      })
    ]);

    const projecao = projetarMes(estado, "2026-11");

    Assert.equals(projecao.realizado.receitasCentavos, 777);
    Assert.equals(projecao.realizado.despesasCentavos, 333);
    Assert.equals(projecao.realizado.saldoCentavos, 444);
    Assert.equals(projecao.receitasPrevistasCentavos, 300000);
    Assert.equals(projecao.despesasPrevistasCentavos, 120000);
    Assert.equals(projecao.saldoPrevistoCentavos, 180000);
  });

  suite.test("ativar e desativar conta muda a projeção", (Assert) => {
    const { aluguel, estado } = estadoComLancamentos();
    const antes = projetarMes(estado, "2026-11");

    atualizarContaFixa(estado, aluguel.id, { ativa: false });
    const depois = projetarMes(estado, "2026-11");

    Assert.equals(antes.despesasPrevistasCentavos, 120000);
    Assert.equals(depois.despesasPrevistasCentavos, 0);
    Assert.equals(depois.contasFixas.quantidade, 1);
    Assert.equals(depois.saldoPrevistoCentavos, 300000);
  });

  suite.test("projeção respeita início e fim das contas", (Assert) => {
    const futura = criarContaFalsa({
      nome: "Futura",
      inicioEm: "2026-12-01",
      valorPrevistoCentavos: 50000
    });
    const encerrada = criarContaFalsa({
      nome: "Encerrada",
      fimEm: "2026-10-31",
      valorPrevistoCentavos: 70000
    });
    const estado = criarEstado({ contasFixas: [futura, encerrada] });

    const projecao = projetarMes(estado, "2026-11");

    Assert.equals(projecao.contasFixas.quantidade, 0);
    Assert.equals(projecao.contasFixas.despesasCentavos, 0);
    Assert.equals(projecao.despesasPrevistasCentavos, 0);
  });

  suite.test("pagamento no mês projetado entra só no realizado", (Assert) => {
    const { aluguel, estado } = estadoComLancamentos();
    registrarPagamento(estado, {
      contaFixaId: aluguel.id,
      competencia: "2026-11",
      valorPagoCentavos: 118000,
      dataPagamento: "2026-11-05"
    });

    const projecao = projetarMes(estado, "2026-11");

    Assert.equals(projecao.contasFixas.quantidadePagas, 1);
    Assert.equals(projecao.contasFixas.despesasCentavos, 120000);
    Assert.equals(projecao.realizado.despesasCentavos, 118000);
    Assert.equals(projecao.despesasPrevistasCentavos, 120000);
    Assert.equals(projecao.saldoPrevistoCentavos, 180000);
  });

  suite.test("projeção inválida devolve null", (Assert) => {
    const { estado } = estadoComLancamentos();
    Assert.equals(projetarMes(estado, "2026-13"), null);
  });
});
