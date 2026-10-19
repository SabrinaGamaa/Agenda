// Regras de recorrência: calculam em quais datas uma tarefa ocorre.
// As ocorrências NÃO são salvas: a série é guardada uma vez (tarefa.data +
// tarefa.recorrencia) e recalculada para a janela de datas pedida.
// Funções puras: não tocam DOM nem localStorage.
//
// Formato (PLANO.md §7):
//   recorrencia: null  -> tarefa única, ocorre só em tarefa.data
//   {
//     tipo: "diaria" | "semanal" | "diasDaSemana" | "mensal",
//     intervalo: 1,
//     diasDaSemana: [0..6],            // só no tipo "diasDaSemana"
//     fim: { tipo: "nunca" }
//        | { tipo: "emData", data: "AAAA-MM-DD" }
//        | { tipo: "apos", quantidade: N }
//   }
//
// Decisões registradas no código:
// - "diasDaSemana" repete todas as semanas; o intervalo não é usado nesse tipo.
// - "fim: apos N" conta as N primeiras ocorrências da série, mesmo que alguma
//   tenha sido cancelada (cancelar é uma exceção, não muda a definição da série).
// - Ocorrências canceladas são omitidas por padrão. Use { incluirCanceladas: true }
//   quando precisar enxergar a série completa (ex.: tela de edição).

import { somarDias, somarMeses, diaDaSemana, diferencaEmDias } from "./datas.js";

const TIPOS_VALIDOS = ["diaria", "semanal", "diasDaSemana", "mensal"];

// A tarefa tem uma regra de repetição (não é única)?
export function ehRecorrente(tarefa) {
  return Boolean(tarefa?.recorrencia);
}

// A ocorrência daquela data foi cancelada por uma exceção?
export function ocorrenciaCancelada(tarefa, dataISO) {
  return tarefa?.excecoes?.[dataISO]?.cancelada === true;
}

// A tarefa ocorre na data? (já considera cancelamentos)
export function tarefaOcorreEm(tarefa, dataISO) {
  return ocorrenciasNoPeriodo(tarefa, dataISO, dataISO).length > 0;
}

/**
 * Datas das ocorrências entre inicioISO e fimISO (inclusive), em ordem.
 * A janela limita o cálculo: séries infinitas nunca são materializadas.
 *
 * @param {Object} tarefa - tarefa com data, recorrencia e excecoes
 * @param {string} inicioISO - primeira data da janela ("AAAA-MM-DD")
 * @param {string} fimISO - última data da janela ("AAAA-MM-DD")
 * @param {Object} [opcoes]
 * @param {boolean} [opcoes.incluirCanceladas=false] - inclui ocorrências canceladas
 * @returns {string[]} datas "AAAA-MM-DD" em ordem crescente
 */
export function ocorrenciasNoPeriodo(
  tarefa,
  inicioISO,
  fimISO,
  { incluirCanceladas = false } = {}
) {
  if (!tarefa?.data || inicioISO > fimISO) return [];

  // Tarefa única: a série tem uma ocorrência só, na própria data.
  if (!ehRecorrente(tarefa)) {
    const data = tarefa.data;
    if (data < inicioISO || data > fimISO) return [];
    if (!incluirCanceladas && ocorrenciaCancelada(tarefa, data)) return [];
    return [data];
  }

  const recorrencia = tarefa.recorrencia;
  if (!TIPOS_VALIDOS.includes(recorrencia.tipo)) return [];

  const fimDaSerie = calcularFimDaSerie(tarefa.data, recorrencia, fimISO);
  if (fimDaSerie === null || fimDaSerie < tarefa.data) return [];

  const datas = gerarDatasNaJanela(tarefa.data, recorrencia, inicioISO, fimDaSerie);

  return incluirCanceladas
    ? datas
    : datas.filter((dataISO) => !ocorrenciaCancelada(tarefa, dataISO));
}

// Até quando a série pode gerar ocorrências dentro da janela pedida.
// Devolve null quando a própria definição não gera nenhuma ocorrência.
function calcularFimDaSerie(inicioISO, recorrencia, limiteISO) {
  const fim = recorrencia.fim ?? { tipo: "nunca" };

  if (fim.tipo === "emData") {
    if (!fim.data) return null;
    return fim.data < limiteISO ? fim.data : limiteISO;
  }

  if (fim.tipo === "apos") {
    const quantidade = Number(fim.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1) return null;

    const ultima = dataDaEnesimaOcorrencia(inicioISO, recorrencia, quantidade);
    if (ultima === null) return null;
    return ultima < limiteISO ? ultima : limiteISO;
  }

  // "nunca" (ou fim ausente): a janela é o único limite.
  return limiteISO;
}

