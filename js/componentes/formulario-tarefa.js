// Componente reutilizável: formulário de tarefa.
// É usado para criar (dentro do cartão "Nova tarefa") e para editar
// (dentro de uma janela modal), graças às opções que recebe.

import { hojeISO, somarMinutos, diaDaSemana, formatarData } from "../regras/datas.js";
import { validarRecorrencia } from "../regras/recorrencia.js";

// Rótulos dos dias da semana. O número segue o modelo de dados:
// 0 = domingo ... 6 = sábado (o mesmo de Date.getDay()).
const DIAS_DA_SEMANA = [
  { valor: 0, curto: "Dom", nome: "dom" },
  { valor: 1, curto: "Seg", nome: "seg" },
  { valor: 2, curto: "Ter", nome: "ter" },
  { valor: 3, curto: "Qua", nome: "qua" },
  { valor: 4, curto: "Qui", nome: "qui" },
  { valor: 5, curto: "Sex", nome: "sex" },
  { valor: 6, curto: "Sáb", nome: "sáb" }
];

export function criarFormularioTarefa({
  categorias,
  metas = [],
  aoSalvar,
  valoresIniciais = null,
  rotuloBotao = "Adicionar tarefa",
  aoCancelar = null,
  dataPadrao = null,
  dataFixa = null,
  editarSomenteOcorrencia = false
}) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-tarefa";
  formulario.noValidate = true; // validação nativa desligada: usamos mensagens nossas, em português

  // --- Campos básicos ---

  const titulo = document.createElement("input");
  titulo.type = "text";
  titulo.maxLength = 120;
  titulo.placeholder = "Ex.: Pagar contas do mês";

  const descricao = document.createElement("input");
  descricao.type = "text";
  descricao.maxLength = 300;
  descricao.placeholder = "Detalhes opcionais";

  const categoria = document.createElement("select");
  for (const nomeCategoria of categorias) {
    const opcao = document.createElement("option");
    opcao.value = nomeCategoria;
    opcao.textContent = nomeCategoria;
    categoria.appendChild(opcao);
  }

  const prioridade = document.createElement("select");
  for (const { valor, rotulo } of [
    { valor: "baixa", rotulo: "Baixa" },
    { valor: "media", rotulo: "Média" },
    { valor: "alta", rotulo: "Alta" }
  ]) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = rotulo;
    prioridade.appendChild(opcao);
  }

  const data = document.createElement("input");
  data.type = "date";

  const horaInicio = document.createElement("input");
  horaInicio.type = "time";

  const duracaoMinutos = document.createElement("input");
  duracaoMinutos.type = "number";
  duracaoMinutos.min = "5";
  duracaoMinutos.max = "1440";
  duracaoMinutos.step = "5";

  // Vínculo opcional com uma meta. O valor é aplicado depois, por
  // vincularTarefa (regras de metas), que confere se a meta existe.
  const listaDeMetas = Array.isArray(metas) ? metas : [];
  const meta = document.createElement("select");

  const opcaoSemMeta = document.createElement("option");
  opcaoSemMeta.value = "";
  opcaoSemMeta.textContent = listaDeMetas.length === 0
    ? "Nenhuma meta cadastrada"
    : "Sem meta";
  meta.appendChild(opcaoSemMeta);

  for (const item of listaDeMetas) {
    if (!item?.id) continue;

    const opcao = document.createElement("option");
    opcao.value = item.id;
    opcao.textContent = item.titulo ?? "Meta sem título";
    meta.appendChild(opcao);
  }

  // --- Campos de recorrência ---

  const repeticao = document.createElement("select");
  for (const { valor, rotulo } of [
    { valor: "", rotulo: "Não repete" },
    { valor: "diaria", rotulo: "Todos os dias" },
    { valor: "semanal", rotulo: "Toda semana" },
    { valor: "diasDaSemana", rotulo: "Dias da semana" },
    { valor: "mensal", rotulo: "Todo mês" }
  ]) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = rotulo;
    repeticao.appendChild(opcao);
  }

  const intervalo = document.createElement("input");
  intervalo.type = "number";
  intervalo.min = "1";
  intervalo.max = "365";
  intervalo.step = "1";
  intervalo.value = "1";

  // Texto ao lado do intervalo: "dia(s)", "semana(s)" ou "mês(es)".
  // Ele muda conforme o tipo escolhido.
  const intervaloUnidade = document.createElement("span");
  intervaloUnidade.className = "recorrencia-unidade";
  intervaloUnidade.textContent = "dia";

  const linhaIntervalo = document.createElement("div");
  linhaIntervalo.className = "recorrencia-linha";
  linhaIntervalo.appendChild(intervalo);
  linhaIntervalo.appendChild(intervaloUnidade);

  // Cada dia é um <label> com um checkbox. O Map guarda o input pelo número
  // do dia para facilitar marcar/ler os valores selecionados.
  const caixaDias = document.createElement("div");
  caixaDias.className = "recorrencia-dias";
  const checkboxesDias = new Map();

  for (const { valor, curto } of DIAS_DA_SEMANA) {
    const etiqueta = document.createElement("label");
    etiqueta.className = "recorrencia-dia";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(valor);

    const texto = document.createElement("span");
    texto.textContent = curto;

    etiqueta.appendChild(checkbox);
    etiqueta.appendChild(texto);
    caixaDias.appendChild(etiqueta);
    checkboxesDias.set(valor, checkbox);
  }

  const fimTipo = document.createElement("select");
  for (const { valor, rotulo } of [
    { valor: "nunca", rotulo: "Nunca" },
    { valor: "emData", rotulo: "Em uma data" },
    { valor: "apos", rotulo: "Após N ocorrências" }
  ]) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = rotulo;
    fimTipo.appendChild(opcao);
  }

  const fimData = document.createElement("input");
  fimData.type = "date";

  const fimQuantidade = document.createElement("input");
  fimQuantidade.type = "number";
  fimQuantidade.min = "1";
  fimQuantidade.max = "999";
  fimQuantidade.step = "1";
  fimQuantidade.value = "10";

  // --- Valores: modo edição (tarefa existente) ou padrões do modo criação ---

  if (valoresIniciais) {
    titulo.value = valoresIniciais.titulo ?? "";
    descricao.value = valoresIniciais.descricao ?? "";
    if (valoresIniciais.categoria) {
      categoria.value = valoresIniciais.categoria;
    }
    prioridade.value = valoresIniciais.prioridade ?? "media";
    data.value = valoresIniciais.data ?? dataPadrao ?? hojeISO();
    horaInicio.value = valoresIniciais.horaInicio ?? "";
    duracaoMinutos.value = String(valoresIniciais.duracaoMinutos ?? 30);
  } else {
    prioridade.value = "media";
    data.value = dataPadrao ?? hojeISO();
    duracaoMinutos.value = "30";
  }

  // Se a meta vinculada ainda existir, deixa a opção selecionada. Um vínculo
  // antigo para meta removida não é oferecido; ao salvar, ele é limpo.
  if (
    valoresIniciais?.metaId &&
    listaDeMetas.some((item) => item?.id === valoresIniciais.metaId)
  ) {
    meta.value = valoresIniciais.metaId;
  }

  // Na edição de uma ocorrência, a data é a chave da exceção: não pode mudar.
  // O formulário mostra o dia, mas o campo fica bloqueado.
  if (editarSomenteOcorrencia) {
    data.value = dataFixa ?? data.value;
    data.disabled = true;
  }

  // Preenche a recorrência existente. Se a tarefa é única, os controles
  // começam em "Não repete", "Nunca" e intervalo 1.
  const recorrenciaInicial = valoresIniciais?.recorrencia ?? null;

  if (recorrenciaInicial) {
    const tiposDeRepeticao = ["diaria", "semanal", "diasDaSemana", "mensal"];
    repeticao.value = tiposDeRepeticao.includes(recorrenciaInicial.tipo)
      ? recorrenciaInicial.tipo
      : "";

    intervalo.value = String(recorrenciaInicial.intervalo ?? 1);

    for (const dia of recorrenciaInicial.diasDaSemana ?? []) {
      const checkbox = checkboxesDias.get(Number(dia));
      if (checkbox) checkbox.checked = true;
    }

    const fim = recorrenciaInicial.fim ?? { tipo: "nunca" };
    fimTipo.value = ["nunca", "emData", "apos"].includes(fim.tipo) ? fim.tipo : "nunca";

    if (fimTipo.value === "emData" && fim.data) {
      fimData.value = fim.data;
    }
    if (fimTipo.value === "apos" && fim.quantidade != null) {
      fimQuantidade.value = String(fim.quantidade);
    }
  } else {
    repeticao.value = "";
    intervalo.value = "1";
    fimTipo.value = "nunca";
    fimQuantidade.value = "10";
  }

  // --- Bloco visual de recorrência ---

  const campoIntervalo = criarCampo("Intervalo", linhaIntervalo);
  const campoDias = criarGrupo("Dias da semana", caixaDias, true);
  const campoFimTipo = criarCampo("Termina", fimTipo);
  const campoFimData = criarCampo("Data final", fimData);
  const campoFimQuantidade = criarCampo("Nº de ocorrências", fimQuantidade);

  const gradeRecorrencia = document.createElement("div");
  gradeRecorrencia.className = "recorrencia-grade";
  gradeRecorrencia.appendChild(criarCampo("Frequência", repeticao));
  gradeRecorrencia.appendChild(campoIntervalo);
  gradeRecorrencia.appendChild(campoDias);
  gradeRecorrencia.appendChild(campoFimTipo);
  gradeRecorrencia.appendChild(campoFimData);
  gradeRecorrencia.appendChild(campoFimQuantidade);

  const ajudaRecorrencia = document.createElement("p");
  ajudaRecorrencia.className = "recorrencia-ajuda";
  ajudaRecorrencia.hidden = true;

  const resumoRecorrencia = document.createElement("p");
  resumoRecorrencia.className = "recorrencia-resumo";
  resumoRecorrencia.hidden = true;

  const blocoRecorrencia = document.createElement("fieldset");
  blocoRecorrencia.className = "recorrencia campo-largo";

  const legenda = document.createElement("legend");
  legenda.className = "recorrencia-legenda";
  legenda.textContent = "Repetição";

  blocoRecorrencia.appendChild(legenda);
  blocoRecorrencia.appendChild(gradeRecorrencia);
  blocoRecorrencia.appendChild(ajudaRecorrencia);
  blocoRecorrencia.appendChild(resumoRecorrencia);

  // A regra de repetição pertence à série; ao editar só uma ocorrência,
  // escondemos o bloco para deixar claro que ela não será alterada.
  if (editarSomenteOcorrencia) {
    blocoRecorrencia.hidden = true;
  }

  // --- Mensagens (prévia do horário final, aviso e erros) ---

  const previa = document.createElement("p");
  previa.className = "previa-horario campo-largo";

  const aviso = document.createElement("p");
  aviso.className = "aviso-inconsistencia campo-largo";
  aviso.hidden = true;

  const erro = document.createElement("p");
  erro.className = "erro-formulario campo-largo";
  erro.hidden = true;

  // Explica, na edição de uma ocorrência, que a série não será alterada.
  const notaOcorrencia = document.createElement("p");
  notaOcorrencia.className = "recorrencia-ajuda campo-largo";
  notaOcorrencia.hidden = !editarSomenteOcorrencia;
  if (editarSomenteOcorrencia) {
    notaOcorrencia.textContent =
      `As alterações valem somente para ${formatarData(data.value)}. ` +
      "A série continua igual nos outros dias. O vínculo com uma meta pertence à série.";
  }

  // --- Botões ---

  const grupoBotoes = document.createElement("div");
  grupoBotoes.className = "grupo-botoes campo-largo";

  if (aoCancelar) {
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "botao-secundario";
    cancelar.textContent = "Cancelar";
    cancelar.addEventListener("click", () => aoCancelar());
    grupoBotoes.appendChild(cancelar);
  }

  const botaoSalvar = document.createElement("button");
  botaoSalvar.type = "submit";
  botaoSalvar.className = "botao-principal";
  botaoSalvar.textContent = rotuloBotao;
  grupoBotoes.appendChild(botaoSalvar);

  // --- Montagem: cada campo dentro de um rótulo, na ordem desejada ---

  // O vínculo pertence à série inteira. Na edição de uma ocorrência,
  // escondemos o campo para não dar a impressão de que ele vale só para o dia.
  const campoMeta = criarCampo("Meta (opcional)", meta);
  campoMeta.hidden = editarSomenteOcorrencia;

  formulario.appendChild(criarCampo("Título *", titulo, true));
  formulario.appendChild(criarCampo("Descrição (opcional)", descricao, true));
  formulario.appendChild(criarCampo("Categoria", categoria));
  formulario.appendChild(criarCampo("Prioridade", prioridade));
  formulario.appendChild(criarCampo(
    editarSomenteOcorrencia ? "Data (fixa nesta ocorrência)" : "Data",
    data
  ));
  formulario.appendChild(criarCampo("Horário de início *", horaInicio));
  formulario.appendChild(criarCampo("Duração (minutos) *", duracaoMinutos));
  formulario.appendChild(campoMeta);
  formulario.appendChild(blocoRecorrencia);
  formulario.appendChild(notaOcorrencia);
  formulario.appendChild(previa);
  formulario.appendChild(aviso);
  formulario.appendChild(erro);
  formulario.appendChild(grupoBotoes);

  // --- Comportamentos ---

  // Atualiza a prévia do horário final enquanto o usuário digita.
  function atualizarPrevia() {
    const minutos = Number(duracaoMinutos.value);

    if (horaInicio.value === "" || !Number.isInteger(minutos) || minutos <= 0) {
      previa.textContent = "Preencha horário e duração para ver o horário final.";
      aviso.hidden = true;
      return;
    }

    const { horaFinal, diaSeguinte } = somarMinutos(horaInicio.value, minutos);
    previa.textContent = `Termina às ${horaFinal}${diaSeguinte ? " (dia seguinte)" : ""}.`;

    // Aviso (sem bloquear) para durações incomuns.
    if (minutos > 720) {
      aviso.textContent = "Atenção: duração acima de 12 horas. Confira se é isso mesmo.";
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }
  }

  // Devolve true se pelo menos um dia da semana está marcado.
  function algumDiaMarcado() {
    return [...checkboxesDias.values()].some((checkbox) => checkbox.checked);
  }

  // "seg, qua e sex" (vírgulas e "e" antes do último item).
  function formatarLista(itens) {
    if (itens.length === 1) return itens[0];
    return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
  }

  // Mostra ou esconde os campos que dependem do tipo de repetição e do fim.
  function atualizarVisibilidade() {
    const tipo = repeticao.value;
    const repete = tipo !== "";
    const usaIntervalo = tipo === "diaria" || tipo === "semanal" || tipo === "mensal";
    const usaDias = tipo === "diasDaSemana";

    campoIntervalo.hidden = !usaIntervalo;
    campoDias.hidden = !usaDias;
    campoFimTipo.hidden = !repete;
    campoFimData.hidden = !repete || fimTipo.value !== "emData";
    campoFimQuantidade.hidden = !repete || fimTipo.value !== "apos";

    // Unidade do intervalo no singular ou plural.
    const unidades = {
      diaria: ["dia", "dias"],
      semanal: ["semana", "semanas"],
      mensal: ["mês", "meses"]
    };
    const [singular, plural] = unidades[tipo] ?? ["dia", "dias"];
    intervaloUnidade.textContent = Number(intervalo.value) === 1 ? singular : plural;

    // Ao escolher "Dias da semana", se nada estiver marcado, começamos pelo
    // dia da semana da data inicial. O usuário pode trocar em seguida.
    if (usaDias && !algumDiaMarcado()) {
      const dia = diaDaSemana(data.value || hojeISO());
      const checkbox = checkboxesDias.get(dia);
      if (checkbox) checkbox.checked = true;
    }

    // O seletor de data final não deve oferecer datas anteriores ao início.
    if (data.value) {
      fimData.min = data.value;
    } else {
      fimData.removeAttribute("min");
    }

    if (!repete) {
      ajudaRecorrencia.hidden = true;
    } else {
      ajudaRecorrencia.hidden = false;
      if (tipo === "diasDaSemana") {
        ajudaRecorrencia.textContent =
          "A série repete todas as semanas nos dias marcados. A primeira ocorrência é a data inicial ou o próximo dia marcado.";
      } else if (tipo === "mensal") {
        ajudaRecorrencia.textContent =
          "Se o dia não existir no mês, usamos o último dia (ex.: 31 vira 28 ou 29 em fevereiro).";
      } else {
        ajudaRecorrencia.textContent =
          "A série começa na data da tarefa e segue a partir dela.";
      }
    }

    atualizarResumo();
  }

  // Monta a frase de resumo que ajuda a conferir a regra antes de salvar.
  function atualizarResumo() {
    const tipo = repeticao.value;

    if (tipo === "") {
      resumoRecorrencia.hidden = true;
      resumoRecorrencia.textContent = "";
      return;
    }

    resumoRecorrencia.hidden = false;

    const valorIntervalo = Number(intervalo.value);
    const intervaloValido =
      Number.isInteger(valorIntervalo) && valorIntervalo >= 1 && valorIntervalo <= 365;
    const quantidade = intervaloValido ? valorIntervalo : 1;
    let texto;

    if (tipo === "diaria") {
      texto = !intervaloValido
        ? "Intervalo de repetição inválido"
        : quantidade === 1
          ? "Repete todos os dias"
          : `Repete a cada ${quantidade} dias`;
    } else if (tipo === "semanal") {
      texto = !intervaloValido
        ? "Intervalo de repetição inválido"
        : quantidade === 1
          ? "Repete toda semana"
          : `Repete a cada ${quantidade} semanas`;
    } else if (tipo === "mensal") {
      const base = !intervaloValido
        ? "Intervalo de repetição inválido"
        : quantidade === 1
          ? "Repete todo mês"
          : `Repete a cada ${quantidade} meses`;
      const diaDoMes = data.value.split("-")[2];
      texto = intervaloValido && diaDoMes ? `${base} no dia ${Number(diaDoMes)}` : base;
    } else if (tipo === "diasDaSemana") {
      const nomes = DIAS_DA_SEMANA
        .filter(({ valor }) => checkboxesDias.get(valor).checked)
        .map(({ nome }) => nome);
      texto = nomes.length > 0
        ? `Repete toda semana: ${formatarLista(nomes)}`
        : "Repete toda semana (escolha os dias)";
    } else {
      texto = "Repetição";
    }

    let fimTexto;
    if (fimTipo.value === "emData") {
      fimTexto = fimData.value
        ? `até ${formatarData(fimData.value)}`
        : "até uma data a definir";
    } else if (fimTipo.value === "apos") {
      const qtd = Number(fimQuantidade.value);
      fimTexto = Number.isInteger(qtd) && qtd >= 1 && qtd <= 999
        ? `por ${qtd} ${qtd === 1 ? "ocorrência" : "ocorrências"}`
        : "por um número de ocorrências a definir";
    } else {
      fimTexto = "sem data final";
    }

    resumoRecorrencia.textContent = `${texto}, ${fimTexto}.`;
  }

  // Monta o objeto salvo em tarefa.recorrencia (ou null quando não repete).
  function montarRecorrencia() {
    const tipo = repeticao.value;
    if (tipo === "") return null;

    const recorrencia = {
      tipo,
      // Em "diasDaSemana" o intervalo não é usado; guardamos 1 para manter
      // o mesmo formato do modelo de dados.
      intervalo: tipo === "diasDaSemana" ? 1 : Number(intervalo.value)
    };

    if (tipo === "diasDaSemana") {
      recorrencia.diasDaSemana = DIAS_DA_SEMANA
        .filter(({ valor }) => checkboxesDias.get(valor).checked)
        .map(({ valor }) => valor);
    }

    const fim = { tipo: fimTipo.value };
    if (fim.tipo === "emData") {
      fim.data = fimData.value;
    } else if (fim.tipo === "apos") {
      fim.quantidade = Number(fimQuantidade.value);
    }
    recorrencia.fim = fim;

    return recorrencia;
  }

  horaInicio.addEventListener("input", atualizarPrevia);
  duracaoMinutos.addEventListener("input", atualizarPrevia);

  repeticao.addEventListener("change", atualizarVisibilidade);
  intervalo.addEventListener("input", atualizarVisibilidade);
  fimTipo.addEventListener("change", atualizarVisibilidade);
  fimData.addEventListener("input", atualizarResumo);
  fimQuantidade.addEventListener("input", atualizarResumo);
  data.addEventListener("input", atualizarVisibilidade);

  for (const checkbox of checkboxesDias.values()) {
    checkbox.addEventListener("change", atualizarResumo);
  }

  atualizarPrevia();
  atualizarVisibilidade();

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const campos = {
      titulo: titulo.value,
      descricao: descricao.value,
      categoria: categoria.value,
      prioridade: prioridade.value,
      data: data.value,
      horaInicio: horaInicio.value,
      duracaoMinutos: Number(duracaoMinutos.value)
    };

    // Em "somente esta ocorrência" a recorrência e o vínculo com meta não
    // são enviados: os dois pertencem à série inteira.
    if (!editarSomenteOcorrencia) {
      campos.recorrencia = montarRecorrencia();
      campos.metaId = meta.value || null;
    }

    const mensagensDeErro = validar(campos);
    if (campos.recorrencia) {
      mensagensDeErro.push(...validarRecorrencia(campos.recorrencia, campos.data));
    }

    if (mensagensDeErro.length > 0) {
      erro.textContent = mensagensDeErro.join(" ");
      erro.hidden = false;
      return;
    }

    erro.hidden = true;
    aoSalvar(campos);
  });

  return formulario;
}

