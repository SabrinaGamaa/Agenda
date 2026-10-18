// Componente: barra de filtros (Categoria, Prioridade, Situação) + "Limpar filtros".
// Lê e grava os filtros no módulo js/regras/filtros.js e avisa quem montou a tela
// (aoMudar) para que ela se redesenhe com o resultado.

import { obterFiltros, definirFiltro, limparFiltros, temFiltroAtivo } from "../regras/filtros.js";

/**
 * @param {Object} params
 * @param {string[]} params.categorias - lista de categorias (estado.config.categoriasTarefas)
 * @param {Function} params.aoMudar - chamado sempre que um filtro mudar (para redesenhar)
 * @returns {HTMLElement} div.barra-filtros
 */
export function criarBarraFiltros({ categorias, aoMudar }) {
  const barra = document.createElement("div");
  barra.className = "barra-filtros";
  barra.setAttribute("role", "group");
  barra.setAttribute("aria-label", "Filtros de tarefas");

  const atual = obterFiltros();

  const categoria = criarSeletor("Categoria", [
    { valor: "", rotulo: "Todas" },
    ...categorias.map((nome) => ({ valor: nome, rotulo: nome }))
  ], atual.categoria);
  categoria.input.addEventListener("change", () => {
    definirFiltro("categoria", categoria.input.value);
    aoMudar();
  });

  const prioridade = criarSeletor("Prioridade", [
    { valor: "", rotulo: "Todas" },
    { valor: "alta", rotulo: "Alta" },
    { valor: "media", rotulo: "Média" },
    { valor: "baixa", rotulo: "Baixa" }
  ], atual.prioridade);
  prioridade.input.addEventListener("change", () => {
    definirFiltro("prioridade", prioridade.input.value);
    aoMudar();
  });

  const situacao = criarSeletor("Situação", [
    { valor: "todas", rotulo: "Todas" },
    { valor: "pendentes", rotulo: "Pendentes" },
    { valor: "concluidas", rotulo: "Concluídas" }
  ], atual.situacao);
  situacao.input.addEventListener("change", () => {
    definirFiltro("situacao", situacao.input.value);
    aoMudar();
  });

  barra.appendChild(categoria.elemento);
  barra.appendChild(prioridade.elemento);
  barra.appendChild(situacao.elemento);

  // "Limpar filtros" só aparece quando há algo para limpar.
  if (temFiltroAtivo()) {
    const limpar = document.createElement("button");
    limpar.type = "button";
    limpar.className = "botao-discreto";
    limpar.textContent = "Limpar filtros";
    limpar.addEventListener("click", () => {
      limparFiltros();
      aoMudar();
    });
    barra.appendChild(limpar);
  }

  return barra;
}

// Cria um campo "Rótulo + <select>" já preenchido com o valor atual.
function criarSeletor(rotulo, opcoes, valorAtual) {
  const campo = document.createElement("label");
  campo.className = "filtro-campo";

  const texto = document.createElement("span");
  texto.className = "filtro-rotulo";
  texto.textContent = rotulo;

  const select = document.createElement("select");
  for (const { valor, rotulo: rotuloOpcao } of opcoes) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = rotuloOpcao;
    select.appendChild(opcao);
  }
  select.value = valorAtual;

  campo.appendChild(texto);
  campo.appendChild(select);
  return { elemento: campo, input: select };
}
