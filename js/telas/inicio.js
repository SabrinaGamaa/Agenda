// Tela inicial (Home): painel principal + alternador Mês | Semana + filtros.
// - Painel principal: tarefas, metas, finanças do mês e contas a vencer.
// - Visão de mês: calendário com bolinhas de prioridade por dia.
// - Visão de semana: colunas de domingo a sábado com as tarefas de cada dia.
// Clicar num dia leva para a tela de tarefas daquele dia (o app.js cuida da troca).

import { hojeISO } from "../regras/datas.js";
import {
  criarCalendarioMes,
  atualizarDiaVisualizadoCalendario
} from "../componentes/calendario.js";
import { criarVisaoSemana } from "../componentes/visao-semana.js";
import { criarBarraFiltros } from "../componentes/barra-filtros.js";
import { criarPainelLateral } from "../componentes/painel-lateral.js";
import { criarPainelPrincipal } from "../componentes/painel-principal.js";

// --- Estado da tela (em memória; ao recarregar, voltamos para hoje) ---
let visaoAtual = "mes";       // "mes" | "semana"
let mesReferencia = null;     // 1º dia do mês exibido ("AAAA-MM-DD")
let semanaReferencia = null;  // qualquer dia da semana exibida ("AAAA-MM-DD")

// Referências atuais (para atualização pontual, sem redesenhar tudo)
let estadoAtual = null;
let aoSelecionarDiaAtual = null;
let aoAbrirMetasAtual = null;
let aoAbrirFinancasAtual = null;
let calendarioAtual = null;
let semanaAtual = null;
let painelLateralAtual = null;
let painelPrincipalAtual = null;

/**
 * Desenha a tela inicial (Home).
 * @param {Object} estado - estado global
 * @param {Function} aoSelecionarDia - callback(dataISO) para ir para a tela de tarefas
 * @param {Object} [opcoes]
 * @param {Function} [opcoes.aoAbrirMetas] - callback() para a aba Metas
 * @param {Function} [opcoes.aoAbrirFinancas] - callback(competencia?) para Finanças
 */
export function desenharInicio(estado, aoSelecionarDia, opcoes = {}) {
  estadoAtual = estado;
  aoSelecionarDiaAtual = aoSelecionarDia;
  aoAbrirMetasAtual = opcoes.aoAbrirMetas ?? null;
  aoAbrirFinancasAtual = opcoes.aoAbrirFinancas ?? null;

  // Primeira carga: começa no mês/semana de hoje.
  // Depois disso, respeita a navegação (‹ ›) que o usuário fez.
  if (!mesReferencia) mesReferencia = primeiroDiaDoMes(hojeISO());
  if (!semanaReferencia) semanaReferencia = hojeISO();

  renderizar();
}

// Redesenha a tela inteira respeitando visão, período e filtros atuais.
function renderizar() {
  const estado = estadoAtual;
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = "";

  // Barra superior: alternador de visão (esquerda) + filtros (direita)
  const barra = document.createElement("div");
  barra.className = "home-barra";
  barra.appendChild(criarAlternadorVisao());
  barra.appendChild(criarBarraFiltros({
    categorias: estado.config.categoriasTarefas,
    aoMudar: renderizar
  }));
  conteudo.appendChild(barra);

  // Painel principal: resumo dos quatro blocos da Fase 7.
  painelPrincipalAtual = criarPainelPrincipal(estado, {
    aoAbrirDia: aoSelecionarDiaAtual,
    aoAbrirMetas: aoAbrirMetasAtual,
    aoAbrirFinancas: aoAbrirFinancasAtual
  });
  conteudo.appendChild(painelPrincipalAtual);

  // Callback único para abrir um dia (vindo do calendário ou da semana)
  const aoClicarDia = (dataISO) => {
    if (calendarioAtual) {
      atualizarDiaVisualizadoCalendario(calendarioAtual.gradeDias, dataISO);
    }
    aoSelecionarDiaAtual(dataISO);
  };

  // Conteúdo (esquerda) + painel lateral (direita)
  const layout = document.createElement("div");
  layout.className = "layout-duas-colunas";

  if (visaoAtual === "semana") {
    calendarioAtual = null;
    semanaAtual = criarVisaoSemana({
      estado,
      dataReferencia: semanaReferencia,
      aoClicarDia,
      aoMudarPeriodo: (novaReferencia) => {
        semanaReferencia = novaReferencia;
        renderizar();
      }
    });
    layout.appendChild(semanaAtual);
  } else {
    semanaAtual = null;
    calendarioAtual = criarCalendarioMes({
      estado,
      dataReferencia: mesReferencia,
      aoClicarDia,
      aoMudarPeriodo: (novaReferencia) => {
        mesReferencia = novaReferencia;
        renderizar();
      }
    });
    layout.appendChild(calendarioAtual);
  }

  painelLateralAtual = criarPainelLateral(estado);
  layout.appendChild(painelLateralAtual);
  conteudo.appendChild(layout);
}

// Alternador "Mês | Semana".
function criarAlternadorVisao() {
  const grupo = document.createElement("div");
  grupo.className = "alternador-visao";
  grupo.setAttribute("role", "group");
  grupo.setAttribute("aria-label", "Mudar visão do calendário");

  for (const { id, rotulo } of [
    { id: "mes", rotulo: "Mês" },
    { id: "semana", rotulo: "Semana" }
  ]) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "alternador-botao" + (visaoAtual === id ? " ativo" : "");
    botao.textContent = rotulo;
    botao.setAttribute("aria-pressed", String(visaoAtual === id));
    botao.addEventListener("click", () => {
      if (visaoAtual !== id) {
        visaoAtual = id;
        renderizar();
      }
    });
    grupo.appendChild(botao);
  }

  return grupo;
}

// "2026-10-18" -> "2026-10-01" (primeiro dia do mesmo mês)
function primeiroDiaDoMes(dataISO) {
  return `${dataISO.slice(0, 7)}-01`;
}

/**
 * Atualiza os indicadores (bolinhas do mês / cartões da semana), o painel
 * principal e o painel lateral após mudanças nos dados.
 */
export function atualizarHome(estado) {
  if (calendarioAtual && calendarioAtual.atualizarIndicadores) {
    calendarioAtual.atualizarIndicadores();
  }
  if (semanaAtual && semanaAtual.atualizar) {
    semanaAtual.atualizar();
  }
  if (painelPrincipalAtual && painelPrincipalAtual.atualizar) {
    painelPrincipalAtual.atualizar();
  }
  if (painelLateralAtual && painelLateralAtual.atualizar) {
    painelLateralAtual.atualizar();
  }
}

/**
 * Atualiza qual dia está marcado como "visualizado" no calendário.
 */
export function marcarDiaVisualizadoNoCalendario(dataISO) {
  if (calendarioAtual && calendarioAtual.gradeDias) {
    atualizarDiaVisualizadoCalendario(calendarioAtual.gradeDias, dataISO);
  }
}
