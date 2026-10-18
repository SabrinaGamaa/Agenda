// Testes para js/regras/filtros.js

import { describe } from "./testes.js";
import { obterFiltros, definirFiltro, limparFiltros, temFiltroAtivo, filtrarTarefas } from "../js/regras/filtros.js";

// Cria uma tarefa falsa só com os campos que os filtros usam.
function tarefaFalsa({ id, categoria = "Trabalho", prioridade = "media", concluidaEm = null }) {
  return {
    id,
    titulo: "Tarefa " + id,
    categoria,
    prioridade,
    data: "2026-10-18",
    horaInicio: "09:00",
    duracaoMinutos: 30,
    excecoes: concluidaEm ? { [concluidaEm]: { concluida: true } } : {}
  };
}

describe("filtros", (suite) => {
  // Cada teste começa com os filtros limpos (o módulo guarda estado em memória).
  suite.beforeEach(() => limparFiltros());

  suite.test("sem filtros, devolve todas as tarefas", (Assert) => {
    const lista = [tarefaFalsa({ id: "1" }), tarefaFalsa({ id: "2", prioridade: "alta" })];
    Assert.false(temFiltroAtivo(), "nenhum filtro ativo");
    Assert.length(filtrarTarefas(lista, "2026-10-18"), 2, "todas passam");
  });

  suite.test("filtra por categoria", (Assert) => {
    const lista = [tarefaFalsa({ id: "1", categoria: "Trabalho" }), tarefaFalsa({ id: "2", categoria: "Pessoal" })];
    definirFiltro("categoria", "Pessoal");
    const resultado = filtrarTarefas(lista, "2026-10-18");
    Assert.length(resultado, 1, "só a de Pessoal");
    Assert.equals(resultado[0].id, "2", "id certo");
  });

  suite.test("filtra por prioridade", (Assert) => {
    const lista = [tarefaFalsa({ id: "1", prioridade: "alta" }), tarefaFalsa({ id: "2", prioridade: "baixa" })];
    definirFiltro("prioridade", "alta");
    const resultado = filtrarTarefas(lista, "2026-10-18");
    Assert.length(resultado, 1, "só a de prioridade alta");
    Assert.equals(resultado[0].id, "1", "id certo");
  });

  suite.test("filtra por situação (pendentes/concluídas)", (Assert) => {
    const lista = [tarefaFalsa({ id: "1" }), tarefaFalsa({ id: "2", concluidaEm: "2026-10-18" })];

    definirFiltro("situacao", "pendentes");
    const pendentes = filtrarTarefas(lista, "2026-10-18");
    Assert.length(pendentes, 1, "só pendentes");
    Assert.equals(pendentes[0].id, "1", "id certo");

    definirFiltro("situacao", "concluidas");
    const concluidas = filtrarTarefas(lista, "2026-10-18");
    Assert.length(concluidas, 1, "só concluídas");
    Assert.equals(concluidas[0].id, "2", "id certo");
  });

  suite.test("conclusão é por data (exceções)", (Assert) => {
    const lista = [tarefaFalsa({ id: "1", concluidaEm: "2026-10-18" })];
    definirFiltro("situacao", "pendentes");
    Assert.length(filtrarTarefas(lista, "2026-10-18"), 0, "concluída nesse dia");
    Assert.length(filtrarTarefas(lista, "2026-10-19"), 1, "pendente em outro dia");
  });

  suite.test("filtros combinam entre si (E lógico)", (Assert) => {
    const lista = [
      tarefaFalsa({ id: "1", categoria: "Trabalho", prioridade: "alta" }),
      tarefaFalsa({ id: "2", categoria: "Trabalho", prioridade: "baixa" }),
      tarefaFalsa({ id: "3", categoria: "Pessoal", prioridade: "alta" })
    ];
    definirFiltro("categoria", "Trabalho");
    definirFiltro("prioridade", "alta");
    definirFiltro("situacao", "pendentes");
    const resultado = filtrarTarefas(lista, "2026-10-18");
    Assert.true(temFiltroAtivo(), "tem filtro ativo");
    Assert.length(resultado, 1, "só Trabalho + Alta + Pendente");
    Assert.equals(resultado[0].id, "1", "id certo");
  });

  suite.test("limparFiltros volta ao padrão", (Assert) => {
    definirFiltro("categoria", "Pessoal");
    definirFiltro("prioridade", "baixa");
    definirFiltro("situacao", "concluidas");
    limparFiltros();
    Assert.deepEquals(obterFiltros(), { categoria: "", prioridade: "", situacao: "todas" }, "padrão restaurado");
    Assert.false(temFiltroAtivo(), "nenhum filtro ativo");
  });
});
