// Testes para js/dados/armazenamento.js

import { describe } from "./testes.js";
import { carregar, salvar, criarEstadoInicial } from "../js/dados/armazenamento.js";
import { tarefasDeExemplo } from "../js/dados/exemplo.js";

describe("armazenamento", (suite) => {
  const CHAVE = "painel.dados";
  const CHAVE_BACKUP = "painel.dados.corrompido";

  suite.beforeEach(() => {
    localStorage.clear();
  });

  suite.test("carregar cria estado inicial se vazio", (Assert) => {
    const estado = carregar();
    Assert.true(typeof estado === "object", "retorna objeto");
    Assert.equals(estado.schemaVersion, 1);
    Assert.true(Array.isArray(estado.tarefas));
    Assert.true(estado.tarefas.length > 0, "tem tarefas de exemplo");
    Assert.true(Array.isArray(estado.metas));
    Assert.true(Array.isArray(estado.lancamentos));
    Assert.true(Array.isArray(estado.contasFixas));
    Assert.true(Array.isArray(estado.pagamentos));
    Assert.true(estado.config.categoriasTarefas.length > 0);
    Assert.true(estado.config.categoriasFinancas.length > 0);
  });

  suite.test("salvar e carregar mantêm dados", (Assert) => {
    const estadoOriginal = carregar();
    estadoOriginal.tarefas.push({
      id: "test-id-1",
      titulo: "Tarefa de teste",
      descricao: null,
      categoria: "Teste",
      prioridade: "media",
      data: "2026-10-18",
      horaInicio: "10:00",
      duracaoMinutos: 30,
      recorrencia: null,
      metaId: null,
      excecoes: {},
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    });
    salvar(estadoOriginal);

    const estadoCarregado = carregar();
    Assert.equals(estadoCarregado.tarefas.length, estadoOriginal.tarefas.length);
    const encontrada = estadoCarregado.tarefas.find(t => t.id === "test-id-1");
    Assert.true(!!encontrada, "tarefa de teste persistiu");
    Assert.equals(encontrada.titulo, "Tarefa de teste");
  });

  suite.test("dados corrompidos geram backup e resetam", (Assert) => {
    localStorage.setItem(CHAVE, "{json inválido");
    const consoleSpy = [];
    const originalError = console.error;
    console.error = (...args) => consoleSpy.push(args);

    const estado = carregar();

    console.error = originalError;
    Assert.true(estado.schemaVersion === 1, "resetou para estado inicial");
    Assert.true(localStorage.getItem(CHAVE_BACKUP) === "{json inválido", "backup salvo");
  });

  suite.test("criarEstadoInicial tem estrutura completa", (Assert) => {
    const estado = criarEstadoInicial();
    Assert.equals(estado.schemaVersion, 1);
    Assert.true(Array.isArray(estado.tarefas));
    Assert.equals(estado.tarefas.length, tarefasDeExemplo().length);
    Assert.deepEquals(estado.config.categoriasTarefas, ["Trabalho", "Pessoal", "Estudos", "Saúde"]);
    Assert.deepEquals(estado.config.categoriasFinancas, ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Outros"]);
  });

  suite.test("salvar aceita estado com arrays vazios", (Assert) => {
    const vazio = {
      schemaVersion: 1,
      config: { categoriasTarefas: [], categoriasFinancas: [] },
      tarefas: [], metas: [], lancamentos: [], contasFixas: [], pagamentos: []
    };
    Assert.notThrows(() => salvar(vazio), "salva sem erro");
    const carregado = carregar();
    Assert.equals(carregado.tarefas.length, 0);
  });
});