// Componente: formulário de conta fixa, usado para criar e editar.
// A validação fica em js/regras/contas-fixas.js; aqui só montamos os campos.
//
// O valor previsto é um campo de TEXTO para aceitar o formato brasileiro
// "1.234,56", igual ao formulário de lançamento.

import { validarContaFixa } from "../regras/contas-fixas.js";
import { formatarCentavos, reaisParaCentavos } from "../regras/dinheiro.js";

const ORDEM_TIPOS = ["despesa", "receita"];
const ROTULOS_TIPO = {
  despesa: "Despesa",
  receita: "Receita"
};

export function criarFormularioContaFixa({
  categorias = [],
  valoresIniciais = null,
  rotuloBotao = "Salvar conta fixa",
  aoSalvar,
  aoCancelar = null
}) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-conta-fixa";
  formulario.noValidate = true;

  // --- Campos ---

  const nome = document.createElement("input");
  nome.type = "text";
  nome.maxLength = 120;
  nome.placeholder = "Ex.: Aluguel";

  const tipo = document.createElement("select");
  for (const valor of ORDEM_TIPOS) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = ROTULOS_TIPO[valor];
    tipo.appendChild(opcao);
  }

  const situacao = document.createElement("select");
  for (const [valor, rotulo] of [["true", "Ativa"], ["false", "Inativa"]]) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = rotulo;
    situacao.appendChild(opcao);
  }

  const valor = document.createElement("input");
  valor.type = "text";
  valor.inputMode = "decimal";
  valor.autocomplete = "off";
  valor.maxLength = 20;
  valor.placeholder = "0,00";

  const dia = document.createElement("input");
  dia.type = "number";
  dia.min = "1";
  dia.max = "31";
  dia.step = "1";
  dia.inputMode = "numeric";

  const categoria = document.createElement("select");

  const listaCategorias = Array.isArray(categorias) ? [...categorias] : [];

  // Uma conta antiga pode ter categoria fora da lista atual.
  // Mantemos a opção para não perder o dado na edição.
  if (
    valoresIniciais?.categoria &&
    !listaCategorias.includes(valoresIniciais.categoria)
  ) {
    listaCategorias.push(valoresIniciais.categoria);
  }

  if (listaCategorias.length === 0) {
    listaCategorias.push("Outros");
  }

  for (const item of listaCategorias) {
    const opcao = document.createElement("option");
    opcao.value = item;
    opcao.textContent = item;
    categoria.appendChild(opcao);
  }

  const inicio = document.createElement("input");
  inicio.type = "date";

  const fim = document.createElement("input");
  fim.type = "date";

  // --- Valores iniciais (edição) ou padrões (criação) ---

  nome.value = valoresIniciais?.nome ?? "";
  tipo.value = valoresIniciais?.tipo === "receita" ? "receita" : "despesa";
  situacao.value = valoresIniciais?.ativa === false ? "false" : "true";
  valor.value = valoresIniciais
    ? formatarValorParaCampo(valoresIniciais.valorPrevistoCentavos)
    : "";
  dia.value = valoresIniciais?.diaVencimento
    ? String(valoresIniciais.diaVencimento)
    : "1";
  categoria.value = listaCategorias.includes(valoresIniciais?.categoria)
    ? valoresIniciais.categoria
    : listaCategorias[0];
  inicio.value = valoresIniciais?.inicioEm ?? "";
  fim.value = valoresIniciais?.fimEm ?? "";

  // --- Ajuda, erro e botões ---

  const ajuda = document.createElement("p");
  ajuda.className = "conta-fixa-ajuda campo-largo";
  ajuda.textContent =
    "O dia 31 é ajustado para o último dia nos meses mais curtos. " +
    "Início e fim são opcionais.";

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

  formulario.appendChild(criarCampo("Nome *", nome, true));
  formulario.appendChild(criarCampo("Tipo", tipo));
  formulario.appendChild(criarCampo("Situação", situacao));
  formulario.appendChild(criarCampo("Valor previsto (R$) *", valor));
  formulario.appendChild(criarCampo("Dia de vencimento *", dia));
  formulario.appendChild(criarCampo("Categoria *", categoria, true));
  formulario.appendChild(criarCampo("Início (opcional)", inicio));
  formulario.appendChild(criarCampo("Fim (opcional)", fim));
  formulario.appendChild(ajuda);
  formulario.appendChild(erro);
  formulario.appendChild(grupoBotoes);

  // --- Comportamentos ---

  // Esconder o erro antigo assim que a pessoa começa a corrigir.
  for (const campo of [nome, tipo, situacao, valor, dia, categoria, inicio, fim]) {
    campo.addEventListener("input", () => {
      erro.hidden = true;
    });
    campo.addEventListener("change", () => {
      erro.hidden = true;
    });
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const campos = {
      nome: nome.value,
      tipo: tipo.value,
      valorPrevistoCentavos: reaisParaCentavos(
        valor.value.replace(/R\$\s?/i, "")
      ),
      diaVencimento: Number(dia.value),
      categoria: categoria.value,
      ativa: situacao.value === "true",
      inicioEm: inicio.value || null,
      fimEm: fim.value || null
    };

    const erros = validarContaFixa(campos, listaCategorias);

    if (erros.length > 0) {
      erro.textContent = erros.join(" ");
      erro.hidden = false;
      // Em telas pequenas o erro e os botões ficam abaixo da dobra do modal.
      // Rolar até os botões mantém o aviso e a ação de salvar visíveis.
      grupoBotoes.scrollIntoView({ block: "nearest" });
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

// 123456 -> "1.234,56" (sem o "R$", para caber no campo de texto).
function formatarValorParaCampo(centavos) {
  const numero = Number(centavos);
  if (!Number.isFinite(numero) || numero <= 0) return "";

  return formatarCentavos(Math.round(numero)).replace(/^R\$\s?/, "");
}
