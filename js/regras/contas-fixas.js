// Regras de contas fixas, pagamentos e projeção mensal.
// Funções puras: não tocam no DOM nem no localStorage.
//
// Conceitos (PLANO.md §6 e §8):
// - conta fixa: previsão mensal; pode ser ativada/desativada e ter início/fim;
// - pagamento: realização de uma conta em uma competência; gera um lançamento real;
// - projeção: contas fixas ativas + média de lançamentos variáveis. Previsto e
//   realizado são devolvidos em blocos separados e nunca somados.
//
// Regras de integridade:
// - no máximo um pagamento por conta + competência;
// - todo pagamento tem um lançamento vinculado (origem "pagamento");
// - editar o pagamento atualiza valor e data do lançamento vinculado;
// - excluir o pagamento remove o lançamento vinculado;
// - excluir uma conta com pagamentos é bloqueado (desative-a ou exclua os pagamentos).

import {
  TIPOS_LANCAMENTO,
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
  encontrarLancamento,
  lancamentosDoMes,
  resumoDoMes,
  competenciaDaData,
  somarCompetencias,
  competenciaValida,
  dataValida
} from "./financas.js";

export const MESES_HISTORICO_PROJECAO = 3;

// --- Contas fixas ---

// Cria uma conta fixa ainda não salva. Campos inválidos recebem padrões seguros;
// a validação com mensagens para o usuário fica em `validarContaFixa`.
export function criarContaFixa(campos = {}) {
  const conta = {
    id: crypto.randomUUID(),
    nome: null,
    tipo: "despesa",
    valorPrevistoCentavos: 0,
    diaVencimento: 0,
    categoria: null,
    ativa: true,
    inicioEm: null,
    fimEm: null
  };

  aplicarCamposConta(conta, campos);
  return conta;
}

export function encontrarContaFixa(estado, contaFixaId) {
  return (estado.contasFixas ?? []).find((item) => item.id === contaFixaId) ?? null;
}

// Atualiza só os campos enviados. O id nunca muda.
// Mudanças de nome/tipo/categoria valem para pagamentos futuros; os lançamentos
// já gerados guardam uma cópia dos dados do momento do pagamento.
export function atualizarContaFixa(estado, contaFixaId, campos = {}) {
  const conta = encontrarContaFixa(estado, contaFixaId);
  if (conta === null) return null;

  aplicarCamposConta(conta, campos);
  return conta;
}

// Excluir conta com histórico é bloqueado para não deixar pagamentos órfãos.
// A alternativa segura é desativar a conta.
export function excluirContaFixa(estado, contaFixaId) {
  const conta = encontrarContaFixa(estado, contaFixaId);

  if (conta === null) {
    return {
      sucesso: false,
      erros: ["Conta fixa não encontrada."],
      conta: null
    };
  }

  if (pagamentosDaConta(estado, contaFixaId).length > 0) {
    return {
      sucesso: false,
      erros: [
        "Esta conta fixa já tem pagamentos. Desative-a para interromper novos pagamentos ou exclua os pagamentos primeiro."
      ],
      conta
    };
  }

  const contas = estado.contasFixas ?? [];
  const indice = contas.findIndex((item) => item.id === contaFixaId);
  contas.splice(indice, 1);

  return { sucesso: true, erros: [], conta };
}

function aplicarCamposConta(conta, campos) {
  if ("nome" in campos) {
    conta.nome = textoLimpo(campos.nome);
  }

  if ("tipo" in campos) {
    conta.tipo = TIPOS_LANCAMENTO.includes(campos.tipo)
      ? campos.tipo
      : "despesa";
  }

  if ("valorPrevistoCentavos" in campos) {
    conta.valorPrevistoCentavos = normalizarValor(campos.valorPrevistoCentavos);
  }

  if ("diaVencimento" in campos) {
    conta.diaVencimento = normalizarDia(campos.diaVencimento);
  }

  if ("categoria" in campos) {
    conta.categoria = textoLimpo(campos.categoria);
  }

  if ("ativa" in campos) {
    conta.ativa = normalizarAtiva(campos.ativa);
  }

  if ("inicioEm" in campos) {
    conta.inicioEm = normalizarDataOpcional(campos.inicioEm);
  }

  if ("fimEm" in campos) {
    conta.fimEm = normalizarDataOpcional(campos.fimEm);
  }
}

