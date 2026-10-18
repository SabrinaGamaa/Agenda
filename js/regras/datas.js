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
