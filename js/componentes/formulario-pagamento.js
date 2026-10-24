// Componente: formulário de pagamento de conta fixa.
// A validação de valor, data, competência e duplicata fica nas regras de
// contas fixas. O formulário monta os campos e mostra os erros devolvidos.
//
// O valor é um campo de TEXTO para aceitar o formato brasileiro "1.234,56",
// igual aos formulários de lançamento e de conta fixa.

import { formatarCentavos, reaisParaCentavos } from "../regras/dinheiro.js";
import { formatarData, hojeISO } from "../regras/datas.js";
import { formatarCompetencia } from "../regras/financas.js";

const ROTULOS_TIPO = {
  despesa: "Despesa",
  receita: "Receita"
};

export function criarFormularioPagamento({
  conta,
  competencia,
  valoresIniciais = null,
  dataPadrao = hojeISO(),
  rotuloBotao = "Registrar pagamento",
  aoSalvar,
  aoCancelar = null
}) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-pagamento";
  formulario.noValidate = true;

  // --- Resumo da conta ---

  const resumo = document.createElement("div");
  resumo.className = "pagamento-resumo campo-largo";

  const nome = document.createElement("strong");
  nome.className = "pagamento-conta-nome";
  nome.textContent = conta.nome ?? "Conta fixa";

  const detalhes = document.createElement("span");
  detalhes.className = "pagamento-conta-detalhes";

  const tipo = conta.tipoPagamento ?? conta.tipo;
  const partes = [];

  if (conta.ativa === false) partes.push("Inativa");
  else if (conta.vigente === false) partes.push("Fora do período");
  partes.push(ROTULOS_TIPO[tipo] ?? "Despesa");
  if (conta.categoria) partes.push(conta.categoria);
  if (conta.dataVencimento) {
    partes.push(`vence ${formatarData(conta.dataVencimento)}`);
  }

  detalhes.textContent = partes.join(" · ");

  const competenciaTexto = document.createElement("span");
  competenciaTexto.className = "pagamento-competencia";
  competenciaTexto.textContent =
    `Competência: ${formatarCompetencia(competencia)} · ` +
    `Previsto: ${formatarCentavos(conta.valorPrevistoCentavos)}`;

  resumo.appendChild(nome);
  resumo.appendChild(detalhes);
  resumo.appendChild(competenciaTexto);

  // --- Campos ---

  const valor = document.createElement("input");
  valor.type = "text";
  valor.inputMode = "decimal";
  valor.autocomplete = "off";
  valor.maxLength = 20;
  valor.placeholder = "0,00";

  const data = document.createElement("input");
  data.type = "date";

  valor.value = formatarValorParaCampo(
    valoresIniciais?.valorPagoCentavos ?? conta.valorPrevistoCentavos
  );
  data.value = valoresIniciais?.dataPagamento || dataPadrao || hojeISO();

  // --- Ajuda, erro e botões ---

  const ajuda = document.createElement("p");
  ajuda.className = "conta-pagamento-ajuda campo-largo";
  ajuda.textContent = valoresIniciais
    ? "O lançamento vinculado será atualizado com o novo valor e a nova data."
    : "O lançamento será criado com a data do pagamento. O valor pode ser diferente do previsto.";

  const erro = document.createElement("p");
  erro.className = "erro-formulario campo-largo";
  erro.hidden = true;
  erro.setAttribute("role", "alert");

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

  formulario.appendChild(resumo);
  formulario.appendChild(criarCampo("Valor pago (R$) *", valor));
  formulario.appendChild(criarCampo("Data do pagamento *", data));
  formulario.appendChild(ajuda);
  formulario.appendChild(erro);
  formulario.appendChild(grupoBotoes);

  // --- Comportamentos ---

  for (const campo of [valor, data]) {
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
      valorPagoCentavos: reaisParaCentavos(
        valor.value.replace(/R\$\s?/i, "")
      ),
      dataPagamento: data.value
    };

    // A tela devolve o resultado da regra para que os erros apareçam aqui.
    const resultado = aoSalvar(campos);

    if (resultado && resultado.sucesso === false) {
      erro.textContent = resultado.erros.join(" ");
      erro.hidden = false;
      erro.scrollIntoView({ block: "nearest" });
    }
  });

  return formulario;
}

// Cria um <label> ao redor do campo.
function criarCampo(rotulo, entrada) {
  const grupo = document.createElement("label");
  grupo.className = "campo";

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