// Validação com mensagens em português (devolve a lista de problemas encontrados).
function validar(campos) {
  const erros = [];

  if (campos.titulo.trim() === "") {
    erros.push("Informe o título da tarefa.");
  }
  if (campos.data === "") {
    erros.push("Informe a data.");
  }
  if (campos.horaInicio === "") {
    erros.push("Informe o horário de início.");
  }
  if (!Number.isInteger(campos.duracaoMinutos) || campos.duracaoMinutos <= 0) {
    erros.push("A duração deve ser um número de minutos maior que zero.");
  }

  return erros;
}

// Cria um rótulo (<label>) envolvendo o campo; "largo" ocupa as duas colunas.
function criarCampo(rotulo, entrada, largo = false) {
  const grupo = document.createElement("label");
  grupo.className = largo ? "campo campo-largo" : "campo";

  const texto = document.createElement("span");
  texto.className = "campo-rotulo";
  texto.textContent = rotulo;

  grupo.appendChild(texto);
  grupo.appendChild(entrada);
  return grupo;
}

// Cria um grupo com rótulo, mas sem <label> envolvendo o conteúdo.
// É usado nos checkboxes, onde cada dia já tem seu próprio <label>.
function criarGrupo(rotulo, conteudo, largo = false) {
  const grupo = document.createElement("div");
  grupo.className = largo ? "campo campo-largo" : "campo";

  const texto = document.createElement("span");
  texto.className = "campo-rotulo";
  texto.textContent = rotulo;

  grupo.appendChild(texto);
  grupo.appendChild(conteudo);
  return grupo;
}
