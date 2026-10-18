// Exportar / Importar estado completo do painel (JSON).
// Usa o schemaVersion para validar compatibilidade.

import { salvar } from "./armazenamento.js";
import { notificarMudanca } from "../app.js";

const VERSAO_ESQUEMA_ATUAL = 1;

/**
 * Exporta o estado atual como arquivo JSON para download.
 * @param {Object} estado - estado global do app
 * @returns {Promise<void>}
 */
export async function exportarEstado(estado) {
  const json = JSON.stringify(estado, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const hoje = new Date();
  const dataStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
  const nomeArquivo = `painel-backup-${dataStr}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Libera o object URL após um breve delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Importa estado a partir de um arquivo JSON.
 * Valida schemaVersion e estrutura mínima.
 * @param {File} arquivo - arquivo .json selecionado pelo usuário
 * @param {Object} estadoAtual - referência ao estado global (será mutado)
 * @returns {Promise<{sucesso: boolean, mensagem: string}>}
 */
export async function importarEstado(arquivo, estadoAtual) {
  return new Promise((resolve) => {
    if (!arquivo) {
      resolve({ sucesso: false, mensagem: "Nenhum arquivo selecionado." });
      return;
    }
    if (!arquivo.name.toLowerCase().endsWith(".json")) {
      resolve({ sucesso: false, mensagem: "O arquivo deve ser .json" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importado = JSON.parse(e.target.result);

        // Validações básicas
        if (!importado || typeof importado !== "object") {
          resolve({ sucesso: false, mensagem: "JSON inválido: raiz não é objeto." });
          return;
        }
        if (importado.schemaVersion !== VERSAO_ESQUEMA_ATUAL) {
          resolve({ sucesso: false, mensagem: `Versão de esquema incompatível (esperado ${VERSAO_ESQUEMA_ATUAL}, encontrado ${importado.schemaVersion}).` });
          return;
        }
        const camposObrigatorios = ["config", "tarefas", "metas", "lancamentos", "contasFixas", "pagamentos"];
        for (const c of camposObrigatorios) {
          if (!Array.isArray(importado[c]) && c !== "config") {
            resolve({ sucesso: false, mensagem: `Campo obrigatório ausente ou inválido: ${c}` });
            return;
          }
        }
        if (!importado.config || !Array.isArray(importado.config.categoriasTarefas) || !Array.isArray(importado.config.categoriasFinancas)) {
          resolve({ sucesso: false, mensagem: "Config inválido." });
          return;
        }

        // Confirmação (chama callback de confirmação se fornecido, senão assume true)
        // A UI chama esta função e mostra o confirm nativo antes.
        // Aqui apenas aplicamos.

        // Mutação do estado atual (mantém a referência para não quebrar imports)
        Object.keys(estadoAtual).forEach(k => delete estadoAtual[k]);
        Object.assign(estadoAtual, importado);

        salvar(estadoAtual);
        notificarMudanca();

        resolve({ sucesso: true, mensagem: "Dados importados com sucesso!" });
      } catch (err) {
        resolve({ sucesso: false, mensagem: `Erro ao ler JSON: ${err.message}` });
      }
    };
    reader.onerror = () => resolve({ sucesso: false, mensagem: "Erro ao ler arquivo." });
    reader.readAsText(arquivo, "utf-8");
  });
}

/**
 * Cria um input[type=file] oculto e abre o seletor.
 * @returns {Promise<File|null>} arquivo selecionado ou null se cancelado
 */
export function abrirSeletorArquivo() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    input.addEventListener("change", () => {
      resolve(input.files[0] || null);
      document.body.removeChild(input);
    });
    input.addEventListener("cancel", () => {
      resolve(null);
      document.body.removeChild(input);
    });
    document.body.appendChild(input);
    input.click();
  });
}