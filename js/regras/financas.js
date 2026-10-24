// Regras de negócio de finanças: lançamentos, resumos e comparações.
// Funções puras (não tocam DOM nem localStorage), para serem testáveis.
//
// Convenções do modelo (PLANO.md §6 e §8):
// - valores SEMPRE em centavos inteiros (R$ 12,34 -> 1234);
// - datas como texto "AAAA-MM-DD"; competência como "AAAA-MM";
// - receitas e despesas são lançamentos; a origem "pagamento" é usada pelas contas fixas;
// - este módulo não decide quando salvar: só calcula e valida.

export const TIPOS_LANCAMENTO = ["receita", "despesa"];
export const ORIGENS_LANCAMENTO = ["manual", "pagamento"];

// Cria um lançamento novo (ainda não salvo) a partir dos campos do formulário.
export function criarLancamento(campos = {}) {
  const agora = new Date().toISOString();
  const lancamento = {
    id: crypto.randomUUID(),
    tipo: "despesa",
    data: null,
    valorCentavos: 0,
    descricao: null,
    categoria: null,
    origem: "manual",
    origemId: null,
    criadoEm: agora
  };

  aplicarCampos(lancamento, campos);
  return lancamento;
}

// Procura um lançamento pelo id (ou null se não existir).
export function encontrarLancamento(estado, lancamentoId) {
  return (estado.lancamentos ?? []).find((item) => item.id === lancamentoId) ?? null;
}

// Atualiza os campos editáveis de um lançamento existente.
// id e criadoEm nunca são alterados por aqui.
export function atualizarLancamento(estado, lancamentoId, campos = {}) {
  const lancamento = encontrarLancamento(estado, lancamentoId);
  if (lancamento === null) return null;

  aplicarCampos(lancamento, campos);
  return lancamento;
}

// Remove um lançamento. Devolve o removido (ou null se não existir).
export function excluirLancamento(estado, lancamentoId) {
  const lancamentos = estado.lancamentos ?? [];
  const indice = lancamentos.findIndex((item) => item.id === lancamentoId);
  if (indice === -1) return null;

  const [removido] = lancamentos.splice(indice, 1);
  return removido;
}

// Aplica só os campos enviados, para não apagar dados em edições parciais.
function aplicarCampos(lancamento, campos) {
  if ("tipo" in campos) {
    lancamento.tipo = TIPOS_LANCAMENTO.includes(campos.tipo)
      ? campos.tipo
      : "despesa";
  }

  if ("data" in campos) {
    lancamento.data = normalizarData(campos.data);
  }

  if ("valorCentavos" in campos) {
    lancamento.valorCentavos = normalizarValor(campos.valorCentavos);
  }

  if ("descricao" in campos) {
    const texto = String(campos.descricao ?? "").trim();
    lancamento.descricao = texto === "" ? null : texto;
  }

  if ("categoria" in campos) {
    const texto = String(campos.categoria ?? "").trim();
    lancamento.categoria = texto === "" ? null : texto;
  }

  if ("origem" in campos) {
    lancamento.origem = ORIGENS_LANCAMENTO.includes(campos.origem)
      ? campos.origem
      : "manual";
  }

  if ("origemId" in campos) {
    lancamento.origemId =
      typeof campos.origemId === "string" && campos.origemId !== ""
        ? campos.origemId
        : null;
  }
}

// Valida os campos de um lançamento antes de salvar.
// `categorias` é opcional: quando enviada (lista do config), a categoria
// escolhida precisa estar nela.
// Devolve uma lista de mensagens em português; lista vazia = tudo certo.
export function validarLancamento(campos = {}, categorias = null) {
  const erros = [];

  if (!TIPOS_LANCAMENTO.includes(campos.tipo)) {
    erros.push("Escolha o tipo do lançamento (receita ou despesa).");
  }

  if (!dataValida(campos.data)) {
    erros.push("Informe uma data válida.");
  }

  const valor = Number(campos.valorCentavos);
  if (!Number.isInteger(valor) || valor <= 0) {
    erros.push("Informe um valor maior que zero.");
  }

  if (String(campos.descricao ?? "").trim() === "") {
    erros.push("Informe a descrição do lançamento.");
  }

  const categoria = String(campos.categoria ?? "").trim();
  if (categoria === "") {
    erros.push("Escolha uma categoria.");
  } else if (
    Array.isArray(categorias) &&
    categorias.length > 0 &&
    !categorias.includes(categoria)
  ) {
    erros.push("Escolha uma categoria da lista de categorias financeiras.");
  }

  return erros;
}

