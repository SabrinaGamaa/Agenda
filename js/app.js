// Ponto de entrada do aplicativo "Meu Painel Pessoal".
// Fase 0: apenas confirma que a página, o CSS e os módulos ES estão funcionando.

console.log("Meu Painel Pessoal: aplicativo iniciado.");

const conteudo = document.getElementById("conteudo");

const aviso = document.createElement("p");
aviso.className = "status-js";
aviso.textContent = "JavaScript carregado e módulos ES funcionando.";
conteudo.appendChild(aviso);