// Data da N-ésima ocorrência da série (1 = primeira), contando a série
// como definida — inclusive ocorrências canceladas.
function dataDaEnesimaOcorrencia(inicioISO, recorrencia, quantidade) {
  const intervalo = normalizarIntervalo(recorrencia.intervalo);

  switch (recorrencia.tipo) {
    case "diaria":
      return somarDias(inicioISO, (quantidade - 1) * intervalo);

    case "semanal":
      return somarDias(inicioISO, (quantidade - 1) * intervalo * 7);

    case "mensal":
      return somarMeses(inicioISO, (quantidade - 1) * intervalo);

    case "diasDaSemana": {
      const dias = normalizarDiasDaSemana(recorrencia.diasDaSemana);
      if (dias.length === 0) return null;

      let data = inicioISO;
      let contador = 0;
      while (true) {
        if (dias.includes(diaDaSemana(data))) {
          contador++;
          if (contador === quantidade) return data;
        }
        data = somarDias(data, 1);
      }
    }

    default:
      return null;
  }
}

// Gera as datas dentro da janela, de acordo com o tipo de recorrência.
function gerarDatasNaJanela(inicioISO, recorrencia, inicioJanelaISO, fimJanelaISO) {
  switch (recorrencia.tipo) {
    case "diaria":
      return gerarPorPassoEmDias(
        inicioISO,
        inicioJanelaISO,
        fimJanelaISO,
        normalizarIntervalo(recorrencia.intervalo)
      );

    case "semanal":
      return gerarPorPassoEmDias(
        inicioISO,
        inicioJanelaISO,
        fimJanelaISO,
        normalizarIntervalo(recorrencia.intervalo) * 7
      );

    case "mensal":
      return gerarPorPassoEmMeses(
        inicioISO,
        inicioJanelaISO,
        fimJanelaISO,
        normalizarIntervalo(recorrencia.intervalo)
      );

    case "diasDaSemana":
      return gerarPorDiasDaSemana(
        inicioISO,
        inicioJanelaISO,
        fimJanelaISO,
        normalizarDiasDaSemana(recorrencia.diasDaSemana)
      );

    default:
      return [];
  }
}

// Diária/semanal: pula direto para a primeira ocorrência dentro da janela.
function gerarPorPassoEmDias(inicioISO, inicioJanelaISO, fimJanelaISO, passoDias) {
  const primeiraData = inicioISO > inicioJanelaISO ? inicioISO : inicioJanelaISO;
  const diferenca = diferencaEmDias(inicioISO, primeiraData);
  const saltos = Math.max(0, Math.ceil(diferenca / passoDias));
  let data = somarDias(inicioISO, saltos * passoDias);

  const datas = [];
  while (data <= fimJanelaISO) {
    datas.push(data);
    data = somarDias(data, passoDias);
  }
  return datas;
}

// Mensal: o dia é sempre calculado a partir da data original, com o ajuste
// para o último dia do mês quando o dia não existe (31 -> 28/29/30).
// Assim, 31/01 gera 28/02 e depois 31/03 (o ajuste não "contamina" o mês seguinte).
function gerarPorPassoEmMeses(inicioISO, inicioJanelaISO, fimJanelaISO, passoMeses) {
  const mesesAteJanela = diferencaEmMeses(inicioISO, inicioJanelaISO);
  let indice = Math.max(0, Math.ceil(mesesAteJanela / passoMeses));
  let data = somarMeses(inicioISO, indice * passoMeses);

  const datas = [];
  while (data <= fimJanelaISO) {
    // A primeira data calculada pode cair antes da janela (ex.: dia 15 em uma
    // janela que começa no dia 20): nesse caso, ela é só ignorada.
    if (data >= inicioJanelaISO && data >= inicioISO) {
      datas.push(data);
    }
    indice++;
    data = somarMeses(inicioISO, indice * passoMeses);
  }
  return datas;
}

// Dias da semana: percorre a janela dia a dia e seleciona os dias escolhidos.
// A janela das visões é curta (um mês, no máximo), então o custo é baixo.
function gerarPorDiasDaSemana(inicioISO, inicioJanelaISO, fimJanelaISO, diasDaSemana) {
  if (diasDaSemana.length === 0) return [];

  const primeiraData = inicioISO > inicioJanelaISO ? inicioISO : inicioJanelaISO;
  const datas = [];
  let data = primeiraData;

  while (data <= fimJanelaISO) {
    if (diasDaSemana.includes(diaDaSemana(data))) {
      datas.push(data);
    }
    data = somarDias(data, 1);
  }
  return datas;
}

// Diferença em meses entre as partes "ano-mês" das datas (fim - início).
function diferencaEmMeses(inicioISO, fimISO) {
  const [anoInicio, mesInicio] = inicioISO.split("-").map(Number);
  const [anoFim, mesFim] = fimISO.split("-").map(Number);
  return (anoFim - anoInicio) * 12 + (mesFim - mesInicio);
}

// Intervalo válido é inteiro >= 1; qualquer outra coisa vira 1 (sem repetir erro na tela).
function normalizarIntervalo(intervalo) {
  const numero = Number(intervalo);
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
}

// Dias da semana válidos: inteiros de 0 (domingo) a 6 (sábado), sem duplicatas.
function normalizarDiasDaSemana(dias) {
  if (!Array.isArray(dias)) return [];
  return [...new Set(
    dias
      .map(Number)
      .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
  )].sort((a, b) => a - b);
}
