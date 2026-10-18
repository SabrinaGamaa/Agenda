// Tela inicial (Home): Calendário mensal + Painel lateral.
// Clicar num dia do calendário → navega para a tela de tarefas daquele dia.

import { hojeISO, somarDias, formatarDataLonga } from "../regras/datas.js";
import { criarCalendarioMes, atualizarIndicadoresCalendario, atualizarDiaVisualizadoCalendario } from "../componentes/calendario.js";
import { criarPainelLateral } from "../componentes/painel-lateral.js";
import { desenharTarefasDoDia } from "./tarefas.js";

// Referências aos componentes atuais (para atualização)
let calendarioAtual = null;
let painelLateralAtual = null;

/**
 * Desenha a tela inicial (Home).
 * @param {Object} estado - estado global
 * @param {Function} aoSelecionarDia - callback(dataISO) para ir para a tela de tarefas
 */
export function desenharInicio(estado, aoSelecionarDia) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "layout-duas-colunas";

  // Calendário (esquerda)
  const cartaoCalendario = criarCalendarioMes({
    estado,
    dataReferencia: hojeISO(), // mês atual
    aoClicarDia: (dataISO) => {
      // Atualiza visual do dia selecionado no calendário
      atualizarDiaVisualizadoCalendario(calendarioAtual.gradeDias, dataISO);
      // Navega para a tela de tarefas
      aoSelecionarDia(dataISO);
    }
  });
  calendarioAtual = cartaoCalendario;

  // Painel lateral (direita)
  const painelLateral = criarPainelLateral(estado);
  painelLateralAtual = painelLateral;

  layout.appendChild(cartaoCalendario);
  layout.appendChild(painelLateral);
  conteudo.appendChild(layout);
}

/**
 * Atualiza os indicadores (bolinhas) do calendário e do painel lateral
 * após mudanças nas tarefas (criar, editar, concluir, excluir).
 */
export function atualizarHome(estado) {
  if (calendarioAtual && calendarioAtual.atualizarIndicadores) {
    calendarioAtual.atualizarIndicadores();
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