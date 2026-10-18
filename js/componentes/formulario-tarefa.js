// Componente reutilizável: formulário para criar uma tarefa.
// Recebe as categorias disponíveis e a função "aoSalvar",
// chamada com os campos já validados.

import { hojeISO, somarMinutos } from "../regras/datas.js";

export function criarFormularioTarefa({ categorias, aoSalvar }) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-tarefa";
  formulario.noValidate = true; // validação nativa desligada: usamos mensagens nossas, em português

  // --- Campos do formulário ---

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
  prioridade.value = "media";

  const data = document.createElement("input");
  data.type = "date";
  data.value = hojeISO();

  const horaInicio = document.createElement("input");
  horaInicio.type = "time";

  const duracaoMinutos = document.createElement("input");
  duracaoMinutos.type = "number";
  duracaoMinutos.min = "5";
  duracaoMinutos.max = "1440";
  duracaoMinutos.step = "5";
  duracaoMinutos.value = "30";

  // --- Mensagens (prévia do horário final, aviso e erros) ---

  const previa = document.createElement("p");
  previa.className = "previa-horario campo-largo";

  const aviso = document.createElement("p");
  aviso.className = "aviso-inconsistencia campo-largo";
  aviso.hidden = true;

  const erro = document.createElement("p");
  erro.className = "erro-formulario campo-largo";
  erro.hidden = true;

  const botao = document.createElement("button");
  botao.type = "submit";
  botao.className = "botao-principal campo-largo";
  botao.textContent = "Adicionar tarefa";

  // --- Montagem: cada campo dentro de um rótulo, na ordem desejada ---

  formulario.appendChild(criarCampo("Título *", titulo, true));
  formulario.appendChild(criarCampo("Descrição (opcional)", descricao, true));
  formulario.appendChild(criarCampo("Categoria", categoria));
  formulario.appendChild(criarCampo("Prioridade", prioridade));
  formulario.appendChild(criarCampo("Data", data));
  formulario.appendChild(criarCampo("Horário de início *", horaInicio));
  formulario.appendChild(criarCampo("Duração (minutos) *", duracaoMinutos));
  formulario.appendChild(previa);
  formulario.appendChild(aviso);
  formulario.appendChild(erro);
  formulario.appendChild(botao);

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

  horaInicio.addEventListener("input", atualizarPrevia);
  duracaoMinutos.addEventListener("input", atualizarPrevia);
  atualizarPrevia();

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

    const mensagensDeErro = validar(campos);
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
