// Tela de tarefas: formulário de criação + lista de um dia, com ações
// (concluir/reabrir, editar, excluir) e navegação entre dias.
// Tema escuro: botões só ícones, linha fina de prioridade, concluídas com opacity.

import { hojeISO, somarDias, formatarData, formatarDataLonga, somarMinutos, formatarDuracao } from "../regras/datas.js";
import {
  criarTarefa,
  tarefasDoDia,
  ordenarTarefasDoDia,
  estaConcluida,
  alternarConclusao,
  atualizarTarefa,
  excluirTarefa
} from "../regras/tarefas.js";
import { criarFormularioTarefa } from "../componentes/formulario-tarefa.js";
import { abrirModal } from "../componentes/modal.js";
import { criarBarraFiltros } from "../componentes/barra-filtros.js";
import { filtrarTarefas, temFiltroAtivo } from "../regras/filtros.js";
import { salvar } from "../dados/armazenamento.js";
import { atualizarHome, marcarDiaVisualizadoNoCalendario } from "./inicio.js";

// Dia que está sendo exibido na lista. Começa em hoje e só muda pelos
// botões de navegação. Não é salvo: ao recarregar a página, voltamos para hoje.
let dataVisualizada = hojeISO();

/** Define o dia a ser exibido (usado pelo app.js ao vir do calendário) */
export function setDataVisualizada(dataISO) {
  dataVisualizada = dataISO;
}

export function desenharTarefasDoDia(estado, mensagem = null) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = ""; // redesenho simples: limpa tudo e monta de novo a partir do estado

  conteudo.appendChild(criarCartaoDeNovaTarefa(estado));
  conteudo.appendChild(criarCartaoDaLista(estado, mensagem));

  // Atualiza o calendário na home (bolinhas + dia visualizado)
  atualizarHome(estado);
  marcarDiaVisualizadoNoCalendario(dataVisualizada);
}

function criarCartaoDeNovaTarefa(estado) {
  const cartao = document.createElement("section");
  cartao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = "Nova tarefa";
  cartao.appendChild(titulo);

  const formulario = criarFormularioTarefa({
    categorias: estado.config.categoriasTarefas,
    dataPadrao: dataVisualizada, // sugere a data do dia que está na tela
    aoSalvar: (campos) => {
      const tarefa = criarTarefa(campos);
      estado.tarefas.push(tarefa);
      salvar(estado);
      console.log("Tarefa criada:", tarefa);

      // Se a tarefa não for do dia que está na tela, avisamos por que ela não aparece.
      const mensagem =
        tarefa.data === dataVisualizada
          ? "Tarefa adicionada!"
          : `Tarefa salva para ${formatarData(tarefa.data)} — navegue até esse dia para vê-la.`;
      desenharTarefasDoDia(estado, mensagem);
    }
  });

  cartao.appendChild(formulario);
  return cartao;
}

function criarCartaoDaLista(estado, mensagem) {
  const ehHoje = dataVisualizada === hojeISO();

  const cartao = document.createElement("section");
  cartao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = ehHoje ? "Tarefas de hoje" : "Tarefas do dia";

  cartao.appendChild(titulo);
  cartao.appendChild(criarBarraDeNavegacao(estado));
  cartao.appendChild(criarBarraFiltros({
    categorias: estado.config.categoriasTarefas,
    aoMudar: () => desenharTarefasDoDia(estado)
  }));

  if (mensagem) {
    const sucesso = document.createElement("p");
    sucesso.className = "mensagem-sucesso";
    sucesso.textContent = mensagem;
    cartao.appendChild(sucesso);
  }

  // Aplica os filtros ativos e ordena: pendentes primeiro (mais cedo primeiro),
  // concluídas no fim.
  const tarefasFiltradas = filtrarTarefas(tarefasDoDia(estado, dataVisualizada), dataVisualizada);
  const tarefasOrdenadas = ordenarTarefasDoDia(tarefasFiltradas, dataVisualizada);

  if (tarefasOrdenadas.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "estado-vazio";
    if (temFiltroAtivo()) {
      vazio.textContent = "Nenhuma tarefa neste dia com os filtros atuais.";
    } else {
      vazio.textContent = ehHoje
        ? "Nenhuma tarefa para hoje. Crie uma no formulário acima."
        : "Nenhuma tarefa neste dia.";
    }
    cartao.appendChild(vazio);
  } else {
    const lista = document.createElement("ul");
    lista.className = "lista-tarefas";
    for (const tarefa of tarefasOrdenadas) {
      lista.appendChild(criarItemTarefa(estado, tarefa, dataVisualizada));
    }
    cartao.appendChild(lista);
  }

  return cartao;
}

