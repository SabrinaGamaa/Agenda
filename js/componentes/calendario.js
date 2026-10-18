// Componente: Calendário mensal interativo.
// Recebe { estado, dataReferencia, aoClicarDia, aoMudarPeriodo } e monta a grade do mês.
// Cada dia mostra até 3 bolinhas (alta/média/baixa) se houver tarefas naquele dia,
// respeitando os filtros ativos.

import { hojeISO, somarMeses } from "../regras/datas.js";
import { tarefasDoDia } from "../regras/tarefas.js";
import { filtrarTarefas, temFiltroAtivo } from "../regras/filtros.js";

/**
 * Cria o calendário do mês de `dataReferencia` (qualquer dia do mês).
 * @param {Object} params
 * @param {Object} params.estado - estado global (para tarefasDoDia)
 * @param {string} params.dataReferencia - "AAAA-MM-DD" de qualquer dia do mês a exibir
 * @param {Function} params.aoClicarDia - callback(dataISO) quando clica num dia válido
 * @param {Function} [params.aoMudarPeriodo] - callback(novaReferenciaISO) ao navegar entre meses
 * @returns {HTMLElement} section.cartao com o calendário dentro
 */
export function criarCalendarioMes({ estado, dataReferencia, aoClicarDia, aoMudarPeriodo = null }) {
  const cartao = document.createElement("section");
  cartao.className = "cartao";
  cartao.style.padding = "0";

  const [ano, mes] = dataReferencia.split("-").map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay(); // 0=Dom ... 6=Sáb
  const hoje = hojeISO();

  // Cabeçalho do mês (nome do mês + ano)
  const cabecalhoMes = document.createElement("div");
  cabecalhoMes.className = "calendario-cabecalho-mes";
  cabecalhoMes.style.cssText = `
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--espaco-pequeno) var(--espaco);
    background: var(--bg-input);
    border-bottom: 1px solid var(--borda);
  `;
  const tituloMes = document.createElement("h2");
  tituloMes.style.cssText = "margin: 0; font-size: 1rem; font-weight: 600;";
  tituloMes.textContent = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(primeiroDia);
  cabecalhoMes.appendChild(tituloMes);

  // Navegação entre meses: ‹ › + Hoje
  // (só aparece quando o chamador passa aoMudarPeriodo)
  if (aoMudarPeriodo) {
    const primeiroDiaISO = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const nav = document.createElement("div");
    nav.className = "calendario-nav";

    nav.appendChild(criarBotaoNav("‹", "Mês anterior", () => aoMudarPeriodo(somarMeses(primeiroDiaISO, -1))));
    nav.appendChild(criarBotaoNav("›", "Próximo mês", () => aoMudarPeriodo(somarMeses(primeiroDiaISO, 1))));

    const botaoHoje = document.createElement("button");
    botaoHoje.type = "button";
    botaoHoje.className = "botao-discreto";
    botaoHoje.textContent = "Hoje";
    botaoHoje.addEventListener("click", () => aoMudarPeriodo(hojeISO()));
    nav.appendChild(botaoHoje);

    cabecalhoMes.appendChild(nav);
  }

  cartao.appendChild(cabecalhoMes);

  // Grid: dias da semana + dias do mês
  const grade = document.createElement("div");
  grade.className = "calendario-mes";
  grade.style.cssText = "border-radius: 0 0 var(--raio) var(--raio);";

  // Linha dos dias da semana
  const linhaSemana = document.createElement("div");
  linhaSemana.className = "calendario-cabecalho";
  linhaSemana.style.cssText = "border-radius: 0;";
  linhaSemana.setAttribute("role", "row");
  ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((d) => {
    const cel = document.createElement("div");
    cel.className = "calendario-dia-semana";
    cel.textContent = d;
    linhaSemana.appendChild(cel);
  });
  grade.appendChild(linhaSemana);

  // Grade dos dias
  const gradeDias = document.createElement("div");
  gradeDias.className = "calendario-grade";
  gradeDias.setAttribute("role", "grid");

  // Dias vazios antes do dia 1 (do mês anterior)
  for (let i = 0; i < diaSemanaInicio; i++) {
    const diaAnterior = new Date(ano, mes - 1, -diaSemanaInicio + 1 + i);
    const dataISO = `${diaAnterior.getFullYear()}-${String(diaAnterior.getMonth()+1).padStart(2,"0")}-${String(diaAnterior.getDate()).padStart(2,"0")}`;
    const btn = criarBotaoDia({
      numero: diaAnterior.getDate(),
      dataISO,
      outroMes: true,
      ehHoje: false,
      ehVisualizado: false,
      aoClicar: null
    });
    gradeDias.appendChild(btn);
  }

  // Dias do mês atual
  // (as bolinhas de prioridade são preenchidas depois, por atualizarIndicadoresCalendario)
  for (let d = 1; d <= diasNoMes; d++) {
    const dataISO = `${ano}-${String(mes).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const ehHoje = dataISO === hoje;

    const btn = criarBotaoDia({
      numero: d,
      dataISO,
      outroMes: false,
      ehHoje,
      ehVisualizado: false, // será setado pelo caller se necessário
      aoClicar: () => aoClicarDia(dataISO)
    });
    gradeDias.appendChild(btn);
  }

  // Dias vazios depois do último dia (do mês seguinte)
  const totalCelulas = diaSemanaInicio + diasNoMes;
  const celulasRestantes = (7 - (totalCelulas % 7)) % 7;
  for (let i = 1; i <= celulasRestantes; i++) {
    const diaSeguinte = new Date(ano, mes, i);
    const dataISO = `${diaSeguinte.getFullYear()}-${String(diaSeguinte.getMonth()+1).padStart(2,"0")}-${String(diaSeguinte.getDate()).padStart(2,"0")}`;
    const btn = criarBotaoDia({
      numero: i,
      dataISO,
      outroMes: true,
      ehHoje: false,
      ehVisualizado: false,
      aoClicar: null
    });
    gradeDias.appendChild(btn);
  }

  // Aviso mostrado quando o mês inteiro está vazio (respeita filtros)
  const avisoVazio = document.createElement("div");
  avisoVazio.className = "calendario-aviso-vazio";
  avisoVazio.hidden = true;
  gradeDias.appendChild(avisoVazio);

  grade.appendChild(gradeDias);
  cartao.appendChild(grade);

  // Preenche as bolinhas já na primeira montagem (e mostra o aviso, se preciso)
  atualizarIndicadoresCalendario(gradeDias, estado);

  // Expõe a grade para updates futuros
  cartao.gradeDias = gradeDias;
  cartao.atualizarIndicadores = () => atualizarIndicadoresCalendario(gradeDias, estado);

  return cartao;
}

/**
 * Calcula quais indicadores (bolinhas) mostrar para as tarefas do dia.
 * Retorna array com strings: "alta", "media", "baixa" (máx. 1 de cada, máx. 3 total).
 */
function calcularIndicadores(tarefas) {
  const tem = { alta: false, media: false, baixa: false };
  for (const t of tarefas) {
    if (t.prioridade === "alta") tem.alta = true;
    else if (t.prioridade === "media") tem.media = true;
    else if (t.prioridade === "baixa") tem.baixa = true;
  }
  const res = [];
  if (tem.alta) res.push("alta");
  if (tem.media) res.push("media");
  if (tem.baixa) res.push("baixa");
  return res;
}

/**
 * Cria o <button> de um dia do calendário.
 */
function criarBotaoDia({ numero, dataISO, outroMes, ehHoje, ehVisualizado, aoClicar }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "calendario-dia";
  btn.setAttribute("data-iso", dataISO); // <-- para updates fáceis
  btn.setAttribute("aria-label", `${numero} de ${new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(dataISO + "T00:00:00"))} de ${dataISO.split("-")[0]}${ehHoje ? " (hoje)" : ""}`);

  if (outroMes) {
    btn.classList.add("outro-mes");
    btn.disabled = true;
    btn.setAttribute("aria-hidden", "true");
  } else {
    if (ehHoje) btn.classList.add("hoje");
    if (ehVisualizado) btn.classList.add("visualizado");
    if (aoClicar) {
      btn.addEventListener("click", aoClicar);
    } else {
      btn.disabled = true;
    }
  }

  const spanNumero = document.createElement("span");
  spanNumero.textContent = numero;
  btn.appendChild(spanNumero);

  // As bolinhas de prioridade são adicionadas depois, por atualizarIndicadoresCalendario.
  return btn;
}

/**
 * Atualiza as bolinhas de prioridade dos dias (respeitando os filtros ativos)
 * e mostra/esconde o aviso de "mês vazio".
 * Chame após criar/excluir/concluir tarefas ou ao mudar os filtros.
 */
export function atualizarIndicadoresCalendario(gradeElement, estado) {
  const botoes = gradeElement.querySelectorAll(".calendario-dia:not(.outro-mes)");
  let totalDeTarefas = 0;

  botoes.forEach((btn) => {
    const dataISO = btn.getAttribute("data-iso");
    if (!dataISO) return;

    const tarefasDia = filtrarTarefas(tarefasDoDia(estado, dataISO), dataISO);
    totalDeTarefas += tarefasDia.length;

    // Remove o container antigo de bolinhas
    const antigo = btn.querySelector(".calendario-indicadores");
    if (antigo) antigo.remove();

    // Adiciona o novo, se houver
    const indicadores = calcularIndicadores(tarefasDia);
    if (indicadores.length > 0) {
      const indContainer = document.createElement("span");
      indContainer.className = "calendario-indicadores";
      for (const prio of indicadores) {
        const bolinha = document.createElement("span");
        bolinha.className = `calendario-indicador ${prio}`;
        indContainer.appendChild(bolinha);
      }
      btn.appendChild(indContainer);
    }
  });

  // Aviso de "mês vazio" (considerando os filtros ativos)
  const aviso = gradeElement.querySelector(".calendario-aviso-vazio");
  if (aviso) {
    if (totalDeTarefas === 0) {
      aviso.textContent = temFiltroAtivo()
        ? "Nenhuma tarefa neste mês com os filtros atuais."
        : "Nenhuma tarefa neste mês.";
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }
  }
}

/**
 * Atualiza qual dia está marcado como "visualizado" (classe .visualizado).
 */
export function atualizarDiaVisualizadoCalendario(gradeElement, dataISO) {
  const botoes = gradeElement.querySelectorAll(".calendario-dia[data-iso]");
  botoes.forEach((btn) => {
    btn.classList.toggle("visualizado", btn.getAttribute("data-iso") === dataISO);
  });
}

// Botão-ícone da navegação do calendário (‹ ›), com tooltip via aria-label.
function criarBotaoNav(texto, ariaLabel, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-icone";
  botao.setAttribute("aria-label", ariaLabel);
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}