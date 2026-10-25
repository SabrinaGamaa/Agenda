// Componente: Painel principal do Home.
// Mostra quatro blocos independentes:
//   1. tarefas de hoje + próximas;
//   2. metas ativas com progresso;
//   3. resumo financeiro do mês;
//   4. contas fixas a vencer nos próximos 7 dias.
// Cada item leva para a tela correspondente. O calendário continua abaixo.

import { formatarData, diferencaEmDias } from "../regras/datas.js";
import { formatarCentavos } from "../regras/dinheiro.js";
import { formatarCompetencia } from "../regras/financas.js";
import { resumoPainel } from "../regras/painel.js";

const ROTULOS_TIPO_META = {
  pessoal: "Pessoal",
  profissional: "Profissional",
  financeira: "Financeira"
};

const PRIORIDADES = {
  alta: { cor: "139, 42, 42" },
  media: { cor: "107, 70, 193" },
  baixa: { cor: "30, 58, 95" }
};

/**
 * Cria o painel principal completo.
 * @param {Object} estado - estado global
 * @param {Object} [opcoes]
 * @param {Function} [opcoes.aoAbrirDia] - callback(dataISO)
 * @param {Function} [opcoes.aoAbrirMetas] - callback()
 * @param {Function} [opcoes.aoAbrirFinancas] - callback(competencia?)
 * @returns {HTMLElement} section.painel-principal
 */
export function criarPainelPrincipal(estado, opcoes = {}) {
  const {
    aoAbrirDia = null,
    aoAbrirMetas = null,
    aoAbrirFinancas = null
  } = opcoes;

  const painel = document.createElement("section");
  painel.className = "painel-principal";
  painel.setAttribute("aria-label", "Painel principal");

  const grade = document.createElement("div");
  grade.className = "painel-principal-grade";
  painel.appendChild(grade);

  const renderizar = () => {
    grade.innerHTML = "";
    const dados = resumoPainel(estado);

    grade.appendChild(criarBlocoTarefas(dados, { aoAbrirDia }));
    grade.appendChild(criarBlocoMetas(dados, { aoAbrirMetas }));
    grade.appendChild(criarBlocoFinancas(dados, { aoAbrirFinancas }));
    grade.appendChild(criarBlocoContas(dados, { aoAbrirFinancas }));
  };

  renderizar();
  painel.atualizar = renderizar;
  return painel;
}

// --- Bloco: tarefas ---

function criarBlocoTarefas(dados, { aoAbrirDia }) {
  const tarefas = dados.tarefas;
  const bloco = criarBloco("Hoje e próximas", {
    linkTexto: "Abrir hoje",
    aoLink: typeof aoAbrirDia === "function"
      ? () => aoAbrirDia(tarefas.dataBase)
      : null
  });

  if (
    tarefas.totalHoje === 0 &&
    tarefas.totalProximas === 0 &&
    tarefas.concluidasHoje === 0
  ) {
    bloco.appendChild(
      criarVazio("Nenhuma tarefa agendada para hoje ou para os próximos 7 dias.")
    );
    return bloco;
  }

  bloco.appendChild(criarSubtitulo("Hoje"));

  if (tarefas.hoje.length > 0) {
    bloco.appendChild(criarListaTarefas(tarefas.hoje, tarefas.dataBase, aoAbrirDia));
  } else {
    const texto = tarefas.concluidasHoje > 0
      ? "Tudo concluído hoje."
      : "Nenhuma tarefa hoje.";
    bloco.appendChild(criarVazio(texto));
  }

  if (tarefas.totalHoje > tarefas.hoje.length) {
    bloco.appendChild(
      criarMais(
        `Mais ${tarefas.totalHoje - tarefas.hoje.length} tarefa` +
        `${tarefas.totalHoje - tarefas.hoje.length === 1 ? "" : "s"} hoje.`
      )
    );
  }

  bloco.appendChild(criarSubtitulo("Próximas"));

  if (tarefas.proximas.length > 0) {
    bloco.appendChild(
      criarListaTarefas(tarefas.proximas, tarefas.dataBase, aoAbrirDia)
    );
  } else {
    bloco.appendChild(criarVazio("Nada agendado para os próximos 7 dias."));
  }

  if (tarefas.totalProximas > tarefas.proximas.length) {
    bloco.appendChild(
      criarMais(
        `Mais ${tarefas.totalProximas - tarefas.proximas.length} tarefa` +
        `${tarefas.totalProximas - tarefas.proximas.length === 1 ? "" : "s"} nos próximos 7 dias.`
      )
    );
  }

  return bloco;
}

