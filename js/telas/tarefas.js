// Tela de tarefas: formulário de criação + lista de um dia, com ações
// (concluir/reabrir, editar, excluir) e navegação entre dias.
// Tema escuro: botões só ícones, linha fina de prioridade, concluídas com opacity.

import { hojeISO, somarDias, formatarData, formatarDataLonga, somarMinutos, formatarDuracao } from "../regras/datas.js";
import {
  criarTarefa,
  ocorrenciasDoDia,
  ordenarTarefasDoDia,
  estaConcluida,
  alternarConclusao,
  cancelarOcorrencia,
  ajustarOcorrencia,
  atualizarTarefa,
  excluirTarefa
} from "../regras/tarefas.js";
import { ehRecorrente, tarefaOcorreEm } from "../regras/recorrencia.js";
import { encontrarMeta, vincularTarefa } from "../regras/metas.js";
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
    metas: estado.metas ?? [],
    dataPadrao: dataVisualizada, // sugere a data do dia que está na tela
    aoSalvar: (campos) => {
      const tarefa = criarTarefa(campos);
      estado.tarefas.push(tarefa);

      // O vínculo é aplicado pela regra das metas, que valida a existência.
      if ("metaId" in campos) {
        vincularTarefa(estado, tarefa.id, campos.metaId);
      }

      salvar(estado);
      console.log("Tarefa criada:", tarefa);

      // Se a tarefa não aparecer no dia que está na tela, avisamos por quê.
      // Numa série, o início pode ser outro dia e ainda assim haver ocorrência hoje.
      const apareceNaTela = tarefaOcorreEm(tarefa, dataVisualizada);
      const tipo = ehRecorrente(tarefa) ? "Série" : "Tarefa";
      let mensagem;

      if (apareceNaTela) {
        mensagem = `${tipo} adicionada!`;
      } else if (ehRecorrente(tarefa)) {
        mensagem = "Série salva! Navegue pelos dias para ver as ocorrências.";
      } else {
        mensagem = `Tarefa salva para ${formatarData(tarefa.data)} — navegue até esse dia para vê-la.`;
      }

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
  const tarefasFiltradas = filtrarTarefas(ocorrenciasDoDia(estado, dataVisualizada), dataVisualizada);
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

function criarItemTarefa(estado, ocorrencia, dataISO) {
  const tarefaOriginal = ocorrencia.tarefaOriginal ?? ocorrencia;
  const recorrente = ehRecorrente(tarefaOriginal);
  const concluida = estaConcluida(ocorrencia, dataISO);
  const { horaFinal, diaSeguinte } = somarMinutos(ocorrencia.horaInicio, ocorrencia.duracaoMinutos);

  const item = document.createElement("li");
  item.className = `tarefa prioridade-${ocorrencia.prioridade}${concluida ? " concluida" : ""}`;

  const esquerda = document.createElement("div");
  esquerda.className = "tarefa-esquerda";

  const horario = document.createElement("span");
  horario.className = "tarefa-horario";
  horario.textContent = `${ocorrencia.horaInicio}–${horaFinal}${diaSeguinte ? " (dia seguinte)" : ""}`;

  esquerda.appendChild(horario);

  const corpo = document.createElement("div");
  corpo.className = "tarefa-corpo";

  const tituloTarefa = document.createElement("span");
  tituloTarefa.className = "tarefa-titulo";
  tituloTarefa.textContent = ocorrencia.titulo;
  corpo.appendChild(tituloTarefa);

  const detalhes = document.createElement("span");
  detalhes.className = "tarefa-detalhes";
  const partes = [ocorrencia.categoria, formatarDuracao(ocorrencia.duracaoMinutos)];

  if (recorrente) {
    partes.push("↻ recorrente");
  }

  const metaVinculada = ocorrencia.metaId
    ? encontrarMeta(estado, ocorrencia.metaId)
    : null;
  if (metaVinculada) {
    partes.push(`meta: ${metaVinculada.titulo}`);
  }

  if (ocorrencia.descricao) {
    partes.push(ocorrencia.descricao);
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
        alternarConclusao(estado, ocorrencia.id, dataISO);
        salvar(estado);
        const mensagem = recorrente
          ? (concluida ? "Ocorrência reaberta!" : "Ocorrência concluída!")
          : (concluida ? "Tarefa reaberta!" : "Tarefa concluída!");
        desenharTarefasDoDia(estado, mensagem);
      }
    )
  );

  acoes.appendChild(
    criarBotaoAcao(
      "editar",
      recorrente ? "Editar ocorrência ou série" : "Editar",
      () => {
        abrirEdicaoDeTarefa(estado, ocorrencia, dataISO);
      }
    )
  );

  acoes.appendChild(
    criarBotaoAcao(
      "excluir",
      recorrente ? "Cancelar ocorrência ou excluir série" : "Excluir",
      () => {
        confirmarExclusaoDeTarefa(estado, ocorrencia, dataISO);
      }
    )
  );

  item.appendChild(esquerda);
  item.appendChild(corpo);
  item.appendChild(acoes);
  return item;
}

