// Testes para js/regras/datas.js

import { describe } from "./testes.js";
import { hojeISO, somarDias, somarMeses, inicioDaSemana, rotuloSemana, formatarData, formatarDataLonga, somarMinutos, formatarDuracao, diaDaSemana, diferencaEmDias } from "../js/regras/datas.js";

describe("datas", (suite) => {
  suite.test("hojeISO retorna string AAAA-MM-DD", (Assert) => {
    const hoje = hojeISO();
    Assert.true(/^\d{4}-\d{2}-\d{2}$/.test(hoje), "formato AAAA-MM-DD");
  });

  suite.test("somarDias avança dias corretamente", (Assert) => {
    Assert.equals(somarDias("2026-10-18", 1), "2026-10-19", "+1 dia");
    Assert.equals(somarDias("2026-10-18", -1), "2026-10-17", "-1 dia");
    Assert.equals(somarDias("2026-10-31", 1), "2026-11-01", "virada de mês");
    Assert.equals(somarDias("2026-12-31", 1), "2027-01-01", "virada de ano");
    Assert.equals(somarDias("2026-02-28", 1), "2026-03-01", "fevereiro não bissexto");
    Assert.equals(somarDias("2024-02-28", 1), "2024-02-29", "fevereiro bissexto");
  });

  suite.test("diaDaSemana devolve 0 (domingo) a 6 (sábado)", (Assert) => {
    Assert.equals(diaDaSemana("2026-10-18"), 0, "domingo");
    Assert.equals(diaDaSemana("2026-10-19"), 1, "segunda");
    Assert.equals(diaDaSemana("2026-10-24"), 6, "sábado");
    Assert.equals(diaDaSemana("2026-11-01"), 0, "domingo de outro mês");
  });

  suite.test("diferencaEmDias conta os dias entre duas datas", (Assert) => {
    Assert.equals(diferencaEmDias("2026-10-18", "2026-10-25"), 7, "uma semana");
    Assert.equals(diferencaEmDias("2026-10-25", "2026-10-18"), -7, "ordem inversa");
    Assert.equals(diferencaEmDias("2026-10-31", "2026-11-01"), 1, "virada de mês");
    Assert.equals(diferencaEmDias("2026-12-31", "2027-01-01"), 1, "virada de ano");
    Assert.equals(diferencaEmDias("2024-02-28", "2024-03-01"), 2, "ano bissexto");
    Assert.equals(diferencaEmDias("2026-02-28", "2026-03-01"), 1, "ano não bissexto");
  });

  suite.test("formatarData converte AAAA-MM-DD para DD/MM/AAAA", (Assert) => {
    Assert.equals(formatarData("2026-10-18"), "18/10/2026");
    Assert.equals(formatarData("2026-01-01"), "01/01/2026");
  });

  suite.test("formatarDataLonga retorna data por extenso em pt-BR", (Assert) => {
    const longa = formatarDataLonga("2026-10-18");
    Assert.true(longa.includes("outubro"), "contém mês");
    Assert.true(longa.includes("2026"), "contém ano");
    Assert.true(/^(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i.test(longa), "começa com dia da semana");
  });

  suite.test("somarMinutos calcula horário final e dia seguinte", (Assert) => {
    const r1 = somarMinutos("10:00", 60);
    Assert.equals(r1.horaFinal, "11:00", "10:00 + 60min = 11:00");
    Assert.false(r1.diaSeguinte, "não vira dia");

    const r2 = somarMinutos("23:30", 60);
    Assert.equals(r2.horaFinal, "00:30", "23:30 + 60min = 00:30");
    Assert.true(r2.diaSeguinte, "vira dia seguinte");

    const r3 = somarMinutos("22:00", 180);
    Assert.equals(r3.horaFinal, "01:00", "22:00 + 180min = 01:00");
    Assert.true(r3.diaSeguinte, "vira dia seguinte");

    const r4 = somarMinutos("00:00", 1440);
    Assert.equals(r4.horaFinal, "00:00", "24h volta pro mesmo horário");
    Assert.true(r4.diaSeguinte, "vira dia seguinte");
  });

  suite.test("formatarDuracao formata minutos em texto legível", (Assert) => {
    Assert.equals(formatarDuracao(45), "45 min");
    Assert.equals(formatarDuracao(60), "1 h");
    Assert.equals(formatarDuracao(90), "1 h 30 min");
    Assert.equals(formatarDuracao(120), "2 h");
    Assert.equals(formatarDuracao(150), "2 h 30 min");
  });

  suite.test("somarMeses soma e subtrai meses, ajustando o dia", (Assert) => {
    Assert.equals(somarMeses("2026-10-15", 1), "2026-11-15", "+1 mês");
    Assert.equals(somarMeses("2026-10-01", -1), "2026-09-01", "-1 mês");
    Assert.equals(somarMeses("2026-01-31", 1), "2026-02-28", "31/01 + 1 mês vira 28/02");
    Assert.equals(somarMeses("2024-01-31", 1), "2024-02-29", "ano bissexto vira 29/02");
    Assert.equals(somarMeses("2026-12-10", 1), "2027-01-10", "virada de ano");
    Assert.equals(somarMeses("2026-12-31", 2), "2027-02-28", "31/12 + 2 meses vira 28/02/2027");
  });

  suite.test("inicioDaSemana devolve o domingo da semana", (Assert) => {
    Assert.equals(inicioDaSemana("2026-10-18"), "2026-10-18", "domingo continua domingo");
    Assert.equals(inicioDaSemana("2026-10-19"), "2026-10-18", "segunda volta pro domingo anterior");
    Assert.equals(inicioDaSemana("2026-10-24"), "2026-10-18", "sábado volta pro domingo da mesma semana");
    Assert.equals(inicioDaSemana("2026-11-01"), "2026-11-01", "domingo de outro mês");
    Assert.equals(inicioDaSemana("2026-11-02"), "2026-11-01", "segunda com virada de mês");
  });

  suite.test("rotuloSemana monta o período legível", (Assert) => {
    Assert.equals(rotuloSemana("2026-10-18"), "18 a 24 de outubro de 2026", "mesmo mês");
    Assert.equals(rotuloSemana("2026-11-01"), "1 a 7 de novembro de 2026", "mesmo mês (novembro)");
    Assert.equals(rotuloSemana("2026-11-29"), "29 de novembro a 5 de dezembro de 2026", "atravessa meses");
    Assert.equals(rotuloSemana("2026-12-27"), "27 de dezembro de 2026 a 2 de janeiro de 2027", "atravessa anos");
  });
});