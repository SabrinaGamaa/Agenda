// Testes para js/regras/recorrencia.js
// Cobrem os quatro tipos, os três fins de série e os casos de borda do plano
// (dia 31 em mês curto, ano bissexto, série iniciada no passado, cancelamento).

import { describe } from "./testes.js";
import {
  ehRecorrente,
  ocorrenciaCancelada,
  ocorrenciasNoPeriodo,
  tarefaOcorreEm,
  validarRecorrencia
} from "../js/regras/recorrencia.js";

// Cria uma tarefa mínima só com os campos que a recorrência usa.
function criarTarefa(data, recorrencia = null, excecoes = {}) {
  return { data, recorrencia, excecoes };
}

// Cria uma regra de recorrência com padrões fáceis de sobrescrever.
function regra(tipo, extras = {}) {
  return { tipo, intervalo: 1, fim: { tipo: "nunca" }, ...extras };
}

describe("recorrencia", (suite) => {
  suite.test("tarefa única ocorre só na própria data", (Assert) => {
    const tarefa = criarTarefa("2026-10-18");

    Assert.false(ehRecorrente(tarefa), "sem regra não é recorrente");
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-01", "2026-10-31"),
      ["2026-10-18"],
      "aparece dentro do período"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-19", "2026-10-31"),
      [],
      "não aparece fora do período"
    );
    Assert.true(tarefaOcorreEm(tarefa, "2026-10-18"), "ocorre na própria data");
    Assert.false(tarefaOcorreEm(tarefa, "2026-10-19"), "não ocorre em outra data");
  });

  suite.test("diária gera todos os dias e respeita o intervalo", (Assert) => {
    const todosOsDias = criarTarefa("2026-10-18", regra("diaria"));
    Assert.true(ehRecorrente(todosOsDias), "com regra é recorrente");
    Assert.deepEquals(
      ocorrenciasNoPeriodo(todosOsDias, "2026-10-18", "2026-10-21"),
      ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"],
      "um por dia"
    );
    Assert.true(tarefaOcorreEm(todosOsDias, "2026-10-25"), "ocorre uma semana depois");

    const aCadaDoisDias = criarTarefa("2026-10-18", regra("diaria", { intervalo: 2 }));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(aCadaDoisDias, "2026-10-18", "2026-10-24"),
      ["2026-10-18", "2026-10-20", "2026-10-22", "2026-10-24"],
      "intervalo de 2 dias"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(aCadaDoisDias, "2026-10-19", "2026-10-23"),
      ["2026-10-20", "2026-10-22"],
      "janela começando no meio da série"
    );
  });

  suite.test("série iniciada no passado é calculada direto na janela", (Assert) => {
    const tarefa = criarTarefa("2020-01-01", regra("diaria"));

    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-18", "2026-10-20"),
      ["2026-10-18", "2026-10-19", "2026-10-20"],
      "não precisa percorrer os anos desde 2020"
    );
  });

  suite.test("semanal mantém o dia da semana e respeita o intervalo", (Assert) => {
    const semanal = criarTarefa("2026-10-18", regra("semanal"));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(semanal, "2026-10-18", "2026-11-01"),
      ["2026-10-18", "2026-10-25", "2026-11-01"],
      "todo domingo"
    );

    const quinzenal = criarTarefa("2026-10-18", regra("semanal", { intervalo: 2 }));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(quinzenal, "2026-10-18", "2026-11-15"),
      ["2026-10-18", "2026-11-01", "2026-11-15"],
      "a cada 2 semanas"
    );
  });

  suite.test("dias da semana repete nos dias escolhidos", (Assert) => {
    const segQuaSex = criarTarefa(
      "2026-10-19",
      regra("diasDaSemana", { diasDaSemana: [1, 3, 5] })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(segQuaSex, "2026-10-19", "2026-10-30"),
      ["2026-10-19", "2026-10-21", "2026-10-23", "2026-10-26", "2026-10-28", "2026-10-30"],
      "segundas, quartas e sextas"
    );

    // A data inicial é terça e não está entre os dias escolhidos:
    // a primeira ocorrência é o próximo dia escolhido (quarta).
    const comecaNaTerca = criarTarefa(
      "2026-10-20",
      regra("diasDaSemana", { diasDaSemana: [1, 3, 5] })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(comecaNaTerca, "2026-10-19", "2026-10-25"),
      ["2026-10-21", "2026-10-23"],
      "primeira ocorrência é o próximo dia escolhido"
    );

    // O plano define este tipo como "todas as semanas"; o intervalo é ignorado.
    const comIntervalo = criarTarefa(
      "2026-10-19",
      regra("diasDaSemana", { intervalo: 2, diasDaSemana: [1] })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(comIntervalo, "2026-10-19", "2026-10-31"),
      ["2026-10-19", "2026-10-26"],
      "intervalo não afeta diasDaSemana"
    );
  });

  suite.test("mensal ajusta dias 29-31 para o último dia do mês", (Assert) => {
    const dia31 = criarTarefa("2026-01-31", regra("mensal"));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(dia31, "2026-01-01", "2026-05-31"),
      ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"],
      "31 -> 28/30 sem contaminar o mês seguinte"
    );

    const bissexto = criarTarefa("2024-01-31", regra("mensal"));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(bissexto, "2024-01-01", "2024-03-31"),
      ["2024-01-31", "2024-02-29", "2024-03-31"],
      "ano bissexto usa 29/02"
    );
  });

  suite.test("mensal respeita intervalo e início da janela", (Assert) => {
    const aCadaDoisMeses = criarTarefa("2026-01-15", regra("mensal", { intervalo: 2 }));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(aCadaDoisMeses, "2026-01-01", "2026-05-31"),
      ["2026-01-15", "2026-03-15", "2026-05-15"],
      "a cada 2 meses"
    );

    const todoMes = criarTarefa("2026-01-15", regra("mensal"));
    Assert.deepEquals(
      ocorrenciasNoPeriodo(todoMes, "2026-02-20", "2026-04-30"),
      ["2026-03-15", "2026-04-15"],
      "janela no meio do mês ignora a ocorrência anterior"
    );
  });

  suite.test("fim em data é inclusivo", (Assert) => {
    const tarefa = criarTarefa(
      "2026-10-18",
      regra("diaria", { fim: { tipo: "emData", data: "2026-10-20" } })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-18", "2026-10-31"),
      ["2026-10-18", "2026-10-19", "2026-10-20"],
      "para na data final"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-21", "2026-10-31"),
      [],
      "depois do fim não há ocorrências"
    );

    const fimAntesDoInicio = criarTarefa(
      "2026-10-18",
      regra("diaria", { fim: { tipo: "emData", data: "2026-10-10" } })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(fimAntesDoInicio, "2026-10-01", "2026-10-31"),
      [],
      "fim antes do início não gera nada"
    );
  });

  suite.test("fim após N limita a quantidade de ocorrências", (Assert) => {
    const tarefa = criarTarefa(
      "2026-10-18",
      regra("diaria", { fim: { tipo: "apos", quantidade: 3 } })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-18", "2026-10-31"),
      ["2026-10-18", "2026-10-19", "2026-10-20"],
      "para após 3 ocorrências"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-21", "2026-10-31"),
      [],
      "depois da terceira não há mais"
    );

    const mensalComAjuste = criarTarefa(
      "2026-01-31",
      regra("mensal", { fim: { tipo: "apos", quantidade: 2 } })
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(mensalComAjuste, "2026-01-01", "2026-03-31"),
      ["2026-01-31", "2026-02-28"],
      "N-ésima ocorrência mensal considera o ajuste de fevereiro"
    );
  });

  suite.test("cancelar uma ocorrência não afeta as outras", (Assert) => {
    const tarefa = criarTarefa(
      "2026-10-18",
      regra("diaria"),
      { "2026-10-19": { cancelada: true } }
    );

    Assert.true(ocorrenciaCancelada(tarefa, "2026-10-19"), "exceção registrada");
    Assert.false(ocorrenciaCancelada(tarefa, "2026-10-20"), "outra data não foi cancelada");
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-18", "2026-10-21"),
      ["2026-10-18", "2026-10-20", "2026-10-21"],
      "a data cancelada some, as demais continuam"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-18", "2026-10-21", { incluirCanceladas: true }),
      ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"],
      "opção incluirCanceladas mostra a série completa"
    );
    Assert.false(tarefaOcorreEm(tarefa, "2026-10-19"), "tarefaOcorreEm ignora cancelada");
  });

  suite.test("fim após N conta ocorrências canceladas", (Assert) => {
    const tarefa = criarTarefa(
      "2026-10-18",
      regra("diaria", { fim: { tipo: "apos", quantidade: 3 } }),
      { "2026-10-19": { cancelada: true } }
    );

    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-18", "2026-10-31"),
      ["2026-10-18", "2026-10-20"],
      "a cancelada não é substituída por uma quarta ocorrência"
    );
  });

  suite.test("tarefa única cancelada não aparece", (Assert) => {
    const tarefa = criarTarefa(
      "2026-10-18",
      null,
      { "2026-10-18": { cancelada: true } }
    );

    Assert.deepEquals(
      ocorrenciasNoPeriodo(tarefa, "2026-10-01", "2026-10-31"),
      [],
      "a única ocorrência foi cancelada"
    );
  });

  suite.test("série infinita é calculada só na janela pedida", (Assert) => {
    const tarefa = criarTarefa("2026-01-01", regra("diaria"));
    const janeiro = ocorrenciasNoPeriodo(tarefa, "2026-01-01", "2026-01-31");

    Assert.length(janeiro, 31, "um mês de 31 dias = 31 ocorrências");
    Assert.equals(janeiro[0], "2026-01-01", "primeira data");
    Assert.equals(janeiro[30], "2026-01-31", "última data");
  });

  suite.test("regras inválidas ou janelas invertidas devolvem lista vazia", (Assert) => {
    Assert.deepEquals(
      ocorrenciasNoPeriodo(
        criarTarefa("2026-10-18", { tipo: "inexistente", intervalo: 1, fim: { tipo: "nunca" } }),
        "2026-10-01",
        "2026-10-31"
      ),
      [],
      "tipo desconhecido"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(
        criarTarefa("2026-10-18", regra("diasDaSemana", { diasDaSemana: [] })),
        "2026-10-01",
        "2026-10-31"
      ),
      [],
      "nenhum dia da semana escolhido"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(
        criarTarefa("2026-10-18", regra("diaria", { fim: { tipo: "apos", quantidade: 0 } })),
        "2026-10-01",
        "2026-10-31"
      ),
      [],
      "quantidade zero no fim após N"
    );
    Assert.deepEquals(
      ocorrenciasNoPeriodo(criarTarefa("2026-10-18"), "2026-10-31", "2026-10-01"),
      [],
      "janela invertida"
    );
  });

  // --- validarRecorrencia (usada pelo formulário) ---

  suite.test("validação aceita as combinações válidas", (Assert) => {
    Assert.length(validarRecorrencia(null), 0, "sem repetição é válido");
    Assert.length(validarRecorrencia(regra("diaria")), 0, "diária padrão");
    Assert.length(
      validarRecorrencia(
        regra("semanal", { intervalo: 2, fim: { tipo: "emData", data: "2026-12-31" } }),
        "2026-10-18"
      ),
      0,
      "semanal com intervalo e fim em data"
    );
    Assert.length(
      validarRecorrencia(regra("diasDaSemana", { diasDaSemana: [0, 2, 6] })),
      0,
      "dias da semana válidos"
    );
    Assert.length(
      validarRecorrencia(regra("mensal", { fim: { tipo: "apos", quantidade: 12 } })),
      0,
      "mensal com fim após N"
    );
    Assert.length(
      validarRecorrencia(
        regra("diaria", { fim: { tipo: "emData", data: "2026-10-18" } }),
        "2026-10-18"
      ),
      0,
      "fim igual à data inicial vale (uma ocorrência)"
    );
  });

  suite.test("validação aponta tipo, intervalo e dias inválidos", (Assert) => {
    Assert.length(
      validarRecorrencia({ intervalo: 1, fim: { tipo: "nunca" } }),
      1,
      "tipo ausente"
    );
    Assert.length(validarRecorrencia(regra("diaria", { intervalo: 0 })), 1, "intervalo zero");
    Assert.length(validarRecorrencia(regra("semanal", { intervalo: 1.5 })), 1, "intervalo fracionado");
    Assert.length(validarRecorrencia(regra("mensal", { intervalo: 366 })), 1, "intervalo acima do limite");
    Assert.length(
      validarRecorrencia(regra("diasDaSemana", { diasDaSemana: [] })),
      1,
      "nenhum dia escolhido"
    );
    Assert.length(
      validarRecorrencia(regra("diasDaSemana", { diasDaSemana: [7] })),
      1,
      "dia fora de 0..6"
    );
    Assert.length(
      validarRecorrencia(regra("diasDaSemana", { diasDaSemana: "1,3" })),
      1,
      "dias que não são lista"
    );
  });

  suite.test("validação aponta fim ausente, invertido ou fora do limite", (Assert) => {
    Assert.length(
      validarRecorrencia(regra("diaria", { fim: { tipo: "emData" } })),
      1,
      "data final ausente"
    );
    Assert.length(
      validarRecorrencia(
        regra("diaria", { fim: { tipo: "emData", data: "2026-10-17" } }),
        "2026-10-18"
      ),
      1,
      "data final antes do início"
    );
    Assert.length(
      validarRecorrencia(regra("diaria", { fim: { tipo: "apos", quantidade: 0 } })),
      1,
      "zero ocorrências"
    );
    Assert.length(
      validarRecorrencia(regra("diaria", { fim: { tipo: "apos", quantidade: 1000 } })),
      1,
      "acima do limite de ocorrências"
    );
    Assert.length(
      validarRecorrencia(regra("diaria", { fim: { tipo: "outro" } })),
      1,
      "tipo de fim desconhecido"
    );
  });
});
