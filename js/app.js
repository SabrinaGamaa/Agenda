// Entry point do Meu Painel Pessoal.
// Inicia no Home (calendário + painel lateral).
// Clicar num dia no calendário → mostra a tela de tarefas daquele dia.
// A tela de tarefas tem botão "Home" no cabeçalho para voltar.
// Menu no cabeçalho: Exportar / Importar / Sobre.

import { carregar, salvar } from "./dados/armazenamento.js";
import { exportarEstado, importarEstado, abrirSeletorArquivo } from "./dados/exportar-importar.js";
import { desenharInicio, atualizarHome, marcarDiaVisualizadoNoCalendario } from "./telas/inicio.js";
import { desenharTarefasDoDia, setDataVisualizada } from "./telas/tarefas.js";
import { criarBotaoMenu } from "./componentes/botao-menu.js";

// Estado global (carregado do localStorage)
const estado = carregar();

// Expõe no window para debug no console (ex.: estado.tarefas)
window.estado = estado;

// Referência à tela atual: "inicio" | "tarefas"
let telaAtual = "inicio";

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  inicializarMenu();
  mostrarInicio();
});

/** Inicializa o botão de menu no cabeçalho */
function inicializarMenu() {
  const cabecalho = document.querySelector(".cabecalho");
  if (!cabecalho) {
    // Header ainda não adicionado ao DOM; tenta novamente em seguida.
    setTimeout(inicializarMenu, 100);
    return;
  }

  const menu = criarBotaoMenu();
  const subtitulo = cabecalho.querySelector(".cabecalho-subtitulo");
  if (subtitulo) {
    cabecalho.insertBefore(menu, subtitulo.nextSibling);
  } else {
    cabecalho.appendChild(menu);
  }

  // Escuta ações do menu
  menu.addEventListener("menu-acao", (e) => {
    const { acao } = e.detail;
    if (acao === "exportar") {
      exportarEstado(estado).then(() => {
        // Exportação assíncrona - aviso opcional
      });
    } else if (acao === "importar") {
      handleImportar();
    } else if (acao === "sobre") {
      mostrarSobre();
    }
  });
}

/** Manipula importação de arquivo JSON */
async function handleImportar() {
  const arquivo = await abrirSeletorArquivo();
  if (!arquivo) return; // usuário cancelou

  // Confirmação nativa antes de sobrescrever
  const confirmar = confirm(
    "Importar vai substituir TODOS os dados atuais (tarefas, metas, finanças).\n" +
    "Tem certeza? Esta ação não pode ser desfeita."
  );
  if (!confirmar) return;

  const resultado = await importarEstado(arquivo, estado);
  if (resultado.sucesso) {
    alert(resultado.mensagem);
    notificarMudanca();
  } else {
    alert("Erro ao importar: " + resultado.mensagem);
  }
}

/** Mostra modal "Sobre" */
function mostrarSobre() {
  const modal = document.createElement("dialog");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-topo">
      <h2>Meu Painel Pessoal</h2>
      <button class="modal-fechar" aria-label="Fechar">×</button>
    </div>
    <p class="modal-texto">
      <strong>Versão:</strong> Fase 1 completa<br>
      <strong>Stack:</strong> HTML + CSS + JavaScript (ES Modules)<br>
      <strong>Armazenamento:</strong> localStorage<br>
      <strong>Tema:</strong> Escuro, minimalista, fonte Inter<br>
      <br>
      Organizador pessoal com agenda, metas e finanças.
      Feito como projeto de aprendizagem.
    </p>
    <div class="grupo-botoes">
      <button type="button" class="botao-principal" id="btn-fechar-sobre">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.showModal();
  modal.querySelector(".modal-fechar").addEventListener("click", () => modal.close());
  modal.querySelector("#btn-fechar-sobre").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", () => modal.remove());
}

/** Mostra a tela inicial (calendário + painel lateral) */
export function mostrarInicio() {
  telaAtual = "inicio";
  // Garante que o header reflita o estado inicial
  fixarBotaoHome();
  desenharInicio(estado, (dataISO) => {
    mostrarTarefas(dataISO);
  });
  atualizarCabecalho();
}

/** Mostra a tela de tarefas de um dia específico */
export function mostrarTarefas(dataISO) {
  telaAtual = "tarefas";
  setDataVisualizada(dataISO);
  desenharTarefasDoDia(estado);
  fixarBotaoHome();
  atualizarCabecalho();
}

/** Garante que o botão "Home" apareça na tela de tarefas */
function fixarBotaoHome() {
  const cabecalho = document.querySelector(".cabecalho");
  if (!cabecalho) return;

  // Remove qualquer botão Home anterior
  const antigo = cabecalho.querySelector(".botao-home");
  if (antigo) {
    antigo.remove();
  }

  // Adiciona o botão Home apenas quando estamos na tarefa
  if (telaAtual === "tarefas") {
    const botaoHome = document.createElement("button");
    botaoHome.type = "button";
    botaoHome.className = "botao-icone botao-home";
    botaoHome.setAttribute("aria-label", "Voltar ao calendário");
    botaoHome.textContent = "⌂";
    botaoHome.style.marginLeft = "auto";
    botaoHome.addEventListener("click", mostrarInicio);
    cabecalho.appendChild(botaoHome);
  } else {
    // Na home, não mostra o botão Home
    const homeBtn = cabecalho.querySelector(".botao-home");
    if (homeBtn) homeBtn.remove();
  }
}

/** Atualiza o cabeçalho (título + botão Home/Volta + menu) */
function atualizarCabecalho() {
  const cabecalho = document.querySelector(".cabecalho");
  if (!cabecalho) return;

  // Recria o botão Home caso tenha sido removido ou perdido
  fixarBotaoHome();

  // O menu (Exportar/Importar) já fica gerenciado por inicializarMenu()
  // Não fazemos nada adicional aqui para não duplicar esforço.
}

/** Função auxiliar para outras telas chamarem quando salvam algo */
export function notificarMudanca() {
  if (telaAtual === "inicio") {
    atualizarHome(estado);
  } else {
    desenharTarefasDoDia(estado);
  }
}