// Barra de navegação: ‹ anterior · data por extenso · próximo › (+ botão Hoje).
function criarBarraDeNavegacao(estado) {
  const barra = document.createElement("div");
  barra.className = "navegacao-dias";

  const anterior = criarBotaoNavegacao("‹", "Dia anterior", () => {
    irParaDia(estado, somarDias(dataVisualizada, -1));
  });

  const rotulo = document.createElement("span");
  rotulo.className = "navegacao-rotulo";
  rotulo.textContent = formatarDataLonga(dataVisualizada);

  const proximo = criarBotaoNavegacao("›", "Próximo dia", () => {
    irParaDia(estado, somarDias(dataVisualizada, 1));
  });

  barra.appendChild(anterior);
  barra.appendChild(rotulo);
  barra.appendChild(proximo);

  // Atalho para voltar a hoje, que só aparece quando não estamos nele.
  if (!ehHojeVisualizado()) {
    barra.appendChild(
      criarBotaoNavegacao("⌂", "Ir para hoje", () => {
        irParaDia(estado, hojeISO());
      }, true)
    );
  }

  return barra;
}

function ehHojeVisualizado() {
  return dataVisualizada === hojeISO();
}

// Troca o dia exibido e redesenha a lista.
function irParaDia(estado, dataISO) {
  dataVisualizada = dataISO;
  desenharTarefasDoDia(estado);
}

function criarBotaoNavegacao(texto, ariaLabel, aoClicar, destaque = false) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `botao-icone${destaque ? " botao-icone-destaque" : ""}`;
  botao.setAttribute("aria-label", ariaLabel);
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
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

  esquerda.appendChild(horario);

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

  // Ações da tarefa: só ícones com tooltip (aria-label)
  const acoes = document.createElement("div");
  acoes.className = "tarefa-acoes";

  acoes.appendChild(
    criarBotaoAcao(
      concluida ? "reabrir" : "concluir",
      concluida ? "Reabrir" : "Concluir",
      () => {
        alternarConclusao(estado, tarefa.id, dataISO);
        salvar(estado);
        desenharTarefasDoDia(estado, concluida ? "Tarefa reaberta!" : "Tarefa concluída!");
      }
    )
  );

  acoes.appendChild(
    criarBotaoAcao(
      "editar",
      "Editar",
      () => {
        abrirEdicaoDeTarefa(estado, tarefa);
      }
    )
  );

  acoes.appendChild(
    criarBotaoAcao(
      "excluir",
      "Excluir",
      () => {
        confirmarExclusaoDeTarefa(estado, tarefa);
      }
    )
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

      // Se a edição mudou a tarefa de dia, ela sai da lista atual: avisamos disso.
      const mensagem =
        tarefa.data === dataVisualizada
          ? "Tarefa atualizada!"
          : `Tarefa movida para ${formatarData(tarefa.data)} — navegue até esse dia para vê-la.`;
      desenharTarefasDoDia(estado, mensagem);
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
  excluir.className = "botao-perigo";
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

// Botão de ação da tarefa (ícone + tooltip via aria-label)
function criarBotaoAcao(acao, ariaLabel, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-icone";
  botao.setAttribute("data-acao", acao);
  botao.setAttribute("aria-label", ariaLabel);
  botao.addEventListener("click", aoClicar);
  return botao;
}