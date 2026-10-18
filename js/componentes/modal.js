// Componente reutilizável: janela modal construída com o elemento nativo <dialog>.
// O navegador cuida de centralizar, escurecer o fundo e fechar com a tecla Esc.

export function abrirModal({ titulo, conteudo }) {
  // Garante que só exista uma janela aberta por vez.
  const modalAnterior = document.querySelector("dialog.modal");
  if (modalAnterior) {
    modalAnterior.remove();
  }

  const modal = document.createElement("dialog");
  modal.className = "modal";

  const topo = document.createElement("div");
  topo.className = "modal-topo";

  const tituloElemento = document.createElement("h2");
  tituloElemento.textContent = titulo;

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "modal-fechar";
  fechar.textContent = "×";
  fechar.setAttribute("aria-label", "Fechar");
  fechar.addEventListener("click", () => modal.close());

  topo.appendChild(tituloElemento);
  topo.appendChild(fechar);

  modal.appendChild(topo);
  modal.appendChild(conteudo);

  // Clicar fora da janela (no fundo escurecido) também fecha.
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
      modal.close();
    }
  });

  // Ao fechar de qualquer forma, removemos o elemento da página.
  modal.addEventListener("close", () => modal.remove());

  document.body.appendChild(modal);
  modal.showModal();
  return modal;
}
