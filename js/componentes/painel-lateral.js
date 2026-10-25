// Componente: Painel lateral (ranking / resumo) — lado direito do calendário.
// Mostra: top categorias e resumo da semana.
// Os próximos prazos ficaram no painel principal, no topo do Home.
// Colapsa embaixo no mobile (CSS grid cuida via @media).

import { hojeISO, somarDias } from "../regras/datas.js";
import { ocorrenciasDoDia, estaConcluida } from "../regras/tarefas.js";

/**
 * Cria o painel lateral completo.
 * @param {Object} estado - estado global
 * @returns {HTMLElement} aside.painel-lateral
 */
export function criarPainelLateral(estado) {
  const aside = document.createElement("aside");
  aside.className = "painel-lateral";
  aside.setAttribute("aria-label", "Resumo e ranking");

  aside.appendChild(criarCardTopCategorias(estado));
  aside.appendChild(criarCardResumoSemana(estado));

  // Guarda referência para updates
  aside.atualizar = () => {
    aside.innerHTML = "";
    aside.appendChild(criarCardTopCategorias(estado));
    aside.appendChild(criarCardResumoSemana(estado));
  };

  return aside;
}

/**
 * Card: Top 3 categorias com mais tarefas pendentes (próximos 30 dias).
 */
function criarCardTopCategorias(estado) {
  const card = document.createElement("section");
  card.className = "painel-card";

  const h3 = document.createElement("h3");
  h3.textContent = "Top categorias";
  card.appendChild(h3);

  const lista = document.createElement("ul");
  lista.className = "painel-lista";

  // Conta tarefas pendentes por categoria (próximos 30 dias)
  const hoje = hojeISO();
  const contagem = {};
  for (let i = 0; i < 30; i++) {
    const data = somarDias(hoje, i);
    const tarefasDia = ocorrenciasDoDia(estado, data);
    for (const t of tarefasDia) {
      if (!estaConcluida(t, data)) {
        contagem[t.categoria] = (contagem[t.categoria] || 0) + 1;
      }
    }
  }

  const top = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (top.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "painel-item";
    vazio.style.justifyContent = "center";
    vazio.style.color = "var(--texto-fraco)";
    vazio.style.fontSize = "0.85rem";
    vazio.textContent = "Nenhuma tarefa agendada";
    lista.appendChild(vazio);
  } else {
    for (const [cat, qtd] of top) {
      lista.appendChild(criarItemCategoria(cat, qtd));
    }
  }

  card.appendChild(lista);
  return card;
}

function criarItemCategoria(categoria, qtd) {
  const li = document.createElement("li");
  li.className = "painel-item";

  const icone = document.createElement("span");
  icone.className = "painel-item-icone";
  icone.textContent = iconePorCategoria(categoria);
  // Cor baseada na prioridade mais comum dessa categoria? Simplifica: usa acento
  icone.style.background = "var(--acento-suave)";
  icone.style.color = "var(--acento)";

  const conteudo = document.createElement("div");
  conteudo.className = "painel-item-conteudo";

  const titulo = document.createElement("div");
  titulo.className = "painel-item-titulo";
  titulo.textContent = categoria;

  const meta = document.createElement("div");
  meta.className = "painel-item-meta";
  meta.textContent = `${qtd} pendente${qtd !== 1 ? "s" : ""}`;

  conteudo.appendChild(titulo);
  conteudo.appendChild(meta);
  li.appendChild(icone);
  li.appendChild(conteudo);

  return li;
}

/**
 * Card: Resumo da semana (concluídas vs pendentes nos últimos 7 dias).
 */
function criarCardResumoSemana(estado) {
  const card = document.createElement("section");
  card.className = "painel-card";

  const h3 = document.createElement("h3");
  h3.textContent = "Semana";
  card.appendChild(h3);

  const lista = document.createElement("ul");
  lista.className = "painel-lista";

  const hoje = hojeISO();
  let concluidas = 0;
  let pendentes = 0;

  // Últimos 7 dias (incluindo hoje)
  for (let i = -6; i <= 0; i++) {
    const data = somarDias(hoje, i);
    const tarefasDia = ocorrenciasDoDia(estado, data);
    for (const t of tarefasDia) {
      if (estaConcluida(t, data)) concluidas++;
      else pendentes++;
    }
  }

  const total = concluidas + pendentes;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const itemConcluidas = document.createElement("li");
  itemConcluidas.className = "painel-item";
  itemConcluidas.innerHTML = `
    <span class="painel-item-icone" style="background: rgba(47,133,90,.15); color: #4ade80;">✅</span>
    <div class="painel-item-conteudo">
      <div class="painel-item-titulo">Concluídas</div>
      <div class="painel-item-meta">${concluidas} de ${total} (${pct}%)</div>
    </div>
  `;

  const itemPendentes = document.createElement("li");
  itemPendentes.className = "painel-item";
  itemPendentes.innerHTML = `
    <span class="painel-item-icone" style="background: var(--acento-suave); color: var(--acento);">⏳</span>
    <div class="painel-item-conteudo">
      <div class="painel-item-titulo">Pendentes</div>
      <div class="painel-item-meta">${pendentes} restante${pendentes !== 1 ? "s" : ""}</div>
    </div>
  `;

  lista.appendChild(itemConcluidas);
  lista.appendChild(itemPendentes);
  card.appendChild(lista);

  return card;
}

/* ===== Helpers de UI ===== */

function iconePorCategoria(categoria) {
  const mapa = {
    "Trabalho": "💼",
    "Pessoal": "🏠",
    "Estudos": "📚",
    "Saúde": "💊",
    "Finanças": "💰",
    "Lazer": "🎮",
    "Outros": "📦"
  };
  return mapa[categoria] || "📁";
}