// Abre a edição. Tarefa única vai direto ao formulário; série pergunta
// se a alteração vale só para o dia clicado ou para todas as ocorrências.
function abrirEdicaoDeTarefa(estado, ocorrencia, dataISO) {
  const tarefa = ocorrencia.tarefaOriginal ?? ocorrencia;

  if (ehRecorrente(tarefa)) {
    abrirEscolhaDeEdicao(estado, ocorrencia, dataISO);
  } else {
    abrirFormularioDeEdicaoDaTarefa(estado, tarefa, dataISO);
  }
}

// Pergunta o alcance da edição de uma ocorrência recorrente.
function abrirEscolhaDeEdicao(estado, ocorrencia, dataISO) {
  const tarefa = ocorrencia.tarefaOriginal;
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent = `“${ocorrencia.titulo}” faz parte de uma série. O que você quer editar?`;

  const detalhe = document.createElement("p");
  detalhe.className = "modal-texto";
  detalhe.textContent =
    `“Somente esta ocorrência” altera apenas ${formatarData(dataISO)}. ` +
    "“Toda a série” altera também os outros dias.";

  const grupo = criarGrupoDeBotoes([
    {
      rotulo: "Cancelar",
      classe: "botao-secundario",
      aoClicar: () => modal.close()
    },
    {
      rotulo: "Toda a série",
      classe: "botao-secundario",
      aoClicar: () => {
        modal.close();
        abrirFormularioDeEdicaoDaTarefa(estado, tarefa, dataISO);
      }
    },
    {
      rotulo: "Somente esta ocorrência",
      classe: "botao-principal",
      aoClicar: () => {
        modal.close();
        abrirFormularioDeEdicaoDaOcorrencia(estado, ocorrencia, dataISO);
      }
    }
  ]);

  conteudo.appendChild(texto);
  conteudo.appendChild(detalhe);
  conteudo.appendChild(grupo);

  const modal = abrirModal({
    titulo: "Editar tarefa recorrente",
    conteudo
  });
}

