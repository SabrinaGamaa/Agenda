// Tela de tarefas: desenha a lista do dia a partir do estado.
// Por enquanto é somente leitura; criação, edição e exclusão chegam nos próximos passos.

import { hojeISO, formatarDataLonga, somarMinutos, formatarDuracao } from "../regras/datas.js";

export function desenharTarefasDoDia(estado) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = ""; // redesenho simples: limpa tudo e monta de novo a partir do estado

  const dataDeHoje = hojeISO();
  const tarefasDoDia = estado.tarefas.filter((tarefa) => tarefa.data === dataDeHoje);

  const secao = document.createElement("section");
  secao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = "Tarefas de hoje";

  const subtitulo = document.createElement("p");
  subtitulo.className = "subtitulo";
  subtitulo.textContent = formatarDataLonga(dataDeHoje);

  secao.appendChild(titulo);
  secao.appendChild(subtitulo);

  if (tarefasDoDia.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "estado-vazio";
    vazio.textContent = "Nenhuma tarefa para hoje. A criação de tarefas chega no próximo passo.";
    secao.appendChild(vazio);
  } else {
    const lista = document.createElement("ul");
    lista.className = "lista-tarefas";
    for (const tarefa of tarefasDoDia) {
      lista.appendChild(criarItemTarefa(tarefa));
    }
    secao.appendChild(lista);
  }

  const aviso = document.createElement("p");
  aviso.className = "aviso-desenvolvimento";
  aviso.textContent = "Versão em desenvolvimento: por enquanto a lista é somente leitura.";
  secao.appendChild(aviso);

  conteudo.appendChild(secao);
}

function criarItemTarefa(tarefa) {
  const { horaFinal, diaSeguinte } = somarMinutos(tarefa.horaInicio, tarefa.duracaoMinutos);

  const item = document.createElement("li");
  item.className = `tarefa prioridade-${tarefa.prioridade}`;

  const esquerda = document.createElement("div");
  esquerda.className = "tarefa-esquerda";

  const horario = document.createElement("span");
  horario.className = "tarefa-horario";
  horario.textContent = `${tarefa.horaInicio}–${horaFinal}${diaSeguinte ? " (dia seguinte)" : ""}`;

  const selo = document.createElement("span");
  selo.className = "selo selo-prioridade";
  selo.textContent = `prioridade ${tarefa.prioridade}`;

  esquerda.appendChild(horario);
  esquerda.appendChild(selo);

  const corpo = document.createElement("div");
  corpo.className = "tarefa-corpo";

  const tituloTarefa = document.createElement("span");
  tituloTarefa.className = "tarefa-titulo";
  tituloTarefa.textContent = tarefa.titulo;
  corpo.appendChild(tituloTarefa);

  const detalhes = document.createElement("span");
  detalhes.className = "tarefa-detalhes";
  const partes = [tarefa.categoria, formatarDuracao(tarefa.duracaoMinutos)];
  if (tarefa.descricao) {
    partes.push(tarefa.descricao);
  }
  detalhes.textContent = partes.join(" · ");
  corpo.appendChild(detalhes);

  item.appendChild(esquerda);
  item.appendChild(corpo);
  return item;
}
