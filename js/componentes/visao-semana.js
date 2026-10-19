// Componente: visão de semana (domingo a sábado).
// Cada coluna é um dia com suas tarefas já filtradas. Clicar num dia
// ou num cartão de tarefa abre a tela daquele dia (onde dá para criar,
// editar e concluir).

import { hojeISO, somarDias, inicioDaSemana, rotuloSemana } from "../regras/datas.js";
import { ocorrenciasDoDia, ordenarTarefasDoDia, estaConcluida } from "../regras/tarefas.js";
import { filtrarTarefas, temFiltroAtivo } from "../regras/filtros.js";

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * @param {Object} params
 * @param {Object} params.estado - estado global
 * @param {string} params.dataReferencia - "AAAA-MM-DD" de qualquer dia da semana a exibir
 * @param {Function} params.aoClicarDia - callback(dataISO) ao clicar num dia/tarefa
 * @param {Function} params.aoMudarPeriodo - callback(novaReferenciaISO) ao navegar ‹ › / Hoje
 * @returns {HTMLElement} section.cartao com a grade da semana
 */
export function criarVisaoSemana({ estado, dataReferencia, aoClicarDia, aoMudarPeriodo }) {
  const domingo = inicioDaSemana(dataReferencia);

  const cartao = document.createElement("section");
  cartao.className = "cartao cartao-semana";

  // --- Cabeçalho: navegação entre semanas ---
  const cabecalho = document.createElement("div");
  cabecalho.className = "semana-cabecalho";

  cabecalho.appendChild(criarBotaoIcone("‹", "Semana anterior", () => {
    aoMudarPeriodo(somarDias(domingo, -7));
  }));

  const rotulo = document.createElement("span");
  rotulo.className = "semana-rotulo";
  rotulo.textContent = rotuloSemana(domingo);
  cabecalho.appendChild(rotulo);

  cabecalho.appendChild(criarBotaoIcone("›", "Próxima semana", () => {
    aoMudarPeriodo(somarDias(domingo, 7));
  }));

  // Botão "Hoje" só aparece quando a semana exibida não é a de hoje.
  if (domingo !== inicioDaSemana(hojeISO())) {
    const botaoHoje = document.createElement("button");
    botaoHoje.type = "button";
    botaoHoje.className = "botao-discreto";
    botaoHoje.textContent = "Hoje";
    botaoHoje.addEventListener("click", () => aoMudarPeriodo(hojeISO()));
    cabecalho.appendChild(botaoHoje);
  }

  cartao.appendChild(cabecalho);

  // --- Grade das 7 colunas ---
  const grade = document.createElement("div");
  grade.className = "semana-grade";
  cartao.appendChild(grade);

  // --- Aviso mostrado quando a semana inteira está vazia ---
  const aviso = document.createElement("p");
  aviso.className = "semana-aviso-vazio";
  aviso.hidden = true;
  cartao.appendChild(aviso);

  // Redesenha as colunas a partir do estado/filtros atuais.
  // Chamada de novo quando as tarefas mudam (atualizarHome), sem recriar o cartão.
  function atualizar() {
    grade.innerHTML = "";
    const hoje = hojeISO();
    let total = 0;

    for (let i = 0; i < 7; i++) {
      const dataISO = somarDias(domingo, i);
      const tarefas = ordenarTarefasDoDia(
        filtrarTarefas(ocorrenciasDoDia(estado, dataISO), dataISO),
        dataISO
      );
      total += tarefas.length;
      grade.appendChild(criarColuna({
        dataISO,
        diaSemana: i,
        tarefas,
        ehHoje: dataISO === hoje,
        aoClicarDia
      }));
    }

    if (total === 0) {
      aviso.textContent = temFiltroAtivo()
        ? "Nenhuma tarefa nesta semana com os filtros atuais."
        : "Nenhuma tarefa nesta semana.";
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }
  }

  atualizar();

  cartao.atualizar = atualizar;
  return cartao;
}

// Uma coluna = um dia: cabeçalho clicável + lista de tarefas.
function criarColuna({ dataISO, diaSemana, tarefas, ehHoje, aoClicarDia }) {
  const coluna = document.createElement("div");
  coluna.className = "semana-coluna" + (ehHoje ? " hoje" : "");

  const botaoDia = document.createElement("button");
  botaoDia.type = "button";
  botaoDia.className = "semana-dia-btn";
  botaoDia.addEventListener("click", () => aoClicarDia(dataISO));

  const nomeDia = document.createElement("span");
  nomeDia.className = "semana-dia-nome";
  nomeDia.textContent = DIAS_CURTOS[diaSemana];

  const numeroDia = document.createElement("span");
  numeroDia.className = "semana-dia-num";
  numeroDia.textContent = String(Number(dataISO.slice(8, 10)));

  botaoDia.appendChild(nomeDia);
  botaoDia.appendChild(numeroDia);
  coluna.appendChild(botaoDia);

  const lista = document.createElement("div");
  lista.className = "semana-tarefas";

  if (tarefas.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "semana-vazia";
    vazio.textContent = "—";
    lista.appendChild(vazio);
  } else {
    for (const tarefa of tarefas) {
      lista.appendChild(criarCartaoTarefa(tarefa, dataISO, aoClicarDia));
    }
  }

  coluna.appendChild(lista);
  return coluna;
}

// Cartãozinho de tarefa: horário + título, com a cor de prioridade na borda.
function criarCartaoTarefa(tarefa, dataISO, aoClicarDia) {
  const concluida = estaConcluida(tarefa, dataISO);

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `semana-tarefa prioridade-${tarefa.prioridade}${concluida ? " concluida" : ""}`;
  botao.addEventListener("click", () => aoClicarDia(dataISO));

  const hora = document.createElement("span");
  hora.className = "semana-tarefa-hora";
  hora.textContent = tarefa.horaInicio;

  const titulo = document.createElement("span");
  titulo.className = "semana-tarefa-titulo";
  titulo.textContent = tarefa.titulo;

  botao.appendChild(hora);
  botao.appendChild(titulo);
  return botao;
}

// Botão-ícone com tooltip (padrão da tela de tarefas).
function criarBotaoIcone(texto, ariaLabel, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-icone";
  botao.setAttribute("aria-label", ariaLabel);
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}
