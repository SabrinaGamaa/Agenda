// Testes para js/regras/dinheiro.js

import { describe } from "./testes.js";
import {
  formatarCentavos,
  reaisParaCentavos,
  centavosParaReais
} from "../js/regras/dinheiro.js";

describe("dinheiro", (suite) => {
  suite.test("formatarCentavos usa moeda brasileira", (Assert) => {
    const zero = formatarCentavos(0);
    Assert.true(zero.includes("0,00"), "zero aparece como 0,00");
    Assert.true(zero.startsWith("R$"), "tem o símbolo R$");

    const valor = formatarCentavos(123456);
    Assert.true(valor.includes("1.234,56"), "123456 centavos = 1.234,56");

    Assert.true(formatarCentavos(99).includes("0,99"), "99 centavos = 0,99");
    Assert.true(formatarCentavos(1234.6).includes("12,35"), "arredonda os centavos");
    Assert.true(formatarCentavos("abc").includes("0,00"), "valor inválido vira zero");
  });

  suite.test("reaisParaCentavos aceita número e formato brasileiro", (Assert) => {
    Assert.equals(reaisParaCentavos(12.34), 1234, "número decimal");
    Assert.equals(reaisParaCentavos("12.34"), 1234, "texto com ponto decimal");
    Assert.equals(reaisParaCentavos("1.234,56"), 123456, "texto com milhar e vírgula");
    Assert.equals(reaisParaCentavos("0,10"), 10, "dez centavos");
    Assert.equals(reaisParaCentavos(0.1 + 0.2), 30, "arredonda a soma de decimais");
    Assert.equals(reaisParaCentavos(""), 0, "texto vazio");
    Assert.equals(reaisParaCentavos("abc"), 0, "texto inválido");
    Assert.equals(reaisParaCentavos(null), 0, "null");
  });

  suite.test("centavosParaReais gera texto para input numérico", (Assert) => {
    Assert.equals(centavosParaReais(123456), "1234.56");
    Assert.equals(centavosParaReais(5), "0.05");
    Assert.equals(centavosParaReais(0), "0.00");
    Assert.equals(centavosParaReais("abc"), "0.00", "valor inválido vira zero");
  });
});
