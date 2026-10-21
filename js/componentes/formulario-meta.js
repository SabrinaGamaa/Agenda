// Componente: formulário de meta, usado para criar e editar.
// A validação fica em js/regras/metas.js (função pura e testável).

import { TIPOS_META, SITUACOES_META, validarMeta } from "../regras/metas.js";
import { centavosParaReais, reaisParaCentavos } from "../regras/dinheiro.js";

const ROTULOS_TIPO = {
  pessoal: "Pessoal",
  profissional: "Profissional",
  financeira: "Financeira"
};

const ROTULOS_SITUACAO = {
  ativa: "Ativa",
  concluida: "Concluída",
  abandonada: "Abandonada"
};

export function criarFormularioMeta({
  valoresIniciais = null,
  aoSalvar,
  aoCancelar = null,
  rotuloBotao = "Salvar meta"
}) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-meta";
  formulario.noValidate = true;

  const temEtapas =
    Array.isArray(valoresIniciais?.etapas) && valoresIniciais.etapas.length > 0;

  // --- Campos ---

  const titulo = document.createElement("input");
  titulo.type = "text";
  titulo.maxLength = 120;
  titulo.placeholder = "Ex.: Viagem para a praia";

  const descricao = document.createElement("textarea");
  descricao.maxLength = 600;
  descricao.rows = 3;
  descricao.placeholder = "Por que esta meta é importante? (opcional)";

  const tipo = document.createElement("select");
  for (const valor of TIPOS_META) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = ROTULOS_TIPO[valor];
    tipo.appendChild(opcao);
  }

  const prazo = document.createElement("input");
  prazo.type = "date";

  const situacao = document.createElement("select");
  for (const valor of SITUACOES_META) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = ROTULOS_SITUACAO[valor];
    situacao.appendChild(opcao);
  }

  const progresso = document.createElement("input");
  progresso.type = "number";
  progresso.min = "0";
  progresso.max = "100";
  progresso.step = "1";

  // --- Valores iniciais (edição) ou padrões (criação) ---

  if (valoresIniciais) {
    titulo.value = valoresIniciais.titulo ?? "";
    descricao.value = valoresIniciais.descricao ?? "";
    tipo.value = TIPOS_META.includes(valoresIniciais.tipo)
      ? valoresIniciais.tipo
      : "pessoal";
    prazo.value = valoresIniciais.prazo ?? "";
    situacao.value = SITUACOES_META.includes(valoresIniciais.situacao)
      ? valoresIniciais.situacao
      : "ativa";
    progresso.value = String(valoresIniciais.progressoManual ?? 0);
  } else {
    tipo.value = "pessoal";
    situacao.value = "ativa";
    progresso.value = "0";
  }

  // --- Bloco financeiro (só aparece para metas financeiras) ---

  const alvo = document.createElement("input");
  alvo.type = "number";
  alvo.min = "0.01";
  alvo.step = "0.01";
  alvo.placeholder = "0,00";

  const atual = document.createElement("input");
  atual.type = "number";
  atual.min = "0";
  atual.step = "0.01";
  atual.value = "0.00";

  if (valoresIniciais?.tipo === "financeira") {
    if (valoresIniciais.valorAlvoCentavos !== null &&
        valoresIniciais.valorAlvoCentavos !== undefined) {
      alvo.value = centavosParaReais(valoresIniciais.valorAlvoCentavos);
    }
    atual.value = centavosParaReais(valoresIniciais.valorAtualCentavos ?? 0);
  }

  const gradeFinanceira = document.createElement("div");
  gradeFinanceira.className = "meta-financeiro-grade";
  gradeFinanceira.appendChild(criarCampo("Valor alvo (R$) *", alvo));
  gradeFinanceira.appendChild(criarCampo("Valor atual (R$)", atual));

  const blocoFinanceiro = document.createElement("fieldset");
  blocoFinanceiro.className = "meta-financeiro-campos campo-largo";

  const legendaFinanceira = document.createElement("legend");
  legendaFinanceira.textContent = "Valores financeiros";
  blocoFinanceiro.appendChild(legendaFinanceira);
  blocoFinanceiro.appendChild(gradeFinanceira);

  // --- Progresso manual x automático ---

  const campoProgresso = criarCampo("Progresso manual (%)", progresso);

  const ajudaProgresso = document.createElement("p");
  ajudaProgresso.className = "meta-ajuda campo-largo";
  ajudaProgresso.hidden = true;

  // --- Mensagem de erro e botões ---

  const erro = document.createElement("p");
  erro.className = "erro-formulario campo-largo";
  erro.hidden = true;

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

  // --- Montagem ---

  formulario.appendChild(criarCampo("Título *", titulo, true));
  formulario.appendChild(criarCampo("Descrição (opcional)", descricao, true));
  formulario.appendChild(criarCampo("Tipo", tipo));
  formulario.appendChild(criarCampo("Prazo (opcional)", prazo));
  formulario.appendChild(criarCampo("Situação", situacao));
  formulario.appendChild(campoProgresso);
  formulario.appendChild(blocoFinanceiro);
  formulario.appendChild(ajudaProgresso);
  formulario.appendChild(erro);
  formulario.appendChild(grupoBotoes);

  // --- Comportamentos ---

  function atualizarTipo() {
    const financeira = tipo.value === "financeira";
    blocoFinanceiro.hidden = !financeira;

    // O progresso manual só aparece em metas sem etapas e não financeiras.
    // Com etapas, ele é automático; em meta financeira, vale o valor atual/alvo.
    campoProgresso.hidden = temEtapas || financeira;

    if (temEtapas) {
      const concluidas = valoresIniciais.etapas.filter((etapa) => etapa?.concluida).length;
      ajudaProgresso.hidden = false;
      ajudaProgresso.textContent =
        `Esta meta tem ${valoresIniciais.etapas.length} etapa(s), ` +
        `com ${concluidas} concluída(s). O progresso é calculado por elas.`;
    } else if (financeira) {
      ajudaProgresso.hidden = false;
      ajudaProgresso.textContent =
        "O progresso desta meta é calculado pelo valor atual e pelo valor alvo.";
    } else {
      ajudaProgresso.hidden = true;
      ajudaProgresso.textContent = "";
    }
  }

  tipo.addEventListener("change", atualizarTipo);
  atualizarTipo();

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const campos = {
      titulo: titulo.value,
      descricao: descricao.value,
      tipo: tipo.value,
      prazo: prazo.value || null,
      situacao: situacao.value
    };

    // Com etapas (ou em meta financeira), o progresso é automático:
    // não enviamos o campo para preservar o valor manual que já estiver salvo.
    if (!temEtapas && tipo.value !== "financeira") {
      campos.progressoManual = Number(progresso.value);
    }

    if (tipo.value === "financeira") {
      campos.valorAlvoCentavos = reaisParaCentavos(alvo.value);
      campos.valorAtualCentavos = reaisParaCentavos(atual.value || "0");
    }

    const erros = validarMeta(campos);
    if (erros.length > 0) {
      erro.textContent = erros.join(" ");
      erro.hidden = false;
      return;
    }

    erro.hidden = true;
    aoSalvar(campos);
  });

  return formulario;
}

// Cria um <label> ao redor do campo. "largo" ocupa as duas colunas do grid.
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