// Lançamentos de uma competência "AAAA-MM", em ordem de data crescente.
// Lançamentos com data inválida ficam de fora.
export function lancamentosDoMes(estado, competencia) {
  if (!competenciaValida(competencia)) return [];

  return (estado.lancamentos ?? [])
    .filter((item) => competenciaDaData(item.data) === competencia)
    .sort((a, b) => {
      const porData = (a.data ?? "").localeCompare(b.data ?? "");
      if (porData !== 0) return porData;
      return (a.criadoEm ?? "").localeCompare(b.criadoEm ?? "");
    });
}

// Resumo de uma competência: receitas, despesas, saldo e quantidade.
export function resumoDoMes(estado, competencia) {
  return {
    competencia,
    ...totalizar(lancamentosDoMes(estado, competencia))
  };
}

// Resumo de um único dia (relatório diário).
// Data inválida devolve zeros com `data: null`.
export function resumoDoDia(estado, dataISO) {
  if (!dataValida(dataISO)) {
    return { data: null, ...totalizar([]) };
  }

  const lancamentos = (estado.lancamentos ?? [])
    .filter((item) => item.data === dataISO);

  return { data: dataISO, ...totalizar(lancamentos) };
}

// Soma receitas e despesas de uma lista de lançamentos.
// Valores inválidos (backup antigo) contam como zero.
function totalizar(lancamentos) {
  let receitasCentavos = 0;
  let despesasCentavos = 0;
  let quantidadeLancamentos = 0;

  for (const item of lancamentos) {
    const valor = valorSeguro(item.valorCentavos);
    quantidadeLancamentos++;

    if (item.tipo === "receita") {
      receitasCentavos += valor;
    } else if (item.tipo === "despesa") {
      despesasCentavos += valor;
    }
  }

  return {
    receitasCentavos,
    despesasCentavos,
    saldoCentavos: receitasCentavos - despesasCentavos,
    quantidadeLancamentos
  };
}

// Totais agrupados por categoria.
// `tipo` é opcional: "receita" ou "despesa". Sem ele, cada combinação
// categoria + tipo vira uma linha (a mesma categoria pode ter as duas).
// Ordem: maior total primeiro; empate resolvido pelo nome da categoria.
export function totaisPorCategoria(estado, competencia, tipo = null) {
  const mapa = new Map();

  for (const item of lancamentosDoMes(estado, competencia)) {
    if (tipo !== null && item.tipo !== tipo) continue;

    const categoria = item.categoria || "Sem categoria";
    const chave = `${item.tipo}|${categoria}`;
    const atual = mapa.get(chave) ?? {
      categoria,
      tipo: item.tipo,
      totalCentavos: 0,
      quantidade: 0
    };

    atual.totalCentavos += valorSeguro(item.valorCentavos);
    atual.quantidade++;
    mapa.set(chave, atual);
  }

  return [...mapa.values()].sort((a, b) => {
    const porTotal = b.totalCentavos - a.totalCentavos;
    if (porTotal !== 0) return porTotal;
    return a.categoria.localeCompare(b.categoria, "pt-BR");
  });
}

// Percentual de `valorCentavos` dentro de `totalCentavos`, com uma casa decimal.
// Devolve null quando não há base válida (total zero/negativo ou valor inválido).
export function percentualDoTotal(valorCentavos, totalCentavos) {
  const valor = Number(valorCentavos);
  const total = Number(totalCentavos);

  if (
    !Number.isFinite(valor) ||
    !Number.isFinite(total) ||
    valor < 0 ||
    total <= 0
  ) {
    return null;
  }

  return Math.round((valor / total) * 1000) / 10;
}

