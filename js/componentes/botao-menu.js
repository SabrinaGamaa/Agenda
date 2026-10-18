// Componente: Botão de menu no cabeçalho (Exportar / Importar / Sobre).
// Dropdown acessível, fica escondido por padrão (attribute hidden) e aparece ao clicar.

export function criarBotaoMenu() {
  const container = document.createElement("div");
  container.className = "menu-cabecalho";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-icone";
  botao.setAttribute("aria-label", "Menu");
  botao.setAttribute("aria-haspopup", "true");
  botao.setAttribute("aria-expanded", "false");
  botao.textContent = "⋮";
  botao.title = "Menu";

  const dropdown = document.createElement("div");
  dropdown.className = "menu-dropdown";
  dropdown.setAttribute("role", "menu");
  dropdown.hidden = true; // Escondido por padrão
  dropdown.style.cssText = `
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 180px;
    background: var(--bg-elevado);
    border: 1px solid var(--borda);
    border-radius: var(--raio);
    box-shadow: var(--sombra);
    padding: var(--espaco-pequeno);
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 100;
    width: 180px;
  `;

  const opcoes = [
    { label: "Exportar JSON", icone: "⬇", acao: "exportar" },
    { label: "Importar JSON", icone: "⬆", acao: "importar" },
    { type: "separator" },
    { label: "Sobre", icone: "ℹ", acao: "sobre" }
  ];

  for (const op of opcoes) {
    if (op.type === "separator") {
      const hr = document.createElement("hr");
      hr.style.cssText = "border: none; border-top: 1px solid var(--borda); margin: 4px 0;";
      dropdown.appendChild(hr);
      continue;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("role", "menuitem");
    btn.style.cssText = `
      display: flex; align-items: center; gap: var(--espaco-pequeno);
      width: 100%; padding: 8px 12px;
      background: transparent; border: none; border-radius: var(--raio-pequeno);
      color: var(--texto); font: inherit; font-size: 0.9rem; text-align: left;
      cursor: pointer;
    `;
    btn.innerHTML = `<span>${op.icone}</span> <span>${op.label}</span>`;
    btn.addEventListener("click", () => {
      dropdown.hidden = true;
      botao.setAttribute("aria-expanded", "false");
      container.dispatchEvent(new CustomEvent("menu-acao", { detail: { acao: op.acao }, bubbles: true }));
    });
    btn.addEventListener("mouseenter", () => btn.style.background = "var(--bg-hover)");
    btn.addEventListener("mouseleave", () => btn.style.background = "transparent");
    dropdown.appendChild(btn);
  }

  container.appendChild(botao);
  container.appendChild(dropdown);

  let aberto = false;

  function toggle() {
    aberto = !aberto;
    dropdown.hidden = !aberto; // <-- esconde/mostra via attribute
    botao.setAttribute("aria-expanded", aberto);
    if (aberto) {
      // Fecha ao clicar fora
      const fecharFora = (e) => {
        if (!container.contains(e.target)) {
          fechar();
          document.removeEventListener("click", fecharFora);
        }
      };
      // pequeno delay para o click registrar antes do listener de fora
      setTimeout(() => document.addEventListener("click", fecharFora), 0);
      // Fecha com Esc
      const fecharEsc = (e) => {
        if (e.key === "Escape") {
          fechar();
          document.removeEventListener("keydown", fecharEsc);
        }
      };
      document.addEventListener("keydown", fecharEsc);
    }
  }

  function fechar() {
    if (aberto) {
      aberto = false;
      dropdown.hidden = true;
      botao.setAttribute("aria-expanded", "false");
    }
  }

  botao.addEventListener("click", toggle);

  return container;
}