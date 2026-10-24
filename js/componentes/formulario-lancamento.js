// Componente: formulário de lançamento (receita ou despesa), usado para criar e editar.
// A validação fica em js/regras/financas.js; aqui só montamos os campos e os avisos.
//
// Decisão de entrada: o valor é um campo de TEXTO que aceita "1.234,56".
// Assim aceitamos o formato brasileiro sem depender do separador do <input type="number">.

import { validarLancamento } from "../regras/financas.js";
import { formatarCentavos, reaisParaCentavos } from "../regras/dinheiro.js";
import { formatarData, hojeISO } from "../regras/datas.js";

const ORDEM_TIPOS = ["despesa", "receita"];
const ROTULOS_TIPO = {
  despesa: "Despesa",
  receita: "Receita"
};

export function criarFormularioLancamento({
  categorias = [],
  valoresIniciais = null,
  dataPadrao = hojeISO(),
  rotuloBotao = "Salvar lançamento",
  verificarDuplicata = null,
  aoSalvar,
  aoCancelar = null
}) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-lancamento";
  formulario.noValidate = true;

  // --- Campos ---

  const tipo = document.createElement("select");
  for (const valor of ORDEM_TIPOS) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = ROTULOS_TIPO[valor];
    tipo.appendChild(opcao);
  }

  const data = document.createElement("input");
  data.type = "date";

  const valor = document.createElement("input");
  valor.type = "text";
  valor.inputMode = "decimal";
  valor.autocomplete = "off";
  valor.maxLength = 20;
  valor.placeholder = "0,00";

  const descricao = document.createElement("input");
  descricao.type = "text";
  descricao.maxLength = 160;
  descricao.placeholder = "Ex.: Mercado do mês";

  const categoria = document.createElement("select");

  const listaCategorias = Array.isArray(categorias) ? [...categorias] : [];

  // Um lançamento antigo pode ter categoria fora da lista atual.
  // Nesse caso, mantemos a opção para não perder o dado na edição.
  if (
    valoresIniciais?.categoria &&
    !listaCategorias.includes(valoresIniciais.categoria)
  ) {
    listaCategorias.push(valoresIniciais.categoria);
  }

  if (listaCategorias.length === 0) {
    listaCategorias.push("Outros");
  }

  for (const nome of listaCategorias) {
    const opcao = document.createElement("option");
    opcao.value = nome;
    opcao.textContent = nome;
    categoria.appendChild(opcao);
  }

  // --- Valores iniciais (edição) ou padrões (criação) ---

  tipo.value = valoresIniciais?.tipo === "receita" ? "receita" : "despesa";
  data.value = valoresIniciais?.data || dataPadrao || hojeISO();
  valor.value = valoresIniciais
    ? formatarValorParaCampo(valoresIniciais.valorCentavos)
    : "";
  descricao.value = valoresIniciais?.descricao ?? "";
  categoria.value = listaCategorias.includes(valoresIniciais?.categoria)
    ? valoresIniciais.categoria
    : listaCategorias[0];

  // --- Aviso de possível duplicata (mostrado depois do submit) ---

  let camposPendentes = null;

  const aviso = document.createElement("div");
  aviso.className = "aviso-duplicata campo-largo";
  aviso.hidden = true;
  aviso.setAttribute("role", "alert");

  const textoAviso = document.createElement("p");

  const grupoAviso = document.createElement("div");
  grupoAviso.className = "grupo-botoes";

  const corrigir = document.createElement("button");
  corrigir.type = "button";
  corrigir.className = "botao-secundario";
  corrigir.textContent = "Corrigir";
  corrigir.addEventListener("click", () => {
    limparAvisos();
    valor.focus();
  });

  const gravarAssim = document.createElement("button");
  gravarAssim.type = "button";
  gravarAssim.className = "botao-principal";
  gravarAssim.textContent = "Gravar mesmo assim";
  gravarAssim.addEventListener("click", () => {
    if (camposPendentes !== null) {
      aoSalvar(camposPendentes);
    }
  });

  grupoAviso.appendChild(corrigir);
  grupoAviso.appendChild(gravarAssim);
  aviso.appendChild(textoAviso);
  aviso.appendChild(grupoAviso);

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

  formulario.appendChild(criarCampo("Tipo", tipo));
  formulario.appendChild(criarCampo("Data *", data));
  formulario.appendChild(criarCampo("Valor (R$) *", valor));
  formulario.appendChild(criarCampo("Categoria *", categoria));
  formulario.appendChild(criarCampo("Descrição *", descricao, true));
  formulario.appendChild(aviso);
  formulario.appendChild(erro);
  formulario.appendChild(grupoBotoes);

  // --- Comportamentos ---

  function montarCampos() {
    return {
      tipo: tipo.value,
      data: data.value,
      valorCentavos: reaisParaCentavos(valor.value.replace(/R\$\s?/i, "")),
      descricao: descricao.value,
      categoria: categoria.value
    };
  }

  function limparAvisos() {
    erro.hidden = true;
    aviso.hidden = true;
    camposPendentes = null;
  }

  // Mudar qualquer campo invalida o aviso de duplicata anterior.
  for (const campo of [tipo, data, valor, descricao, categoria]) {
    campo.addEventListener("input", limparAvisos);
    campo.addEventListener("change", limparAvisos);
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const campos = montarCampos();
    const erros = validarLancamento(campos, listaCategorias);

    if (erros.length > 0) {
      erro.textContent = erros.join(" ");
      erro.hidden = false;
      return;
    }

    erro.hidden = true;

    if (typeof verificarDuplicata === "function") {
      const duplicata = verificarDuplicata(campos);

      if (duplicata) {
        camposPendentes = campos;
        textoAviso.textContent =
          `Já existe um lançamento igual: “${duplicata.descricao ?? "sem descrição"}” — ` +
          `${formatarCentavos(duplicata.valorCentavos)} em ${formatarData(duplicata.data)}. ` +
          "Gravar mesmo assim?";
        aviso.hidden = false;
        gravarAssim.focus();
        return;
      }
    }

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