// Valida os campos de uma conta fixa. `categorias` é opcional, como no
// lançamento: quando enviada, a categoria precisa estar na lista do config.
export function validarContaFixa(campos = {}, categorias = null) {
  const erros = [];

  if (textoLimpo(campos.nome) === null) {
    erros.push("Informe o nome da conta fixa.");
  }

  if (!TIPOS_LANCAMENTO.includes(campos.tipo)) {
    erros.push("Escolha o tipo da conta (receita ou despesa).");
  }

  const valor = Number(campos.valorPrevistoCentavos);
  if (!Number.isInteger(valor) || valor <= 0) {
    erros.push("Informe um valor previsto maior que zero.");
  }

  const dia = Number(campos.diaVencimento);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    erros.push("Informe um dia de vencimento entre 1 e 31.");
  }

  const categoria = textoLimpo(campos.categoria);
  if (categoria === null) {
    erros.push("Escolha uma categoria.");
  } else if (
    Array.isArray(categorias) &&
    categorias.length > 0 &&
    !categorias.includes(categoria)
  ) {
    erros.push("Escolha uma categoria da lista de categorias financeiras.");
  }

  const inicio = textoLimpo(campos.inicioEm);
  if (inicio !== null && !dataValida(inicio)) {
    erros.push("Informe uma data de início válida ou deixe em branco.");
  }

  const fim = textoLimpo(campos.fimEm);
  if (fim !== null && !dataValida(fim)) {
    erros.push("Informe uma data de fim válida ou deixe em branco.");
  }

  if (
    inicio !== null &&
    fim !== null &&
    dataValida(inicio) &&
    dataValida(fim) &&
    fim < inicio
  ) {
    erros.push("A data de fim não pode ser anterior à data de início.");
  }

  return erros;
}

// --- Vencimentos e contas do mês ---

// Data de vencimento na competência, ajustada para o último dia do mês
// quando o dia escolhido não existe (31 em fevereiro vira 28/29).
export function dataVencimento(conta, competencia) {
  if (!conta || !competenciaValida(competencia)) return null;

  const dia = Number(conta.diaVencimento);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return null;

  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaAjustado = Math.min(dia, ultimoDia);

  return `${competencia}-${String(diaAjustado).padStart(2, "0")}`;
}

// Uma conta está vigente no mês quando está ativa e a competência está dentro
// do início/fim (comparação por mês, sem ratear o primeiro/último mês).
export function contaVigenteNaCompetencia(conta, competencia) {
  if (!conta || conta.ativa !== true || !competenciaValida(competencia)) {
    return false;
  }

  const inicio = dataValida(conta.inicioEm)
    ? competenciaDaData(conta.inicioEm)
    : null;
  if (inicio !== null && competencia < inicio) return false;

  const fim = dataValida(conta.fimEm)
    ? competenciaDaData(conta.fimEm)
    : null;
  if (fim !== null && competencia > fim) return false;

  return true;
}

// Contas que aparecem no mês: as ativas/vigentes e também contas inativas que
// já têm pagamento naquela competência (para permitir corrigir/excluir o pagamento).
// A lista vem ordenada por vencimento e, no empate, por nome.
export function contasDoMes(estado, competencia) {
  if (!competenciaValida(competencia)) return [];

  const contas = [];

  for (const conta of estado.contasFixas ?? []) {
    const pagamento = pagamentoDaContaNaCompetencia(
      estado,
      conta.id,
      competencia
    );
    const vigente = contaVigenteNaCompetencia(conta, competencia);

    if (!vigente && pagamento === null) continue;

    // O lançamento gerado guarda o tipo do momento do pagamento. Se a conta
    // for reclassificada depois, o total "pago" continua seguindo o realizado.
    const lancamentoPagamento = pagamento === null
      ? null
      : encontrarLancamento(estado, pagamento.lancamentoId);

    contas.push({
      ...conta,
      dataVencimento: dataVencimento(conta, competencia),
      vigente,
      pago: pagamento !== null,
      status: pagamento !== null ? "pago" : "pendente",
      pagamento,
      lancamentoPagamento,
      tipoPagamento: lancamentoPagamento?.tipo ?? conta.tipo
    });
  }

  return contas.sort((a, b) => {
    const dataA = a.dataVencimento ?? "9999-12-31";
    const dataB = b.dataVencimento ?? "9999-12-31";
    const porData = dataA.localeCompare(dataB);
    if (porData !== 0) return porData;
    return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
  });
}