// Compara uma competência com a anterior, em R$ e em %.
// Devolve null se a competência for inválida.
//
// Em cada bloco:
//   diferencaCentavos = atual - anterior (positivo = aumentou);
//   percentual = null quando não existe base (anterior = 0 e atual > 0);
//   percentual = 0 quando os dois lados são zero.
// O saldo usa o valor ABSOLUTO da base, para que a variação faça sentido
// quando o mês anterior fechou negativo.
export function compararComMesAnterior(estado, competencia) {
  if (!competenciaValida(competencia)) return null;

  const competenciaAnterior = somarCompetencias(competencia, -1);
  const atual = resumoDoMes(estado, competencia);
  const anterior = resumoDoMes(estado, competenciaAnterior);

  return {
    competencia,
    competenciaAnterior,
    receitas: compararValores(atual.receitasCentavos, anterior.receitasCentavos),
    despesas: compararValores(atual.despesasCentavos, anterior.despesasCentavos),
    saldo: compararValores(atual.saldoCentavos, anterior.saldoCentavos)
  };
}

// Procura um lançamento com o mesmo tipo + valor + data (indício de duplicata).
// `ignorarId` serve para a edição não acusar o próprio lançamento.
// Devolve o lançamento encontrado ou null.
export function possivelDuplicata(estado, campos = {}, ignorarId = null) {
  const tipo = TIPOS_LANCAMENTO.includes(campos.tipo) ? campos.tipo : null;
  const data = normalizarData(campos.data);
  const valorCentavos = normalizarValor(campos.valorCentavos);

  if (tipo === null || data === null || valorCentavos <= 0) return null;

  return (estado.lancamentos ?? []).find((item) =>
    item.id !== ignorarId &&
    item.tipo === tipo &&
    item.data === data &&
    valorSeguro(item.valorCentavos) === valorCentavos
  ) ?? null;
}

// "2026-10-24" -> "2026-10". Devolve null para data inválida.
export function competenciaDaData(dataISO) {
  return dataValida(dataISO) ? dataISO.slice(0, 7) : null;
}

// Soma (ou subtrai) meses de uma competência "AAAA-MM".
// Exemplos: ("2026-10", 3) -> "2027-01"; ("2026-01", -1) -> "2025-12".
export function somarCompetencias(competencia, meses) {
  if (!competenciaValida(competencia)) return null;

  const numero = Number(meses);
  if (!Number.isInteger(numero)) return null;

  const [ano, mes] = competencia.split("-").map(Number);
  const total = ano * 12 + (mes - 1) + numero;
  const novoAno = Math.floor(total / 12);
  const novoMes = ((total % 12) + 12) % 12 + 1;

  return `${String(novoAno).padStart(4, "0")}-${String(novoMes).padStart(2, "0")}`;
}

// "2026-10" -> "Outubro de 2026". Devolve "" para competência inválida.
export function formatarCompetencia(competencia) {
  if (!competenciaValida(competencia)) return "";

  const [ano, mes] = competencia.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date(ano, mes - 1, 1));

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// --- Normalizações e utilitários ---

function compararValores(atualCentavos, anteriorCentavos) {
  const diferencaCentavos = atualCentavos - anteriorCentavos;

  let percentual;
  if (anteriorCentavos === 0) {
    percentual = atualCentavos === 0 ? 0 : null;
  } else {
    const bruto = (diferencaCentavos / Math.abs(anteriorCentavos)) * 100;
    percentual = Math.round(bruto * 10) / 10;
  }

  return {
    atualCentavos,
    anteriorCentavos,
    diferencaCentavos,
    percentual
  };
}

// Exportada para os outros módulos financeiros usarem a mesma validação.
export function competenciaValida(competencia) {
  if (typeof competencia !== "string" || !/^\d{4}-\d{2}$/.test(competencia)) {
    return false;
  }

  const mes = Number(competencia.slice(5, 7));
  return mes >= 1 && mes <= 12;
}

// Confere formato e existência real da data (rejeita 31/02, por exemplo).
export function dataValida(dataISO) {
  if (typeof dataISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
    return false;
  }

  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function normalizarData(valor) {
  return dataValida(valor) ? valor : null;
}

function normalizarValor(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return 0;
  return Math.round(numero);
}

// Valores vindos de backup podem estar inválidos; nas somas, contam como zero.
function valorSeguro(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return 0;
  return Math.round(numero);
}
