// Testes para js/regras/metas.js

import { describe } from "./testes.js";
import {
  criarMeta,
  encontrarMeta,
  atualizarMeta,
  calcularProgresso,
  progressoFinanceiro,
  validarMeta,
  adicionarEtapa,
  alternarEtapa,
  excluirEtapa,
  excluirMeta,
  vincularTarefa,
  tarefasDaMeta
} from "../js/regras/metas.js";

function criarTarefaFalsa(metaId = null, data = "2026-10-20") {
  return {
    id: crypto.randomUUID(),
    titulo: "Tarefa de teste",
    metaId,
    data,
    horaInicio: "09:00",
    atualizadaEm: "2026-10-01T10:00:00.000Z"
  };
}

describe("metas", (suite) => {
  let estado;

  suite.beforeEach(() => {
    estado = { metas: [], tarefas: [] };
  });

  // --- criarMeta ---

  suite.test("criarMeta começa com os padrões do modelo", (Assert) => {
    const meta = criarMeta();

    Assert.true(typeof meta.id === "string" && meta.id.length > 0, "id gerado");
    Assert.equals(meta.titulo, "");
    Assert.equals(meta.descricao, null);
    Assert.equals(meta.tipo, "pessoal");
    Assert.equals(meta.prazo, null);
    Assert.equals(meta.situacao, "ativa");
    Assert.deepEquals(meta.etapas, []);
    Assert.equals(meta.valorAlvoCentavos, null);
    Assert.equals(meta.valorAtualCentavos, 0);
    Assert.equals(meta.progressoManual, 0);
    Assert.true(typeof meta.criadaEm === "string", "criadaEm string");
    Assert.true(typeof meta.atualizadaEm === "string", "atualizadaEm string");
  });

  suite.test("criarMeta limpa e valida os campos recebidos", (Assert) => {
    const meta = criarMeta({
      titulo: "  Viagem  ",
      descricao: "  ",
      tipo: "profissional",
      prazo: "2027-01-10",
      situacao: "concluida",
      progressoManual: "42"
    });

    Assert.equals(meta.titulo, "Viagem", "título sem espaços");
    Assert.equals(meta.descricao, null, "descrição vazia vira null");
    Assert.equals(meta.tipo, "profissional");
    Assert.equals(meta.prazo, "2027-01-10");
    Assert.equals(meta.situacao, "concluida");
    Assert.equals(meta.progressoManual, 42, "texto numérico vira número");

    const invalida = criarMeta({
      tipo: "outro",
      prazo: "10/01/2027",
      situacao: "outra",
      progressoManual: 150
    });

    Assert.equals(invalida.tipo, "pessoal", "tipo inválido usa o padrão");
    Assert.equals(invalida.situacao, "ativa", "situação inválida usa o padrão");
    Assert.equals(invalida.prazo, null, "data fora do formato AAAA-MM-DD vira null");
    Assert.equals(invalida.progressoManual, 100, "progresso é limitado a 100");
  });

  suite.test("criarMeta guarda valores financeiros só no tipo financeira", (Assert) => {
    const financeira = criarMeta({
      titulo: "Reserva",
      tipo: "financeira",
      valorAlvoCentavos: 500000,
      valorAtualCentavos: 125000
    });

    Assert.equals(financeira.valorAlvoCentavos, 500000);
    Assert.equals(financeira.valorAtualCentavos, 125000);

    const pessoal = criarMeta({
      titulo: "Curso",
      tipo: "pessoal",
      valorAlvoCentavos: 500000,
      valorAtualCentavos: 125000
    });

    Assert.equals(pessoal.valorAlvoCentavos, null, "meta pessoal não guarda alvo");
    Assert.equals(pessoal.valorAtualCentavos, 0, "meta pessoal não guarda atual");
  });

  // --- calcularProgresso ---

  suite.test("progresso pelas etapas: 3 de 4 = 75%", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });
    meta.etapas = [
      { id: "1", titulo: "A", concluida: true },
      { id: "2", titulo: "B", concluida: true },
      { id: "3", titulo: "C", concluida: true },
      { id: "4", titulo: "D", concluida: false }
    ];

    Assert.equals(calcularProgresso(meta), 75);
  });

  suite.test("progresso sem etapas usa o manual e respeita 0-100", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });

    meta.progressoManual = 42;
    Assert.equals(calcularProgresso(meta), 42);

    meta.progressoManual = 150;
    Assert.equals(calcularProgresso(meta), 100, "acima de 100 vira 100");

    meta.progressoManual = -10;
    Assert.equals(calcularProgresso(meta), 0, "abaixo de 0 vira 0");

    meta.progressoManual = null;
    Assert.equals(calcularProgresso(meta), 0, "sem valor começa em 0");

    Assert.equals(calcularProgresso(null), 0, "meta inexistente");
  });

  suite.test("etapas têm prioridade sobre o progresso manual", (Assert) => {
    const meta = criarMeta({ titulo: "Meta", progressoManual: 90 });
    meta.etapas = [
      { id: "1", titulo: "A", concluida: true },
      { id: "2", titulo: "B", concluida: false }
    ];

    Assert.equals(calcularProgresso(meta), 50, "manual é ignorado com etapas");
  });

  // --- progressoFinanceiro ---

  suite.test("progressoFinanceiro calcula percentual e quanto falta", (Assert) => {
    const meta = criarMeta({
      titulo: "Reserva",
      tipo: "financeira",
      valorAlvoCentavos: 100000,
      valorAtualCentavos: 25000
    });
    const resumo = progressoFinanceiro(meta);

    Assert.equals(resumo.alvoCentavos, 100000);
    Assert.equals(resumo.atualCentavos, 25000);
    Assert.equals(resumo.faltaCentavos, 75000);
    Assert.equals(resumo.excedenteCentavos, 0);
    Assert.equals(resumo.percentual, 25);
    Assert.false(resumo.atingida);

    meta.valorAtualCentavos = 100000;
    const atingida = progressoFinanceiro(meta);
    Assert.equals(atingida.percentual, 100);
    Assert.equals(atingida.faltaCentavos, 0);
    Assert.true(atingida.atingida, "alvo atingido");

    meta.valorAtualCentavos = 120000;
    const excedente = progressoFinanceiro(meta);
    Assert.equals(excedente.percentual, 100, "percentual não passa de 100");
    Assert.equals(excedente.faltaCentavos, 0);
    Assert.equals(excedente.excedenteCentavos, 20000);
  });

  suite.test("progressoFinanceiro devolve null quando não se aplica", (Assert) => {
    Assert.equals(progressoFinanceiro(criarMeta({ tipo: "pessoal" })), null, "meta pessoal");
    Assert.equals(
      progressoFinanceiro(criarMeta({ tipo: "financeira", valorAlvoCentavos: null })),
      null,
      "sem valor alvo"
    );
    Assert.equals(
      progressoFinanceiro(criarMeta({ tipo: "financeira", valorAlvoCentavos: 0 })),
      null,
      "alvo zero"
    );
    Assert.equals(progressoFinanceiro(null), null, "meta inexistente");
  });

  // --- validarMeta ---

  suite.test("validarMeta aponta título, progresso e valores inválidos", (Assert) => {
    Assert.deepEquals(
      validarMeta({
        titulo: "Reserva",
        tipo: "financeira",
        progressoManual: 25,
        valorAlvoCentavos: 100000,
        valorAtualCentavos: 25000
      }),
      [],
      "meta válida não tem erros"
    );

    const erros = validarMeta({
      titulo: "   ",
      tipo: "financeira",
      progressoManual: 150,
      valorAlvoCentavos: 0,
      valorAtualCentavos: -1
    });

    Assert.includes(erros, "Informe o título da meta.", "título obrigatório");
    Assert.includes(
      erros,
      "O progresso deve ser um número inteiro entre 0 e 100.",
      "progresso fora da faixa"
    );
    Assert.includes(erros, "Informe um valor alvo maior que zero.", "alvo inválido");
    Assert.includes(erros, "O valor atual não pode ser negativo.", "atual negativo");
  });

  suite.test("validarMeta ignora valores financeiros em meta não financeira", (Assert) => {
    Assert.deepEquals(
      validarMeta({
        titulo: "Curso",
        tipo: "pessoal",
        progressoManual: 0,
        valorAlvoCentavos: 0
      }),
      [],
      "meta pessoal não exige valor alvo"
    );
  });

  // --- atualizarMeta ---

  suite.test("atualizarMeta muda campos e preserva id, etapas e criação", (Assert) => {
    const meta = criarMeta({ titulo: "Antiga", tipo: "pessoal" });
    meta.etapas = [{ id: "etapa-1", titulo: "A", concluida: false }];
    estado.metas.push(meta);

    const idOriginal = meta.id;
    const criadaEmOriginal = meta.criadaEm;
    const etapasOriginais = meta.etapas;

    const atualizada = atualizarMeta(estado, meta.id, {
      titulo: "  Nova  ",
      descricao: "  Descrição  ",
      tipo: "financeira",
      prazo: "2027-03-01",
      situacao: "concluida",
      progressoManual: 80,
      valorAlvoCentavos: 200000,
      valorAtualCentavos: 50000
    });

    Assert.equals(atualizada, meta, "devolve a mesma meta");
    Assert.equals(meta.id, idOriginal, "id preservado");
    Assert.equals(meta.criadaEm, criadaEmOriginal, "criadaEm preservado");
    Assert.equals(meta.etapas, etapasOriginais, "etapas preservadas");
    Assert.equals(meta.titulo, "Nova");
    Assert.equals(meta.descricao, "Descrição");
    Assert.equals(meta.tipo, "financeira");
    Assert.equals(meta.prazo, "2027-03-01");
    Assert.equals(meta.situacao, "concluida");
    Assert.equals(meta.progressoManual, 80);
    Assert.equals(meta.valorAlvoCentavos, 200000);
    Assert.equals(meta.valorAtualCentavos, 50000);
  });

  suite.test("atualizarMeta limpa valores ao deixar de ser financeira", (Assert) => {
    const meta = criarMeta({
      titulo: "Reserva",
      tipo: "financeira",
      valorAlvoCentavos: 100000,
      valorAtualCentavos: 25000
    });
    estado.metas.push(meta);

    atualizarMeta(estado, meta.id, { tipo: "pessoal" });

    Assert.equals(meta.tipo, "pessoal");
    Assert.equals(meta.valorAlvoCentavos, null);
    Assert.equals(meta.valorAtualCentavos, 0);
  });

  suite.test("atualizarMeta aceita edição parcial e recusa id inexistente", (Assert) => {
    const meta = criarMeta({
      titulo: "Original",
      descricao: "Descrição",
      tipo: "financeira",
      valorAlvoCentavos: 100000
    });
    estado.metas.push(meta);

    atualizarMeta(estado, meta.id, { titulo: "Só o título" });

    Assert.equals(meta.titulo, "Só o título");
    Assert.equals(meta.descricao, "Descrição", "descrição preservada");
    Assert.equals(meta.tipo, "financeira", "tipo preservado");
    Assert.equals(meta.valorAlvoCentavos, 100000, "valor preservado");
    Assert.equals(atualizarMeta(estado, "nao-existe", { titulo: "X" }), null);
  });

  // --- etapas ---

  suite.test("adicionarEtapa cria etapas e recusa título vazio", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });
    estado.metas.push(meta);

    Assert.equals(adicionarEtapa(estado, meta.id, "   "), null, "título vazio");
    Assert.equals(adicionarEtapa(estado, "nao-existe", "A"), null, "meta inexistente");

    adicionarEtapa(estado, meta.id, "  Primeira  ");
    adicionarEtapa(estado, meta.id, "Segunda");

    Assert.length(meta.etapas, 2);
    Assert.equals(meta.etapas[0].titulo, "Primeira", "título sem espaços");
    Assert.false(meta.etapas[0].concluida, "começa pendente");
    Assert.true(meta.etapas[0].id !== meta.etapas[1].id, "ids diferentes");
    Assert.equals(calcularProgresso(meta), 0);
  });

  suite.test("alternarEtapa conclui, reabre e recalcula o progresso", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });
    estado.metas.push(meta);
    adicionarEtapa(estado, meta.id, "A");
    adicionarEtapa(estado, meta.id, "B");

    const primeira = meta.etapas[0].id;
    alternarEtapa(estado, meta.id, primeira);

    Assert.true(meta.etapas[0].concluida, "etapa concluída");
    Assert.equals(calcularProgresso(meta), 50);

    alternarEtapa(estado, meta.id, primeira);
    Assert.false(meta.etapas[0].concluida, "etapa reaberta");
    Assert.equals(calcularProgresso(meta), 0);

    Assert.equals(alternarEtapa(estado, meta.id, "nao-existe"), null);
  });

  suite.test("excluirEtapa remove e devolve o progresso manual ao esvaziar", (Assert) => {
    const meta = criarMeta({ titulo: "Meta", progressoManual: 40 });
    estado.metas.push(meta);
    adicionarEtapa(estado, meta.id, "A");
    adicionarEtapa(estado, meta.id, "B");
    alternarEtapa(estado, meta.id, meta.etapas[0].id);

    Assert.equals(calcularProgresso(meta), 50, "com etapas, vale o automático");

    excluirEtapa(estado, meta.id, meta.etapas[1].id);
    Assert.length(meta.etapas, 1);
    Assert.equals(calcularProgresso(meta), 100);

    excluirEtapa(estado, meta.id, meta.etapas[0].id);
    Assert.length(meta.etapas, 0);
    Assert.equals(calcularProgresso(meta), 40, "sem etapas, volta o manual");

    Assert.equals(excluirEtapa(estado, meta.id, "nao-existe"), null);
  });

  // --- excluirMeta e vínculos ---

  suite.test("excluirMeta desvincula tarefas sem apagá-las", (Assert) => {
    const metaA = criarMeta({ titulo: "A" });
    const metaB = criarMeta({ titulo: "B" });
    const tarefaA = criarTarefaFalsa(metaA.id);
    const tarefaB = criarTarefaFalsa(metaB.id);
    const tarefaSemMeta = criarTarefaFalsa(null);
    estado.metas.push(metaA, metaB);
    estado.tarefas.push(tarefaA, tarefaB, tarefaSemMeta);

    const removida = excluirMeta(estado, metaA.id);

    Assert.equals(removida, metaA, "devolve a meta removida");
    Assert.length(estado.metas, 1, "só a outra meta ficou");
    Assert.length(estado.tarefas, 3, "nenhuma tarefa foi apagada");
    Assert.equals(tarefaA.metaId, null, "tarefa da meta excluída foi desvinculada");
    Assert.equals(tarefaB.metaId, metaB.id, "vínculo com outra meta preservado");
    Assert.equals(tarefaSemMeta.metaId, null);
    Assert.true(tarefaA.atualizadaEm !== "2026-10-01T10:00:00.000Z", "tarefa atualizada");
    Assert.equals(excluirMeta(estado, "nao-existe"), null);
  });

  suite.test("vincularTarefa liga, desliga e recusa meta inexistente", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });
    const tarefa = criarTarefaFalsa(null);
    estado.metas.push(meta);
    estado.tarefas.push(tarefa);

    const vinculada = vincularTarefa(estado, tarefa.id, meta.id);
    Assert.equals(vinculada, tarefa);
    Assert.equals(tarefa.metaId, meta.id, "tarefa vinculada");

    Assert.equals(vincularTarefa(estado, tarefa.id, "nao-existe"), null);
    Assert.equals(tarefa.metaId, meta.id, "vínculo anterior preservado no erro");

    vincularTarefa(estado, tarefa.id, null);
    Assert.equals(tarefa.metaId, null, "tarefa desvinculada");

    Assert.equals(vincularTarefa(estado, "nao-existe", meta.id), null);
  });

  suite.test("tarefasDaMeta filtra e ordena por data e horário", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });
    const outraMeta = criarMeta({ titulo: "Outra" });
    const tarefaTarde = criarTarefaFalsa(meta.id, "2026-10-21");
    tarefaTarde.horaInicio = "15:00";
    const tarefaCedo = criarTarefaFalsa(meta.id, "2026-10-20");
    const tarefaOutra = criarTarefaFalsa(outraMeta.id, "2026-10-19");
    const tarefaSemMeta = criarTarefaFalsa(null, "2026-10-18");
    estado.metas.push(meta, outraMeta);
    estado.tarefas.push(tarefaTarde, tarefaOutra, tarefaCedo, tarefaSemMeta);

    const vinculadas = tarefasDaMeta(estado, meta.id);

    Assert.length(vinculadas, 2);
    Assert.equals(vinculadas[0], tarefaCedo, "data mais cedo primeiro");
    Assert.equals(vinculadas[1], tarefaTarde, "data mais tarde depois");
    Assert.length(tarefasDaMeta(estado, "nao-existe"), 0);
  });

  suite.test("encontrarMeta acha por id ou devolve null", (Assert) => {
    const meta = criarMeta({ titulo: "Meta" });
    estado.metas.push(meta);

    Assert.equals(encontrarMeta(estado, meta.id), meta);
    Assert.equals(encontrarMeta(estado, "nao-existe"), null);
  });
});