// Edita a definição da tarefa (ou a série inteira), com o formulário completo.
function abrirFormularioDeEdicaoDaTarefa(estado, tarefa, dataISO) {
  const formulario = criarFormularioTarefa({
    categorias: estado.config.categoriasTarefas,
    metas: estado.metas ?? [],
    valoresIniciais: tarefa,
    rotuloBotao: "Salvar alterações",
    aoSalvar: (campos) => {
      atualizarTarefa(estado, tarefa.id, campos);

      // atualizarTarefa preserva o vínculo; a regra das metas aplica a troca
      // (ou a remoção, quando o campo vem vazio).
      if ("metaId" in campos) {
        vincularTarefa(estado, tarefa.id, campos.metaId);
      }

      salvar(estado);
      modal.close();

      // Se a edição mudou uma tarefa única de dia, avisamos que ela saiu da lista.
      const mensagem = ehRecorrente(tarefa)
        ? "Série atualizada!"
        : tarefa.data === dataISO
          ? "Tarefa atualizada!"
          : `Tarefa movida para ${formatarData(tarefa.data)} — navegue até esse dia para vê-la.`;
      desenharTarefasDoDia(estado, mensagem);
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: ehRecorrente(tarefa) ? "Editar série" : "Editar tarefa",
    conteudo: formulario
  });
}

// Edita só o dia clicado. Data e repetição ficam fixas; o restante vira exceção.
function abrirFormularioDeEdicaoDaOcorrencia(estado, ocorrencia, dataISO) {
  const tarefa = ocorrencia.tarefaOriginal;
  const formulario = criarFormularioTarefa({
    categorias: estado.config.categoriasTarefas,
    valoresIniciais: ocorrencia,
    dataFixa: dataISO,
    editarSomenteOcorrencia: true,
    rotuloBotao: "Salvar nesta ocorrência",
    aoSalvar: (campos) => {
      ajustarOcorrencia(estado, tarefa.id, dataISO, campos);
      salvar(estado);
      modal.close();
      desenharTarefasDoDia(
        estado,
        `Ocorrência de ${formatarData(dataISO)} atualizada! Os outros dias não mudaram.`
      );
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: `Editar ocorrência de ${formatarData(dataISO)}`,
    conteudo: formulario
  });
}

// Ao excluir uma tarefa recorrente, pergunta se o usuário quer cancelar
// só aquele dia (a série continua) ou apagar a série inteira.
function confirmarExclusaoDeTarefa(estado, ocorrencia, dataISO) {
  const tarefa = ocorrencia.tarefaOriginal ?? ocorrencia;

  if (ehRecorrente(tarefa)) {
    abrirEscolhaDeExclusao(estado, ocorrencia, dataISO);
  } else {
    abrirConfirmacaoDeExclusaoDaTarefa(estado, tarefa);
  }
}

function abrirEscolhaDeExclusao(estado, ocorrencia, dataISO) {
  const tarefa = ocorrencia.tarefaOriginal;
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent = `“${ocorrencia.titulo}” se repete. O que fazer com ${formatarData(dataISO)}?`;

  const detalhe = document.createElement("p");
  detalhe.className = "modal-texto";
  detalhe.textContent =
    "Cancelar esta ocorrência remove só este dia; a série continua nos outros. " +
    "Excluir a série remove todas as ocorrências e não pode ser desfeito.";

  const grupo = criarGrupoDeBotoes([
    {
      rotulo: "Voltar",
      classe: "botao-secundario",
      aoClicar: () => modal.close()
    },
    {
      rotulo: "Excluir a série inteira",
      classe: "botao-perigo",
      aoClicar: () => {
        modal.close();
        abrirConfirmacaoDeExclusaoDaTarefa(estado, tarefa);
      }
    },
    {
      rotulo: "Cancelar esta ocorrência",
      classe: "botao-principal",
      aoClicar: () => {
        const tarefaAlterada = cancelarOcorrencia(estado, tarefa.id, dataISO);
        if (tarefaAlterada === null) return;

        salvar(estado);
        modal.close();
        desenharTarefasDoDia(
          estado,
          `Ocorrência de ${formatarData(dataISO)} cancelada. A série continua nos outros dias.`
        );
      }
    }
  ]);

  conteudo.appendChild(texto);
  conteudo.appendChild(detalhe);
  conteudo.appendChild(grupo);

  const modal = abrirModal({
    titulo: "Cancelar ocorrência ou excluir série",
    conteudo
  });
}

// Pede confirmação antes de excluir de vez uma tarefa ou uma série.
function abrirConfirmacaoDeExclusaoDaTarefa(estado, tarefa) {
  const recorrente = ehRecorrente(tarefa);
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent = recorrente
    ? `Excluir a série “${tarefa.titulo}”? Todas as ocorrências serão removidas. Esta ação não pode ser desfeita.`
    : `Excluir a tarefa “${tarefa.titulo}”? Esta ação não pode ser desfeita.`;

  const grupo = criarGrupoDeBotoes([
    {
      rotulo: "Cancelar",
      classe: "botao-secundario",
      aoClicar: () => modal.close()
    },
    {
      rotulo: recorrente ? "Excluir série" : "Excluir",
      classe: "botao-perigo",
      aoClicar: () => {
        excluirTarefa(estado, tarefa.id);
        salvar(estado);
        modal.close();
        desenharTarefasDoDia(estado, recorrente ? "Série excluída." : "Tarefa excluída.");
      }
    }
  ]);

  conteudo.appendChild(texto);
  conteudo.appendChild(grupo);

  const modal = abrirModal({
    titulo: recorrente ? "Excluir série" : "Excluir tarefa",
    conteudo
  });
}

// Cria o grupo de botões de um modal: cada item informa rótulo, classe e ação.
function criarGrupoDeBotoes(botoes) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-botoes";

  for (const { rotulo, classe, aoClicar } of botoes) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = classe;
    botao.textContent = rotulo;
    botao.addEventListener("click", aoClicar);
    grupo.appendChild(botao);
  }

  return grupo;
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