// Totais de previsto e pago do mês, em blocos separados.
// `previstas*` consideram só contas ativas/vigentes; `pagas*` consideram os
// pagamentos existentes, inclusive de contas que foram desativadas depois.
export function resumoContasDoMes(estado, competencia) {
  const contas = contasDoMes(estado, competencia);

  let previstasReceitas = 0;
  let previstasDespesas = 0;
  let pagasReceitas = 0;
  let pagasDespesas = 0;
  let quantidadePendentes = 0;

  for (const conta of contas) {
    if (conta.vigente) {
      if (conta.tipo === "receita") {
        previstasReceitas += normalizarValor(conta.valorPrevistoCentavos);
      } else if (conta.tipo === "despesa") {
        previstasDespesas += normalizarValor(conta.valorPrevistoCentavos);
      }

      if (!conta.pago) quantidadePendentes++;
    }

    if (conta.pagamento !== null) {
      const valor = normalizarValor(conta.pagamento.valorPagoCentavos);
      const tipoPagamento = conta.tipoPagamento ?? conta.tipo;

      if (tipoPagamento === "receita") {
        pagasReceitas += valor;
      } else if (tipoPagamento === "despesa") {
        pagasDespesas += valor;
      }
    }
  }

  return {
    competencia,
    quantidade: contas.length,
    quantidadePendentes,
    quantidadePagas: contas.filter((conta) => conta.pago).length,
    previstasReceitasCentavos: previstasReceitas,
    previstasDespesasCentavos: previstasDespesas,
    saldoPrevistoCentavos: previstasReceitas - previstasDespesas,
    pagasReceitasCentavos: pagasReceitas,
    pagasDespesasCentavos: pagasDespesas,
    saldoPagoCentavos: pagasReceitas - pagasDespesas
  };
}

// --- Pagamentos ---

export function encontrarPagamento(estado, pagamentoId) {
  return (estado.pagamentos ?? []).find((item) => item.id === pagamentoId) ?? null;
}

export function pagamentosDaConta(estado, contaFixaId) {
  return (estado.pagamentos ?? []).filter(
    (item) => item.contaFixaId === contaFixaId
  );
}

export function pagamentoDaContaNaCompetencia(
  estado,
  contaFixaId,
  competencia
) {
  if (typeof contaFixaId !== "string" || !competenciaValida(competencia)) {
    return null;
  }

  return (estado.pagamentos ?? []).find(
    (item) =>
      item.contaFixaId === contaFixaId &&
      item.competencia === competencia
  ) ?? null;
}

// Valida um pagamento novo. O bloqueio de duplicata é por conta + competência.
export function validarPagamento(estado, campos = {}) {
  const erros = [];
  const conta = encontrarContaFixa(estado, campos.contaFixaId);

  if (conta === null) {
    erros.push("Escolha uma conta fixa.");
  }

  if (!competenciaValida(campos.competencia)) {
    erros.push("Informe uma competência válida.");
  } else if (
    conta !== null &&
    !contaVigenteNaCompetencia(conta, campos.competencia)
  ) {
    erros.push("Esta conta fixa não está ativa nesta competência.");
  }

  erros.push(...validarCamposPagamento(campos));

  if (
    conta !== null &&
    competenciaValida(campos.competencia) &&
    pagamentoDaContaNaCompetencia(estado, conta.id, campos.competencia) !== null
  ) {
    erros.push("Esta conta fixa já tem um pagamento nesta competência.");
  }

  return erros;
}