function criarListaTarefas(tarefas, dataBase, aoAbrirDia) {
  const lista = document.createElement("ul");
  lista.className = "painel-lista";

  for (const tarefa of tarefas) {
    const item = document.createElement("li");
    const botao = criarBotaoItem(
      `Abrir tarefa "${tarefa.titulo}" em ${formatarData(tarefa.dataOcorrencia)}`
    );

    if (typeof aoAbrirDia === "function") {
      botao.addEventListener("click", () => aoAbrirDia(tarefa.dataOcorrencia));
    } else {
      botao.disabled = true;
    }

    const prioridade = PRIORIDADES[tarefa.prioridade] ?? PRIORIDADES.media;
    const icone = document.createElement("span");
    icone.className = "painel-item-icone";
    icone.textContent = "●";
    icone.style.background = `rgba(${prioridade.cor}, .15)`;
    icone.style.color = `rgb(${prioridade.cor})`;

    const conteudo = document.createElement("span");
    conteudo.className = "painel-item-conteudo";

    const titulo = document.createElement("span");
    titulo.className = "painel-item-titulo";
    titulo.textContent = tarefa.titulo;

    const meta = document.createElement("span");
    meta.className = "painel-item-meta";
    meta.textContent = [
      rotuloDia(tarefa.dataOcorrencia, dataBase),
      tarefa.horaInicio,
      tarefa.categoria
    ].filter(Boolean).join(" · ");

    conteudo.appendChild(titulo);
    conteudo.appendChild(meta);
    botao.appendChild(icone);
    botao.appendChild(conteudo);
    item.appendChild(botao);
    lista.appendChild(item);
  }

  return lista;
}

// --- Bloco: metas ---

function criarBlocoMetas(dados, { aoAbrirMetas }) {
  const metas = dados.metas;
  const bloco = criarBloco("Metas ativas", {
    linkTexto: "Ver metas",
    aoLink: typeof aoAbrirMetas === "function" ? aoAbrirMetas : null
  });

  if (metas.total === 0) {
    bloco.appendChild(
      criarVazio("Nenhuma meta ativa ainda. Crie uma meta para acompanhar o progresso.")
    );
    return bloco;
  }

  const lista = document.createElement("ul");
  lista.className = "painel-lista";

  for (const item of metas.itens) {
    const { meta, progresso } = item;
    const li = document.createElement("li");
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "painel-meta-botao";
    botao.title = `Abrir metas: ${meta.titulo}`;

    if (typeof aoAbrirMetas === "function") {
      botao.addEventListener("click", aoAbrirMetas);
    } else {
      botao.disabled = true;
    }

    const titulo = document.createElement("span");
    titulo.className = "painel-meta-titulo";
    titulo.textContent = meta.titulo;

    const info = document.createElement("span");
    info.className = "painel-meta-info";
    const partes = [
      ROTULOS_TIPO_META[meta.tipo] ?? "Meta",
      `${progresso}%`
    ];
    if (meta.prazo) partes.push(formatarData(meta.prazo));
    info.textContent = partes.join(" · ");

    const barra = document.createElement("span");
    barra.className = "painel-progresso";
    barra.setAttribute("role", "progressbar");
    barra.setAttribute("aria-valuemin", "0");
    barra.setAttribute("aria-valuemax", "100");
    barra.setAttribute("aria-valuenow", String(progresso));
    barra.setAttribute("aria-label", `Progresso de ${meta.titulo}: ${progresso}%`);

    const preenchimento = document.createElement("span");
    preenchimento.style.width = `${progresso}%`;
    barra.appendChild(preenchimento);

    botao.appendChild(titulo);
    botao.appendChild(info);
    botao.appendChild(barra);
    li.appendChild(botao);
    lista.appendChild(li);
  }

  bloco.appendChild(lista);

  if (metas.total > metas.itens.length) {
    const restantes = metas.total - metas.itens.length;
    bloco.appendChild(
      criarMais(
        `Mais ${restantes} meta${restantes === 1 ? "" : "s"} ativa${restantes === 1 ? "" : "s"}.`
      )
    );
  }

  return bloco;
}

// --- Bloco: finanças ---

function criarBlocoFinancas(dados, { aoAbrirFinancas }) {
  const resumo = dados.financas;
  const bloco = criarBloco("Finanças do mês", {
    linkTexto: "Ver finanças",
    aoLink: typeof aoAbrirFinancas === "function"
      ? () => aoAbrirFinancas(resumo.competencia)
      : null
  });

  const periodo = document.createElement("p");
  periodo.className = "painel-bloco-periodo";
  periodo.textContent = formatarCompetencia(resumo.competencia);
  bloco.appendChild(periodo);

  if (resumo.vazio) {
    bloco.appendChild(
      criarVazio(
        `Nenhum lançamento em ${formatarCompetencia(resumo.competencia).toLowerCase()}. ` +
        "Registre receitas e despesas para ver o resumo."
      )
    );
    return bloco;
  }

  const linhas = document.createElement("div");
  linhas.className = "painel-financas-linhas";
  linhas.appendChild(
    criarLinhaFinanca("Receitas", resumo.receitasCentavos, "receita")
  );
  linhas.appendChild(
    criarLinhaFinanca("Despesas", resumo.despesasCentavos, "despesa")
  );
  linhas.appendChild(
    criarLinhaFinanca(
      "Saldo",
      resumo.saldoCentavos,
      resumo.saldoCentavos >= 0 ? "saldo positivo" : "saldo negativo"
    )
  );
  bloco.appendChild(linhas);

  return bloco;
}

