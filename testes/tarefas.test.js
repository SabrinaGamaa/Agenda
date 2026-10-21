// Testes para js/regras/tarefas.js

import { describe } from "./testes.js";
import {
  criarTarefa,
  tarefasDoDia,
  ocorrenciasDoDia,
  ordenarTarefasDoDia,
  encontrarTarefa,
  estaConcluida,
  alternarConclusao,
  cancelarOcorrencia,
  ajustarOcorrencia,
  atualizarTarefa,
  excluirTarefa
} from "../js/regras/tarefas.js";

describe("tarefas", (suite) => {
  let estado;

  suite.beforeEach(() => {
    estado = { tarefas: [] };
  });

  // --- criarTarefa ---
  suite.test("criarTarefa gera id único e campos corretos", (Assert) => {
    const t = criarTarefa({
      titulo: "  Testar  ",
      descricao: "  desc  ",
      categoria: "Trabalho",
      prioridade: "alta",
      data: "2026-10-18",
      horaInicio: "09:00",
      duracaoMinutos: 60
    });
    Assert.true(typeof t.id === "string" && t.id.length > 0, "id gerado");
    Assert.equals(t.titulo, "Testar", "título trim");
    Assert.equals(t.descricao, "desc", "descrição trim");
    Assert.equals(t.categoria, "Trabalho");
    Assert.equals(t.prioridade, "alta");
    Assert.equals(t.data, "2026-10-18");
    Assert.equals(t.horaInicio, "09:00");
    Assert.equals(t.duracaoMinutos, 60);
    Assert.equals(t.recorrencia, null);
    Assert.equals(t.metaId, null);
    Assert.deepEquals(t.excecoes, {});
    Assert.true(typeof t.criadaEm === "string", "criadaEm string");
    Assert.true(typeof t.atualizadaEm === "string", "atualizadaEm string");
  });

  suite.test("criarTarefa com descrição vazia vira null", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "   ", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    Assert.equals(t.descricao, null, "descrição vazia -> null");
  });

  suite.test("criarTarefa salva a regra de recorrência enviada", (Assert) => {
    const regra = {
      tipo: "semanal",
      intervalo: 2,
      fim: { tipo: "apos", quantidade: 5 }
    };
    const t = criarTarefa({
      titulo: "Série",
      descricao: "",
      categoria: "X",
      prioridade: "media",
      data: "2026-10-18",
      horaInicio: "09:00",
      duracaoMinutos: 30,
      recorrencia: regra
    });

    Assert.deepEquals(t.recorrencia, regra, "regra guardada na tarefa");
  });

  suite.test("atualizarTarefa troca a recorrência quando o campo é enviado", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    estado.tarefas.push(t);

    const novaRegra = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    atualizarTarefa(estado, t.id, {
      titulo: "X",
      descricao: "",
      categoria: "X",
      prioridade: "media",
      data: "2026-10-18",
      horaInicio: "10:00",
      duracaoMinutos: 30,
      recorrencia: novaRegra
    });

    Assert.deepEquals(t.recorrencia, novaRegra, "nova regra aplicada");
  });

  suite.test("atualizarTarefa sem o campo não apaga a recorrência", (Assert) => {
    const regra = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30, recorrencia: regra });
    estado.tarefas.push(t);

    atualizarTarefa(estado, t.id, {
      titulo: "Novo título",
      descricao: "",
      categoria: "X",
      prioridade: "media",
      data: "2026-10-18",
      horaInicio: "10:00",
      duracaoMinutos: 30
    });

    Assert.deepEquals(t.recorrencia, regra, "regra preservada");
  });

  suite.test("atualizarTarefa com recorrencia null volta a ser tarefa única", (Assert) => {
    const regra = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30, recorrencia: regra });
    estado.tarefas.push(t);

    atualizarTarefa(estado, t.id, {
      titulo: "X",
      descricao: "",
      categoria: "X",
      prioridade: "media",
      data: "2026-10-18",
      horaInicio: "10:00",
      duracaoMinutos: 30,
      recorrencia: null
    });

    Assert.equals(t.recorrencia, null, "regra removida");
  });

  // --- tarefasDoDia ---
  suite.test("tarefasDoDia filtra por data", (Assert) => {
    estado.tarefas.push(criarTarefa({ titulo: "A", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 }));
    estado.tarefas.push(criarTarefa({ titulo: "B", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-19", horaInicio: "10:00", duracaoMinutos: 30 }));
    const hoje = tarefasDoDia(estado, "2026-10-18");
    Assert.length(hoje, 1, "apenas 1 tarefa de hoje");
    Assert.equals(hoje[0].titulo, "A");
  });

  // --- ocorrenciasDoDia ---
  suite.test("ocorrenciasDoDia inclui tarefa única e séries recorrentes", (Assert) => {
    const unica = criarTarefa({ titulo: "Única", descricao: "", categoria: "Trabalho", prioridade: "media", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    const diaria = criarTarefa({ titulo: "Diária", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 60 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    estado.tarefas.push(unica, diaria);

    const dia18 = ocorrenciasDoDia(estado, "2026-10-18");
    Assert.length(dia18, 2, "duas ocorrências no dia 18");
    Assert.true(dia18.every((o) => o.dataOcorrencia === "2026-10-18"), "dataOcorrencia preenchida");
    Assert.true(dia18.some((o) => o.id === unica.id), "tarefa única presente");
    Assert.true(dia18.some((o) => o.id === diaria.id), "série presente");

    const dia25 = ocorrenciasDoDia(estado, "2026-10-25");
    Assert.length(dia25, 1, "só a série ocorre no dia 25");
    Assert.equals(dia25[0].id, diaria.id, "id da série");
    Assert.true(dia25[0].tarefaOriginal === diaria, "referência à definição original");
    Assert.equals(dia25[0].data, "2026-10-18", "data da definição continua sendo o início da série");
  });

  suite.test("ocorrência aplica ajustes da data sem alterar a série", (Assert) => {
    const diaria = criarTarefa({ titulo: "Original", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    diaria.excecoes["2026-10-19"] = { titulo: "Ajustada", horaInicio: "15:00", duracaoMinutos: 45 };
    estado.tarefas.push(diaria);

    const ocorrencia = ocorrenciasDoDia(estado, "2026-10-19")[0];
    Assert.true(ocorrencia !== diaria, "ocorrência é um objeto novo");
    Assert.equals(ocorrencia.titulo, "Ajustada", "título ajustado");
    Assert.equals(ocorrencia.horaInicio, "15:00", "horário ajustado");
    Assert.equals(ocorrencia.duracaoMinutos, 45, "duração ajustada");
    Assert.equals(ocorrencia.dataOcorrencia, "2026-10-19", "data da ocorrência");
    Assert.equals(diaria.titulo, "Original", "definição intacta");
    Assert.equals(diaria.horaInicio, "09:00", "horário da série intacto");
  });

  suite.test("ocorrenciasDoDia remove canceladas e respeita o fim da série", (Assert) => {
    const diaria = criarTarefa({ titulo: "Diária", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "emData", data: "2026-10-20" } };
    diaria.excecoes["2026-10-19"] = { cancelada: true };
    estado.tarefas.push(diaria);

    Assert.length(ocorrenciasDoDia(estado, "2026-10-18"), 1, "18 aparece");
    Assert.length(ocorrenciasDoDia(estado, "2026-10-19"), 0, "19 cancelada");
    Assert.length(ocorrenciasDoDia(estado, "2026-10-20"), 1, "20 é o último dia da série");
    Assert.length(ocorrenciasDoDia(estado, "2026-10-21"), 0, "21 depois do fim");
  });

  suite.test("conclusão de uma ocorrência não afeta as outras", (Assert) => {
    const diaria = criarTarefa({ titulo: "Diária", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    estado.tarefas.push(diaria);

    alternarConclusao(estado, diaria.id, "2026-10-19");

    const dia19 = ocorrenciasDoDia(estado, "2026-10-19")[0];
    const dia20 = ocorrenciasDoDia(estado, "2026-10-20")[0];
    Assert.true(estaConcluida(dia19, "2026-10-19"), "19 concluída");
    Assert.false(estaConcluida(dia20, "2026-10-20"), "20 continua pendente");
  });

  suite.test("cancelarOcorrencia cancela só a data escolhida e preserva a conclusão", (Assert) => {
    const diaria = criarTarefa({ titulo: "Diária", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    estado.tarefas.push(diaria);

    alternarConclusao(estado, diaria.id, "2026-10-20");
    const resultado = cancelarOcorrencia(estado, diaria.id, "2026-10-19");

    Assert.equals(resultado, diaria, "devolve a tarefa alterada");
    Assert.true(diaria.excecoes["2026-10-19"].cancelada, "19 marcada como cancelada");
    Assert.true(estaConcluida(diaria, "2026-10-20"), "conclusão do dia 20 preservada");
    Assert.length(ocorrenciasDoDia(estado, "2026-10-18"), 1, "18 continua");
    Assert.length(ocorrenciasDoDia(estado, "2026-10-19"), 0, "19 some da lista");
    Assert.length(ocorrenciasDoDia(estado, "2026-10-20"), 1, "20 continua");
    Assert.equals(diaria.recorrencia.tipo, "diaria", "definição da série intacta");
  });

  suite.test("cancelarOcorrencia recusa tarefa ou data que não existe", (Assert) => {
    const diaria = criarTarefa({ titulo: "Diária", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "emData", data: "2026-10-20" } };
    estado.tarefas.push(diaria);

    Assert.equals(cancelarOcorrencia(estado, "nao-existe", "2026-10-19"), null, "id inexistente");
    Assert.equals(cancelarOcorrencia(estado, diaria.id, "2026-10-17"), null, "data antes do início");
    Assert.equals(cancelarOcorrencia(estado, diaria.id, "2026-10-21"), null, "data depois do fim");
    Assert.deepEquals(diaria.excecoes, {}, "nada foi gravado");
  });

  suite.test("ajustarOcorrencia guarda só as diferenças e não altera a série", (Assert) => {
    const diaria = criarTarefa({ titulo: "Original", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    estado.tarefas.push(diaria);

    ajustarOcorrencia(estado, diaria.id, "2026-10-19", {
      titulo: "  Ajustada  ",
      descricao: "  Só hoje  ",
      categoria: "Estudos",
      prioridade: "alta",
      horaInicio: "15:00",
      duracaoMinutos: 45
    });

    const dia19 = ocorrenciasDoDia(estado, "2026-10-19")[0];
    const dia20 = ocorrenciasDoDia(estado, "2026-10-20")[0];

    Assert.equals(dia19.titulo, "Ajustada", "título ajustado e sem espaços");
    Assert.equals(dia19.descricao, "Só hoje", "descrição ajustada");
    Assert.equals(dia19.horaInicio, "15:00", "horário ajustado");
    Assert.equals(dia19.duracaoMinutos, 45, "duração ajustada");
    Assert.equals(dia20.titulo, "Original", "o dia seguinte não mudou");
    Assert.equals(dia20.horaInicio, "09:00", "horário do dia seguinte intacto");

    Assert.equals(diaria.titulo, "Original", "definição da série intacta");
    Assert.equals(diaria.horaInicio, "09:00", "horário da série intacto");
    Assert.equals(diaria.duracaoMinutos, 30, "duração da série intacta");
    Assert.false("categoria" in diaria.excecoes["2026-10-19"], "campo igual à série não é guardado");
    Assert.false("prioridade" in diaria.excecoes["2026-10-19"], "prioridade igual não é guardada");
  });

  suite.test("ajustarOcorrencia remove o ajuste quando o valor volta ao da série", (Assert) => {
    const diaria = criarTarefa({ titulo: "Original", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    estado.tarefas.push(diaria);

    ajustarOcorrencia(estado, diaria.id, "2026-10-19", { titulo: "Ajustada", horaInicio: "15:00" });
    Assert.true("2026-10-19" in diaria.excecoes, "exceção criada");

    ajustarOcorrencia(estado, diaria.id, "2026-10-19", {
      titulo: "Original",
      descricao: "",
      categoria: "Estudos",
      prioridade: "alta",
      horaInicio: "09:00",
      duracaoMinutos: 30
    });

    Assert.false("2026-10-19" in diaria.excecoes, "exceção vazia foi removida");
    Assert.equals(ocorrenciasDoDia(estado, "2026-10-19")[0].titulo, "Original", "voltou ao valor da série");
  });

  suite.test("ajustarOcorrencia preserva conclusão e ignora campos da série", (Assert) => {
    const regra = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    const diaria = criarTarefa({ titulo: "Original", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    diaria.recorrencia = regra;
    estado.tarefas.push(diaria);

    alternarConclusao(estado, diaria.id, "2026-10-19");
    ajustarOcorrencia(estado, diaria.id, "2026-10-19", {
      titulo: "Nova",
      data: "2026-12-01",
      recorrencia: null,
      metaId: "meta-ficticia"
    });

    Assert.true(diaria.excecoes["2026-10-19"].concluida, "conclusão preservada");
    Assert.equals(diaria.excecoes["2026-10-19"].titulo, "Nova", "título ajustado");
    Assert.false("data" in diaria.excecoes["2026-10-19"], "data não é campo de ocorrência");
    Assert.false("metaId" in diaria.excecoes["2026-10-19"], "vínculo com meta pertence à série");
    Assert.equals(diaria.data, "2026-10-18", "data da série intacta");
    Assert.deepEquals(diaria.recorrencia, regra, "regra da série intacta");
    Assert.equals(ajustarOcorrencia(estado, "nao-existe", "2026-10-19", { titulo: "X" }), null, "id inexistente");
    Assert.equals(ajustarOcorrencia(estado, diaria.id, "2026-10-17", { titulo: "X" }), null, "data fora da série");
  });

  suite.test("ordenação usa o horário ajustado da ocorrência", (Assert) => {
    const serie = criarTarefa({ titulo: "Série", descricao: "", categoria: "Estudos", prioridade: "alta", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    serie.recorrencia = { tipo: "diaria", intervalo: 1, fim: { tipo: "nunca" } };
    serie.excecoes["2026-10-19"] = { horaInicio: "16:00" };

    const outra = criarTarefa({ titulo: "Outra", descricao: "", categoria: "Trabalho", prioridade: "media", data: "2026-10-19", horaInicio: "11:00", duracaoMinutos: 30 });
    estado.tarefas.push(serie, outra);

    const lista = ordenarTarefasDoDia(ocorrenciasDoDia(estado, "2026-10-19"), "2026-10-19");
    Assert.equals(lista.map((o) => o.titulo).join("|"), "Outra|Série", "11:00 antes do horário ajustado para 16:00");
  });

  // --- encontrarTarefa ---
  suite.test("encontrarTarefa acha por id ou null", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    estado.tarefas.push(t);
    Assert.equals(encontrarTarefa(estado, t.id), t, "acha existente");
    Assert.equals(encontrarTarefa(estado, "inexistente"), null, "não acha -> null");
  });

  // --- estaConcluida / alternarConclusao ---
  suite.test("estaConcluida false inicialmente", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    Assert.false(estaConcluida(t, "2026-10-18"), "não concluída");
  });

  suite.test("alternarConclusao alterna true/false na data", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    estado.tarefas.push(t);

    alternarConclusao(estado, t.id, "2026-10-18");
    Assert.true(estaConcluida(t, "2026-10-18"), "ficou true");

    alternarConclusao(estado, t.id, "2026-10-18");
    Assert.false(estaConcluida(t, "2026-10-18"), "voltou false");
  });

  suite.test("conclusão é por data (outra data não afetada)", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    estado.tarefas.push(t);

    alternarConclusao(estado, t.id, "2026-10-18");
    Assert.true(estaConcluida(t, "2026-10-18"));
    Assert.false(estaConcluida(t, "2026-10-19"), "outra data não afetada");
  });

  // --- atualizarTarefa ---
  suite.test("atualizarTarefa muda campos e atualizadaEm", async (Assert) => {
    const t = criarTarefa({ titulo: "Antigo", descricao: "d", categoria: "X", prioridade: "baixa", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    estado.tarefas.push(t);
    const antiga = t.atualizadaEm;

    await new Promise(r => setTimeout(r, 5));

    atualizarTarefa(estado, t.id, {
      titulo: "Novo",
      descricao: "",
      categoria: "Y",
      prioridade: "alta",
      data: "2026-10-19",
      horaInicio: "11:00",
      duracaoMinutos: 45
    });

    Assert.equals(t.titulo, "Novo");
    Assert.equals(t.descricao, null, "descrição vazia -> null");
    Assert.equals(t.categoria, "Y");
    Assert.equals(t.prioridade, "alta");
    Assert.equals(t.data, "2026-10-19");
    Assert.equals(t.horaInicio, "11:00");
    Assert.equals(t.duracaoMinutos, 45);
    Assert.true(t.atualizadaEm > antiga, "atualizadaEm mudou");
  });

  suite.test("atualizarTarefa preserva o vínculo com a meta", (Assert) => {
    const t = criarTarefa({ titulo: "Antiga", descricao: "", categoria: "X", prioridade: "baixa", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    t.metaId = "meta-ficticia";
    estado.tarefas.push(t);

    atualizarTarefa(estado, t.id, {
      titulo: "Nova",
      descricao: "",
      categoria: "X",
      prioridade: "media",
      data: "2026-10-18",
      horaInicio: "10:00",
      duracaoMinutos: 30
    });

    Assert.equals(t.metaId, "meta-ficticia", "metaId não enviado é preservado");
  });

  // --- excluirTarefa ---
  suite.test("excluirTarefa remove e devolve a tarefa", (Assert) => {
    const t = criarTarefa({ titulo: "X", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "10:00", duracaoMinutos: 30 });
    estado.tarefas.push(t);

    const removida = excluirTarefa(estado, t.id);
    Assert.equals(removida, t, "devolve tarefa removida");
    Assert.length(estado.tarefas, 0, "array vazio");
  });

  suite.test("excluirTarefa inexistente devolve null", (Assert) => {
    const r = excluirTarefa(estado, "nao-existe");
    Assert.equals(r, null, "devolve null");
  });

  // --- ordenarTarefasDoDia ---
  suite.test("ordenarTarefasDoDia: pendentes por horário, concluídas no fim", (Assert) => {
    const t1 = criarTarefa({ titulo: "Tarde", descricao: "", categoria: "X", prioridade: "alta", data: "2026-10-18", horaInicio: "15:00", duracaoMinutos: 30 });
    const t2 = criarTarefa({ titulo: "Cedo", descricao: "", categoria: "X", prioridade: "baixa", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    const t3 = criarTarefa({ titulo: "Meio", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "12:00", duracaoMinutos: 30 });
    estado.tarefas.push(t1, t2, t3);

    let ord = ordenarTarefasDoDia(estado.tarefas, "2026-10-18");
    Assert.equals(ord.map(x => x.titulo).join("|"), "Cedo|Meio|Tarde", "ordem por horário");

    alternarConclusao(estado, t2.id, "2026-10-18");
    ord = ordenarTarefasDoDia(estado.tarefas, "2026-10-18");
    Assert.equals(ord.map(x => x.titulo).join("|"), "Meio|Tarde|Cedo", "concluída vai pro fim");

    Assert.equals(estado.tarefas.map(x => x.titulo).join("|"), "Tarde|Cedo|Meio", "estado original intacto");
  });

  suite.test("ordenarTarefasDoDia não muta array original", (Assert) => {
    const t1 = criarTarefa({ titulo: "B", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "11:00", duracaoMinutos: 30 });
    const t2 = criarTarefa({ titulo: "A", descricao: "", categoria: "X", prioridade: "media", data: "2026-10-18", horaInicio: "09:00", duracaoMinutos: 30 });
    estado.tarefas.push(t1, t2);
    const original = [...estado.tarefas];
    ordenarTarefasDoDia(estado.tarefas, "2026-10-18");
    Assert.deepEquals(estado.tarefas, original, "array original não mutado");
  });
});