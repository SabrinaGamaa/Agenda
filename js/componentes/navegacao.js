// Componente: navegação principal entre Agenda e Metas.
// São botões (não links) porque a troca de tela acontece em memória, sem recarregar.
// O visual é parecido com o alternador Mês | Semana, para manter a consistência.

const ABAS = [
  { id: "agenda", rotulo: "Agenda" },
  { id: "metas", rotulo: "Metas" }
];

export function criarNavegacao({ abaAtual = "agenda", aoMudar = null } = {}) {
  const nav = document.createElement("nav");
  nav.className = "navegacao-principal";

  const botoes = new Map();
  let atual = abaAtual;

  function atualizar(novaAba = atual) {
    atual = novaAba;

    for (const [id, botao] of botoes) {
      const ativo = id === atual;
      botao.classList.toggle("ativo", ativo);

      if (ativo) {
        botao.setAttribute("aria-current", "page");
      } else {
        botao.removeAttribute("aria-current");
      }
    }
  }

  for (const { id, rotulo } of ABAS) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "navegacao-botao";
    botao.dataset.aba = id;
    botao.textContent = rotulo;

    botao.addEventListener("click", () => {
      atualizar(id);
      if (aoMudar) aoMudar(id);
    });

    botoes.set(id, botao);
    nav.appendChild(botao);
  }

  // O app.js chama nav.atualizar("metas") quando muda de tela.
  nav.atualizar = atualizar;
  atualizar();

  return nav;
}
