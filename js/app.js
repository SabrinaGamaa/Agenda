// Ponto de entrada do aplicativo "Meu Painel Pessoal".
// Fluxo geral do sistema: carregar os dados -> desenhar a tela a partir deles.

import { carregar } from "./dados/armazenamento.js";
import { desenharTarefasDoDia } from "./telas/tarefas.js";

const estado = carregar();
console.log("Meu Painel Pessoal: aplicativo iniciado. Dados carregados:", estado);

// Exposto de propósito para você poder explorar no console do navegador.
// Experimente digitar: estado.tarefas   ou   JSON.stringify(estado, null, 2)
window.estado = estado;

desenharTarefasDoDia(estado);