function criarLinhaFinanca(rotulo, valorCentavos, classe) {
  const linha = document.createElement("div");
  linha.className = "painel-financa-linha";

  const nome = document.createElement("span");
  nome.textContent = rotulo;

  const valor = document.createElement("strong");
  valor.className = classe;
  valor.textContent = formatarCentavos(valorCentavos);

  linha.appendChild(nome);
  linha.appendChild(valor);
  return linha;
}

// --- Bloco: contas a vencer ---

function criarBlocoContas(dados, { aoAbrirFinancas }) {
  const contas = dados.contas;
  const bloco = criarBloco("Contas a vencer", {
    linkTexto: "Ver contas",
    aoLink: typeof aoAbrirFinancas === "function"
      ? () => aoAbrirFinancas(dados.financas.competencia)
      : null
  });

  const periodo = document.createElement("p");
  periodo.className = "painel-bloco-periodo";
  periodo.textContent = "Próximos 7 dias";
  bloco.appendChild(periodo);

  if (contas.total === 0) {
    const texto = contas.temContasFixas
      ? "Nenhuma conta a vencer nos próximos 7 dias."
      : "Nenhuma conta fixa cadastrada. Cadastre contas para acompanhar os vencimentos.";
    bloco.appendChild(criarVazio(texto));
    return bloco;
  }

  const lista = document.createElement("ul");
  lista.className = "painel-lista";

  for (const conta of contas.itens) {
    const li = document.createElement("li");
    const botao = criarBotaoItem(
      `Abrir finanças: ${conta.nome} (${formatarCompetencia(conta.competencia)})`
    );

    if (typeof aoAbrirFinancas === "function") {
      botao.addEventListener("click", () => aoAbrirFinancas(conta.competencia));
    } else {
      botao.disabled = true;
    }

    const ehReceita = conta.tipo === "receita";
    const icone = document.createElement("span");
    icone.className = "painel-item-icone";
    icone.textContent = ehReceita ? "💰" : "🧾";
    icone.style.background = ehReceita
      ? "rgba(74, 222, 128, .15)"
      : "rgba(248, 113, 113, .15)";

    const conteudo = document.createElement("span");
    conteudo.className = "painel-item-conteudo";

    const titulo = document.createElement("span");
    titulo.className = "painel-item-titulo";
    titulo.textContent = conta.nome;

    const meta = document.createElement("span");
    meta.className = "painel-item-meta";
    meta.textContent = [
      rotuloVencimento(conta.dataVencimento, contas.dataBase),
      conta.categoria
    ].filter(Boolean).join(" · ");

    const valor = document.createElement("span");
    valor.className = `painel-item-valor ${ehReceita ? "receita" : "despesa"}`;
    valor.textContent = formatarCentavos(conta.valorPrevistoCentavos);

    conteudo.appendChild(titulo);
    conteudo.appendChild(meta);
    botao.appendChild(icone);
    botao.appendChild(conteudo);
    botao.appendChild(valor);
    li.appendChild(botao);
    lista.appendChild(li);
  }

  bloco.appendChild(lista);

  if (contas.total > contas.itens.length) {
    const restantes = contas.total - contas.itens.length;
    bloco.appendChild(
      criarMais(
        `Mais ${restantes} conta${restantes === 1 ? "" : "s"} na janela.`
      )
    );
  }

  return bloco;
}

// --- Helpers de estrutura ---

function criarBloco(titulo, { linkTexto = null, aoLink = null } = {}) {
  const bloco = document.createElement("section");
  bloco.className = "painel-bloco";

  const topo = document.createElement("div");
  topo.className = "painel-bloco-topo";

  const h2 = document.createElement("h2");
  h2.textContent = titulo;
  topo.appendChild(h2);

  if (linkTexto && typeof aoLink === "function") {
    const link = document.createElement("button");
    link.type = "button";
    link.className = "painel-bloco-link";
    link.textContent = linkTexto;
    link.addEventListener("click", aoLink);
    topo.appendChild(link);
  }

  bloco.appendChild(topo);
  return bloco;
}

function criarBotaoItem(rotuloAcessivel) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "painel-item painel-item-botao";
  botao.setAttribute("aria-label", rotuloAcessivel);
  return botao;
}

function criarSubtitulo(texto) {
  const elemento = document.createElement("p");
  elemento.className = "painel-subtitulo";
  elemento.textContent = texto;
  return elemento;
}

function criarVazio(texto) {
  const elemento = document.createElement("p");
  elemento.className = "painel-vazio";
  elemento.textContent = texto;
  return elemento;
}

function criarMais(texto) {
  const elemento = document.createElement("p");
  elemento.className = "painel-mais";
  elemento.textContent = texto;
  return elemento;
}

function rotuloDia(dataISO, dataBase) {
  const dias = diferencaEmDias(dataBase, dataISO);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return formatarData(dataISO);
}

function rotuloVencimento(dataISO, dataBase) {
  const dias = diferencaEmDias(dataBase, dataISO);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}