// Registra o pagamento e cria o lançamento real vinculado de uma vez.
// Devolve um resultado com `sucesso` e `erros`; em caso de erro, nada é alterado.
export function registrarPagamento(estado, campos = {}) {
  const erros = validarPagamento(estado, campos);

  if (erros.length > 0) {
    return {
      sucesso: false,
      erros,
      pagamento: null,
      lancamento: null
    };
  }

  const conta = encontrarContaFixa(estado, campos.contaFixaId);
  const pagamento = {
    id: crypto.randomUUID(),
    contaFixaId: conta.id,
    competencia: campos.competencia,
    valorPagoCentavos: normalizarValor(campos.valorPagoCentavos),
    dataPagamento: campos.dataPagamento,
    lancamentoId: null
  };

  const lancamento = criarLancamento({
    tipo: conta.tipo,
    data: pagamento.dataPagamento,
    valorCentavos: pagamento.valorPagoCentavos,
    descricao: conta.nome,
    categoria: conta.categoria,
    origem: "pagamento",
    origemId: pagamento.id
  });

  pagamento.lancamentoId = lancamento.id;

  estado.pagamentos = estado.pagamentos ?? [];
  estado.lancamentos = estado.lancamentos ?? [];
  estado.pagamentos.push(pagamento);
  estado.lancamentos.push(lancamento);

  return { sucesso: true, erros: [], pagamento, lancamento };
}

// Edita valor e data de um pagamento existente. Conta e competência ficam fixas;
// para trocar de conta/mês, exclua e registre de novo.
// O lançamento vinculado é atualizado; se ele tiver sido removido por algum
// motivo, é recriado para manter a integridade.
export function atualizarPagamento(estado, pagamentoId, campos = {}) {
  const pagamento = encontrarPagamento(estado, pagamentoId);

  if (pagamento === null) {
    return {
      sucesso: false,
      erros: ["Pagamento não encontrado."],
      pagamento: null,
      lancamento: null
    };
  }

  const valorPago = "valorPagoCentavos" in campos
    ? campos.valorPagoCentavos
    : pagamento.valorPagoCentavos;
  const dataPagamento = "dataPagamento" in campos
    ? campos.dataPagamento
    : pagamento.dataPagamento;

  const erros = validarCamposPagamento({
    valorPagoCentavos: valorPago,
    dataPagamento
  });

  if (erros.length > 0) {
    return {
      sucesso: false,
      erros,
      pagamento: null,
      lancamento: null
    };
  }

  let lancamento = encontrarLancamento(estado, pagamento.lancamentoId);
  let conta = null;

  if (lancamento === null) {
    conta = encontrarContaFixa(estado, pagamento.contaFixaId);

    if (conta === null) {
      return {
        sucesso: false,
        erros: ["Conta fixa do pagamento não encontrada."],
        pagamento: null,
        lancamento: null
      };
    }
  }

  pagamento.valorPagoCentavos = normalizarValor(valorPago);
  pagamento.dataPagamento = dataPagamento;

  if (lancamento === null) {
    lancamento = criarLancamento({
      tipo: conta.tipo,
      data: pagamento.dataPagamento,
      valorCentavos: pagamento.valorPagoCentavos,
      descricao: conta.nome,
      categoria: conta.categoria,
      origem: "pagamento",
      origemId: pagamento.id
    });

    pagamento.lancamentoId = lancamento.id;
    estado.lancamentos = estado.lancamentos ?? [];
    estado.lancamentos.push(lancamento);
  } else {
    atualizarLancamento(estado, lancamento.id, {
      valorCentavos: pagamento.valorPagoCentavos,
      data: pagamento.dataPagamento
    });
    lancamento = encontrarLancamento(estado, lancamento.id);
  }

  return { sucesso: true, erros: [], pagamento, lancamento };
}

// Remove o pagamento e o lançamento real gerado por ele.
export function excluirPagamento(estado, pagamentoId) {
  const pagamentos = estado.pagamentos ?? [];
  const indice = pagamentos.findIndex((item) => item.id === pagamentoId);

  if (indice === -1) {
    return {
      sucesso: false,
      erros: ["Pagamento não encontrado."],
      pagamento: null,
      lancamento: null
    };
  }

  const [pagamento] = pagamentos.splice(indice, 1);
  const lancamento = excluirLancamento(estado, pagamento.lancamentoId);

  return { sucesso: true, erros: [], pagamento, lancamento };
}

// --- Projeção ---

