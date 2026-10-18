// Tela de tarefas: formulário de criação + lista do dia com ações
// (concluir/reabrir, editar e excluir).

import { hojeISO, formatarData, formatarDataLonga, somarMinutos, formatarDuracao } from "../regras/datas.js";
import {
  criarTarefa,
  tarefasDoDia,
  estaConcluida,
  alternarConclusao,
  atualizarTarefa,
  excluirTarefa
} from "../regras/tarefas.js";
import { criarFormularioTarefa } from "../componentes/formulario-tarefa.js";
import { abrirModal } from "../componentes/modal.js";
import { salvar } from "../dados/armazenamento.js";

export function desenharTarefasDoDia(estado, mensagem = null) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = ""; // redesenho simples: limpa tudo e monta de novo a partir do estado

  conteudo.appendChild(criarCartaoDeNovaTarefa(estado));
  conteudo.appendChild(criarCartaoDaLista(estado, mensagem));
}

function criarCartaoDeNovaTarefa(estado) {
  const cartao = document.createElement("section");
  cartao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = "Nova tarefa";
  cartao.appendChild(titulo);

  const formulario = criarFormularioTarefa({
    categorias: estado.config.categoriasTarefas,
    aoSalvar: (campos) => {
      const tarefa = criarTarefa(campos);
      estado.tarefas.push(tarefa);
      salvar(estado);
      console.log("Tarefa criada:", tarefa);

      // Se a tarefa não for de hoje, avisamos por que ela não aparece na lista.
      const mensagem =
        tarefa.data === hojeISO()
          ? "Tarefa adicionada!"
          : `Tarefa salva para ${formatarData(tarefa.data)} — ela não aparece na lista de hoje.`;
      desenharTarefasDoDia(estado, mensagem);
    }
  });

  cartao.appendChild(formulario);
  return cartao;
}

function criarCartaoDaLista(estado, mensagem) {
  const dataDeHoje = hojeISO();
  const tarefasDeHoje = tarefasDoDia(estado, dataDeHoje);

  const cartao = document.createElement("section");
  cartao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = "Tarefas de hoje";

  const subtitulo = document.createElement("p");
  subtitulo.className = "subtitulo";
  subtitulo.textContent = formatarDataLonga(dataDeHoje);

  cartao.appendChild(titulo);
  cartao.appendChild(subtitulo);

  if (mensagem) {
    const sucesso = document.createElement("p");
    sucesso.className = "mensagem-sucesso";
    sucesso.textContent = mensagem;
    cartao.appendChild(sucesso);
  }

  if (tarefasDeHoje.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "estado-vazio";
    vazio.textContent = "Nenhuma tarefa para hoje. Crie uma no formulário acima.";
    cartao.appendChild(vazio);
  } else {
    const lista = document.createElement("ul");
    lista.className = "lista-tarefas";
    for (const tarefa of tarefasDeHoje) {
      lista.appendChild(criarItemTarefa(estado, tarefa, dataDeHoje));
    }
    cartao.appendChild(lista);
  }

  const aviso = document.createElement("p");
  aviso.className = "aviso-desenvolvimento";
  aviso.textContent = "Versão em desenvolvimento: navegação entre dias e ordenação chegam no próximo passo.";
  cartao.appendChild(aviso);

  return cartao;
}

function criarItemTarefa(estado, tarefa, dataISO) {
  const concluida = estaConcluida(tarefa, dataISO);
  const { horaFinal, diaSeguinte } = somarMinutos(tarefa.horaInicio, tarefa.duracaoMinutos);

  const item = document.createElement("li");
  item.className = `tarefa prioridade-${tarefa.prioridade}${concluida ? " concluida" : ""}`;

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

  // Ações da tarefa
  const acoes = document.createElement("div");
  acoes.className = "tarefa-acoes";

  acoes.appendChild(
    criarBotaoAcao(concluida ? "Reabrir" : "Concluir", null, () => {
      alternarConclusao(estado, tarefa.id, dataISO);
      salvar(estado);
      desenharTarefasDoDia(estado, concluida ? "Tarefa reaberta!" : "Tarefa concluída!");
    })
  );

  acoes.appendChild(
    criarBotaoAcao("Editar", null, () => {
      abrirEdicaoDeTarefa(estado, tarefa);
    })
  );

  acoes.appendChild(
    criarBotaoAcao("Excluir", "botao-acao-perigo", () => {
      confirmarExclusaoDeTarefa(estado, tarefa);
    })
  );

  item.appendChild(esquerda);
  item.appendChild(corpo);
  item.appendChild(acoes);
  return item;
}

// Abre a janela de edição, com o formulário preenchido com os dados atuais.
function abrirEdicaoDeTarefa(estado, tarefa) {
  const formulario = criarFormularioTarefa({
    categorias: estado.config.categoriasTarefas,
    valoresIniciais: tarefa,
    rotuloBotao: "Salvar alterações",
    aoSalvar: (campos) => {
      atualizarTarefa(estado, tarefa.id, campos);
      salvar(estado);
      modal.close();
      desenharTarefasDoDia(estado, "Tarefa atualizada!");
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({ titulo: "Editar tarefa", conteudo: formulario });
}

// Pede confirmação antes de excluir de vez.
function confirmarExclusaoDeTarefa(estado, tarefa) {
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent = `Excluir a tarefa “${tarefa.titulo}”? Esta ação não pode ser desfeita.`;

  const grupo = document.createElement("div");
  grupo.className = "grupo-botoes";

  const cancelar = document.createElement("button");
  cancelar.type = "button";
  cancelar.className = "botao-secundario";
  cancelar.textContent = "Cancelar";
  cancelar.addEventListener("click", () => modal.close());

  const excluir = document.createElement("button");
  excluir.type = "button";
  excluir.className = "botao-principal-perigo";
  excluir.textContent = "Excluir";
  excluir.addEventListener("click", () => {
    excluirTarefa(estado, tarefa.id);
    salvar(estado);
    modal.close();
    desenharTarefasDoDia(estado, "Tarefa excluída.");
  });

  grupo.appendChild(cancelar);
  grupo.appendChild(excluir);
  conteudo.appendChild(texto);
  conteudo.appendChild(grupo);

  const modal = abrirModal({ titulo: "Excluir tarefa", conteudo });
}

// Botão pequeno das ações de cada tarefa.
function criarBotaoAcao(texto, classeExtra, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classeExtra ? `botao-acao ${classeExtra}` : "botao-acao";
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}
