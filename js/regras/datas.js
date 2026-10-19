// Funções puras de data e hora.
// "Funções puras" = não dependem do navegador, do localStorage nem da tela:
// recebem valores e devolvem resultados. Por isso são fáceis de testar.
// Convenções do projeto: datas são textos "AAAA-MM-DD" e horas são "HH:MM".

// Converte "AAAA-MM-DD" em um Date local (meia-noite do dia, sem confusão de fuso).
function paraDateLocal(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// Data de hoje no formato "AAAA-MM-DD", usando o fuso local do computador.
export function hojeISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Soma (ou subtrai) dias a uma data "AAAA-MM-DD" e devolve outra no mesmo formato.
// O próprio JavaScript ajusta viradas de mês e ano (ex.: 31/01 + 1 dia = 01/02).
export function somarDias(dataISO, dias) {
  const data = paraDateLocal(dataISO);
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Dia da semana de uma data (0 = domingo ... 6 = sábado).
// Usa UTC para não sofrer influência de fuso horário nem de horário de verão.
export function diaDaSemana(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

// Diferença em dias entre duas datas (fim - início), sem depender de fuso horário.
// Exemplo: diferencaEmDias("2026-10-18", "2026-10-25") -> 7
export function diferencaEmDias(dataInicioISO, dataFimISO) {
  const [anoInicio, mesInicio, diaInicio] = dataInicioISO.split("-").map(Number);
  const [anoFim, mesFim, diaFim] = dataFimISO.split("-").map(Number);
  const inicioUTC = Date.UTC(anoInicio, mesInicio - 1, diaInicio);
  const fimUTC = Date.UTC(anoFim, mesFim - 1, diaFim);
  return Math.round((fimUTC - inicioUTC) / 86400000);
}

// "2026-10-18" -> "18/10/2026"
export function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// "2026-10-18" -> "domingo, 18 de outubro de 2026"
export function formatarDataLonga(dataISO) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(paraDateLocal(dataISO));
}

// Soma minutos a um horário "HH:MM".
// Devolve { horaFinal, diaSeguinte }; diaSeguinte = true quando o fim cai no dia seguinte.
// Exemplo: somarMinutos("22:30", 120) -> { horaFinal: "00:30", diaSeguinte: true }
export function somarMinutos(horaInicio, minutos) {
  const [horas, mins] = horaInicio.split(":").map(Number);
  let total = horas * 60 + mins + minutos;
  const diaSeguinte = total >= 24 * 60;
  total = total % (24 * 60);
  const horaFinal = String(Math.floor(total / 60)).padStart(2, "0");
  const minutoFinal = String(total % 60).padStart(2, "0");
  return { horaFinal: `${horaFinal}:${minutoFinal}`, diaSeguinte };
}

// 90 -> "1 h 30 min"; 45 -> "45 min"; 120 -> "2 h"
export function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (horas === 0) return `${mins} min`;
  if (mins === 0) return `${horas} h`;
  return `${horas} h ${mins} min`;
}

// Converte um Date local em "AAAA-MM-DD" (mesmo estilo de hojeISO/somarDias).
function paraISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Soma (ou subtrai) meses a uma data "AAAA-MM-DD".
// Quando o mês de destino é mais curto, o dia é ajustado:
// ex.: 31/01 + 1 mês = 28/02 (ou 29/02 em ano bissexto).
export function somarMeses(dataISO, meses) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const destino = new Date(ano, mes - 1 + meses, 1);
  const ultimoDiaDoMes = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(dia, ultimoDiaDoMes));
  return paraISO(destino);
}

// Domingo da semana que contém a data (a semana do app começa no domingo,
// igual à grade do calendário: Dom, Seg, Ter, ..., Sáb).
export function inicioDaSemana(dataISO) {
  const data = paraDateLocal(dataISO);
  data.setDate(data.getDate() - data.getDay()); // getDay(): 0 = domingo
  return paraISO(data);
}

// "2026-10-18" -> "18 a 24 de outubro de 2026".
// Atravessa meses/anos com rótulo completo: "27 de dezembro de 2026 a 2 de janeiro de 2027".
// Espera o domingo da semana como entrada (use junto com inicioDaSemana).
export function rotuloSemana(dataInicioISO) {
  const inicio = paraDateLocal(dataInicioISO);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
  const nomeMes = (d) => new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);

  const mesmoMes = inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear();
  if (mesmoMes) {
    return `${inicio.getDate()} a ${fim.getDate()} de ${nomeMes(inicio)} de ${inicio.getFullYear()}`;
  }
  if (inicio.getFullYear() === fim.getFullYear()) {
    return `${inicio.getDate()} de ${nomeMes(inicio)} a ${fim.getDate()} de ${nomeMes(fim)} de ${inicio.getFullYear()}`;
  }
  return `${inicio.getDate()} de ${nomeMes(inicio)} de ${inicio.getFullYear()} a ${fim.getDate()} de ${nomeMes(fim)} de ${fim.getFullYear()}`;
}
