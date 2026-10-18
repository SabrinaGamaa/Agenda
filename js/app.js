// Entry point do Meu Painel Pessoal.
// Inicia no Home (calendário + painel lateral).
// Clicar num dia no calendário → mostra a tela de tarefas daquele dia.
// A tela de tarefas tem botão "Home" no cabeçalho para voltar.

import { carregar, salvar } from "./dados/armazenamento.js";
import { desenharInicio, atualizarHome, marcarDiaVisualizadoNoCalendario } from "./telas/inicio.js";
import { desenharTarefasDoDia, setDataVisualizada } from "./telas/tarefas.js";

// Estado global (carregado do localStorage)
const estado = carregar();

// Expõe no window para debug no console (ex.: estado.tarefas)
window.estado = estado;

// Referência à tela atual: "inicio" | "tarefas"
let telaAtual = "inicio";

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  mostrarInicio();
});

/** Mostra a tela inicial (calendário + painel lateral) */
export function mostrarInicio() {
  telaAtual = "inicio";
  desenharInicio(estado, (dataISO) => {
    // Callback quando clica num dia no calendário
    mostrarTarefas(dataISO);
  });
  atualizarCabecalho();
}

/** Mostra a tela de tarefas de um dia específico */
export function mostrarTarefas(dataISO) {
  telaAtual = "tarefas";
  setDataVisualizada(dataISO);
  desenharTarefasDoDia(estado);
  atualizarCabecalho();
}

/** Atualiza o cabeçalho (titulo + botão Home/Volta) */
function atualizarCabecalho() {
  const cabecalho = document.querySelector(".cabecalho");
  if (!cabecalho) return;

  // Remove botão Home antigo se houver
  const antigo = cabecalho.querySelector(".botao-home");
  if (antigo) antigo.remove();

  if (telaAtual === "tarefas") {
    const botaoHome = document.createElement("button");
    botaoHome.type = "button";
    botaoHome.className = "botao-icone botao-home";
    botaoHome.setAttribute("aria-label", "Voltar ao calendário");
    botaoHome.textContent = "⌂";
    botaoHome.style.marginLeft = "auto";
    botaoHome.addEventListener("click", mostrarInicio);
    cabecalho.appendChild(botaoHome);
  }
}

/** Função auxiliar para outras telas chamarem quando salvam algo */
export function notificarMudanca() {
  if (telaAtual === "inicio") {
    atualizarHome(estado);
  } else {
    desenharTarefasDoDia(estado);
  }
}