// Média mensal dos lançamentos variáveis (manuais) dos meses anteriores.
// Pagamentos de contas fixas ficam de fora para não contar duas vezes.
// Usa só os meses que têm algum lançamento manual com valor > 0; se nenhum
// tiver base, devolve valores null e `historicoSuficiente: false`.
export function mediaMensalVariavel(
  estado,
  competencia,
  meses = MESES_HISTORICO_PROJECAO
) {
  const semBase = {
    mesesUsados: 0,
    competencias: [],
    receitasCentavos: null,
    despesasCentavos: null,
    historicoSuficiente: false
  };

  if (
    !competenciaValida(competencia) ||
    !Number.isInteger(meses) ||
    meses < 1
  ) {
    return semBase;
  }

  let somaReceitas = 0;
  let somaDespesas = 0;
  let mesesUsados = 0;
  const competencias = [];

  for (let indice = 1; indice <= meses; indice++) {
    const competenciaAnterior = somarCompetencias(competencia, -indice);
    competencias.push(competenciaAnterior);

    const movimentos = lancamentosDoMes(estado, competenciaAnterior)
      .filter((item) => item.origem !== "pagamento")
      .filter(
        (item) =>
          (item.tipo === "receita" || item.tipo === "despesa") &&
          normalizarValor(item.valorCentavos) > 0
      );

    if (movimentos.length === 0) continue;

    let receitas = 0;
    let despesas = 0;

    for (const item of movimentos) {
      const valor = normalizarValor(item.valorCentavos);

      if (item.tipo === "receita") receitas += valor;
      else if (item.tipo === "despesa") despesas += valor;
    }

    somaReceitas += receitas;
    somaDespesas += despesas;
    mesesUsados++;
  }

  if (mesesUsados === 0) return semBase;

  return {
    mesesUsados,
    competencias,
    receitasCentavos: Math.round(somaReceitas / mesesUsados),
    despesasCentavos: Math.round(somaDespesas / mesesUsados),
    historicoSuficiente: true
  };
}

// Projeção de uma competência: contas fixas ativas + média variável.
// O bloco `realizado` é independente; nunca somamos previsto com realizado.
// Quando não há histórico variável, os totais previstos incluem só as fixas e
// `incluiVariaveis` fica false para a tela avisar.
export function projetarMes(estado, competencia) {
  if (!competenciaValida(competencia)) return null;

  const contas = contasDoMes(estado, competencia);
  const ativas = contas.filter((conta) => conta.vigente);

  let receitasFixas = 0;
  let despesasFixas = 0;

  for (const conta of ativas) {
    if (conta.tipo === "receita") {
      receitasFixas += normalizarValor(conta.valorPrevistoCentavos);
    } else if (conta.tipo === "despesa") {
      despesasFixas += normalizarValor(conta.valorPrevistoCentavos);
    }
  }

  const variaveis = mediaMensalVariavel(estado, competencia);
  const receitasPrevistas =
    receitasFixas + (variaveis.receitasCentavos ?? 0);
  const despesasPrevistas =
    despesasFixas + (variaveis.despesasCentavos ?? 0);

  return {
    competencia,
    contasFixas: {
      quantidade: ativas.length,
      quantidadePagas: contas.filter((conta) => conta.pago).length,
      receitasCentavos: receitasFixas,
      despesasCentavos: despesasFixas,
      saldoCentavos: receitasFixas - despesasFixas
    },
    variaveis,
    receitasPrevistasCentavos: receitasPrevistas,
    despesasPrevistasCentavos: despesasPrevistas,
    saldoPrevistoCentavos: receitasPrevistas - despesasPrevistas,
    incluiVariaveis: variaveis.historicoSuficiente,
    realizado: resumoDoMes(estado, competencia)
  };
}

// --- Normalizações e utilitários ---

function textoLimpo(valor) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

function normalizarValor(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return 0;
  return Math.round(numero);
}

function normalizarDia(valor) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1 || numero > 31) return 0;
  return numero;
}

function normalizarAtiva(valor) {
  return !(valor === false || valor === "false");
}

function normalizarDataOpcional(valor) {
  const texto = textoLimpo(valor);
  return texto !== null && dataValida(texto) ? texto : null;
}

function validarCamposPagamento(campos = {}) {
  const erros = [];
  const valor = Number(campos.valorPagoCentavos);

  if (!Number.isInteger(valor) || valor <= 0) {
    erros.push("Informe um valor pago maior que zero.");
  }

  if (!dataValida(campos.dataPagamento)) {
    erros.push("Informe uma data de pagamento válida.");
  }

  return erros;
}
