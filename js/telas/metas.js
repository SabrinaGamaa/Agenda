// Tela de metas: lista em cartões + criação, edição e exclusão.
// As regras ficam em js/regras/metas.js; esta tela só monta a interface.

import {
  criarMeta,
  atualizarMeta,
  excluirMeta,
  encontrarMeta,
  calcularProgresso,
  progressoFinanceiro,
  adicionarEtapa,
  alternarEtapa,
  excluirEtapa,
  vincularTarefa,
  tarefasDaMeta
} from "../regras/metas.js";
import { formatarCentavos } from "../regras/dinheiro.js";
import { formatarData } from "../regras/datas.js";
import { ehRecorrente } from "../regras/recorrencia.js";
import { criarFormularioMeta } from "../componentes/formulario-meta.js";
import { abrirModal } from "../componentes/modal.js";
import { salvar } from "../dados/armazenamento.js";

const ROTULOS_TIPO = {
  pessoal: "Pessoal",
  profissional: "Profissional",
  financeira: "Financeira"
};

const ROTULOS_SITUACAO = {
  ativa: "Ativa",
  concluida: "Concluída",
  abandonada: "Abandonada"
};

export function desenharMetas(estado, mensagem = null) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = "";

  conteudo.appendChild(criarBarra(estado));

  if (mensagem) {
    const aviso = document.createElement("p");
    aviso.className = "mensagem-sucesso";
    aviso.textContent = mensagem;
    conteudo.appendChild(aviso);
  }

  const metas = ordenarMetas(estado.metas ?? []);

  if (metas.length === 0) {
    conteudo.appendChild(criarEstadoVazio(estado));
    return;
  }

  const grade = document.createElement("div");
  grade.className = "grade-metas";

  for (const meta of metas) {
    grade.appendChild(criarCartaoMeta(estado, meta));
  }

  conteudo.appendChild(grade);
}

// --- Barra superior ---

function criarBarra(estado) {
  const barra = document.createElement("div");
  barra.className = "metas-barra";

  const blocoTexto = document.createElement("div");

  const titulo = document.createElement("h2");
  titulo.className = "metas-titulo";
  titulo.textContent = "Metas";

  const subtitulo = document.createElement("p");
  subtitulo.className = "metas-subtitulo";
  subtitulo.textContent = "Acompanhe seus objetivos e o progresso de cada um.";

  blocoTexto.appendChild(titulo);
  blocoTexto.appendChild(subtitulo);

  const nova = document.createElement("button");
  nova.type = "button";
  nova.className = "botao-principal";
  nova.textContent = "+ Nova meta";
  nova.addEventListener("click", () => abrirFormularioNovaMeta(estado));

  barra.appendChild(blocoTexto);
  barra.appendChild(nova);
  return barra;
}

function criarEstadoVazio(estado) {
  const vazio = document.createElement("div");
  vazio.className = "estado-vazio";

  const texto = document.createElement("p");
  texto.textContent = "Nenhuma meta criada ainda. Comece com um objetivo pequeno e mensurável.";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-secundario";
  botao.textContent = "Criar primeira meta";
  botao.addEventListener("click", () => abrirFormularioNovaMeta(estado));

  vazio.appendChild(texto);
  vazio.appendChild(botao);
  return vazio;
}

// --- Cartão de meta ---

function criarCartaoMeta(estado, meta) {
  const situacao = ROTULOS_SITUACAO[meta.situacao] ? meta.situacao : "ativa";
  const tipo = ROTULOS_TIPO[meta.tipo] ? meta.tipo : "pessoal";
  const progresso = calcularProgresso(meta);
  const etapas = Array.isArray(meta.etapas) ? meta.etapas : [];
  const concluidas = etapas.filter((etapa) => etapa?.concluida).length;
  const tarefasVinculadas = tarefasDaMeta(estado, meta.id).length;
  const tituloId = `meta-titulo-${meta.id}`;

  const cartao = document.createElement("article");
  cartao.className = `meta-cartao situacao-${situacao}`;
  cartao.dataset.metaId = meta.id;

  const topo = document.createElement("div");
  topo.className = "meta-cartao-topo";

  const seloTipo = document.createElement("span");
  seloTipo.className = "meta-badge meta-badge-tipo";
  seloTipo.textContent = ROTULOS_TIPO[tipo];

  const seloSituacao = document.createElement("span");
  seloSituacao.className = `meta-badge meta-badge-${situacao}`;
  seloSituacao.textContent = ROTULOS_SITUACAO[situacao];

  topo.appendChild(seloTipo);
  topo.appendChild(seloSituacao);

  const titulo = document.createElement("h3");
  titulo.className = "meta-titulo";
  titulo.id = tituloId;
  titulo.textContent = meta.titulo;

  cartao.appendChild(topo);
  cartao.appendChild(titulo);

  if (meta.descricao) {
    const descricao = document.createElement("p");
    descricao.className = "meta-descricao";
    descricao.textContent = meta.descricao;
    cartao.appendChild(descricao);
  }

  const info = document.createElement("div");
  info.className = "meta-info";

  const prazo = document.createElement("span");
  prazo.textContent = meta.prazo ? `Prazo: ${formatarData(meta.prazo)}` : "Sem prazo";

  const etapasTexto = document.createElement("span");
  etapasTexto.textContent = etapas.length > 0
    ? `${concluidas} de ${etapas.length} etapa(s)`
    : tipo === "financeira"
      ? "Meta financeira"
      : "Progresso manual";

  info.appendChild(prazo);
  info.appendChild(etapasTexto);

  if (tarefasVinculadas > 0) {
    const tarefasTexto = document.createElement("span");
    tarefasTexto.textContent = tarefasVinculadas === 1
      ? "1 tarefa vinculada"
      : `${tarefasVinculadas} tarefas vinculadas`;
    info.appendChild(tarefasTexto);
  }

  cartao.appendChild(info);

  // Em meta financeira sem etapas, a barra financeira já é o progresso.
  // Com etapas, mostramos a barra das etapas e a financeira separadamente.
  if (etapas.length > 0 || tipo !== "financeira") {
    cartao.appendChild(criarProgresso(tituloId, progresso, "Progresso da meta"));
  }

  if (tipo === "financeira") {
    cartao.appendChild(criarResumoFinanceiro(meta, tituloId));
  }

  const acoes = document.createElement("div");
  acoes.className = "meta-acoes";

  const detalhes = document.createElement("button");
  detalhes.type = "button";
  detalhes.className = "botao-discreto meta-botao-detalhes";
  detalhes.textContent = "Detalhes";
  detalhes.addEventListener("click", () => abrirDetalhesMeta(estado, meta.id));
  acoes.appendChild(detalhes);

  acoes.appendChild(criarBotaoAcao("editar", "Editar meta", () => {
    abrirFormularioEdicaoMeta(estado, meta);
  }));

  acoes.appendChild(criarBotaoAcao("excluir", "Excluir meta", () => {
    confirmarExclusaoMeta(estado, meta);
  }));

  cartao.appendChild(acoes);
  return cartao;
}

function criarProgresso(tituloId, percentual, rotulo) {
  const bloco = document.createElement("div");
  bloco.className = "meta-progresso-bloco";

  const legenda = document.createElement("div");
  legenda.className = "meta-progresso-legenda";

  const texto = document.createElement("span");
  texto.textContent = rotulo;

  const valor = document.createElement("strong");
  valor.textContent = `${percentual}%`;

  legenda.appendChild(texto);
  legenda.appendChild(valor);

  const barra = document.createElement("div");
  barra.className = "meta-progresso";
  barra.setAttribute("role", "progressbar");
  barra.setAttribute("aria-valuemin", "0");
  barra.setAttribute("aria-valuemax", "100");
  barra.setAttribute("aria-valuenow", String(percentual));
  barra.setAttribute("aria-labelledby", tituloId);

  const preenchimento = document.createElement("div");
  preenchimento.className = "meta-progresso-preenchimento";
  preenchimento.style.width = `${percentual}%`;

  barra.appendChild(preenchimento);
  bloco.appendChild(legenda);
  bloco.appendChild(barra);
  return bloco;
}

function criarResumoFinanceiro(meta, tituloId) {
  const resumo = progressoFinanceiro(meta);

  if (resumo === null) {
    const vazio = document.createElement("p");
    vazio.className = "meta-financeiro-vazio";
    vazio.textContent = "Defina um valor alvo para acompanhar o progresso financeiro.";
    return vazio;
  }

  const bloco = document.createElement("div");
  bloco.className = "meta-financeiro";

  const legenda = document.createElement("div");
  legenda.className = "meta-progresso-legenda";

  const textoLegenda = document.createElement("span");
  textoLegenda.textContent = "Progresso financeiro";

  const percentual = document.createElement("strong");
  percentual.textContent = `${resumo.percentual}%`;

  legenda.appendChild(textoLegenda);
  legenda.appendChild(percentual);

  const linha = document.createElement("div");
  linha.className = "meta-financeiro-linha";

  const atual = document.createElement("strong");
  atual.textContent = formatarCentavos(resumo.atualCentavos);

  const alvo = document.createElement("span");
  alvo.textContent = `de ${formatarCentavos(resumo.alvoCentavos)}`;

  linha.appendChild(atual);
  linha.appendChild(alvo);

  const barra = document.createElement("div");
  barra.className = "meta-progresso meta-progresso-financeiro";
  barra.setAttribute("role", "progressbar");
  barra.setAttribute("aria-valuemin", "0");
  barra.setAttribute("aria-valuemax", "100");
  barra.setAttribute("aria-valuenow", String(resumo.percentual));
  barra.setAttribute("aria-labelledby", tituloId);

  const preenchimento = document.createElement("div");
  preenchimento.className = "meta-progresso-preenchimento";
  preenchimento.style.width = `${resumo.percentual}%`;
  barra.appendChild(preenchimento);

  const falta = document.createElement("span");
  falta.className = `meta-financeiro-falta${resumo.atingida ? " atingida" : ""}`;
  falta.textContent = resumo.atingida
    ? (resumo.excedenteCentavos > 0
      ? `Meta atingida! Sobram ${formatarCentavos(resumo.excedenteCentavos)}.`
      : "Meta financeira atingida!")
    : `Faltam ${formatarCentavos(resumo.faltaCentavos)}.`;

  bloco.appendChild(legenda);
  bloco.appendChild(linha);
  bloco.appendChild(barra);
  bloco.appendChild(falta);
  return bloco;
}

// --- Criação e edição ---

function abrirFormularioNovaMeta(estado) {
  const formulario = criarFormularioMeta({
    aoSalvar: (campos) => {
      const meta = criarMeta(campos);
      estado.metas.push(meta);
      salvar(estado);
      modal.close();
      desenharMetas(estado, "Meta criada!");
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Nova meta",
    conteudo: formulario
  });
}

function abrirFormularioEdicaoMeta(estado, meta) {
  const formulario = criarFormularioMeta({
    valoresIniciais: meta,
    rotuloBotao: "Salvar alterações",
    aoSalvar: (campos) => {
      const atualizada = atualizarMeta(estado, meta.id, campos);
      if (atualizada === null) return;

      salvar(estado);
      modal.close();
      desenharMetas(estado, "Meta atualizada!");
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Editar meta",
    conteudo: formulario
  });
}

// --- Detalhes, etapas e tarefas vinculadas ---

function abrirDetalhesMeta(estado, metaId) {
  const conteudo = document.createElement("div");
  const modal = abrirModal({ titulo: "Detalhes da meta", conteudo });
  modal.classList.add("modal-largo");

  // Redesenha só o conteúdo do modal; a tela de metas atrás é atualizada
  // separadamente para refletir o novo progresso nos cartões.
  function redesenhar({ focarNovaEtapa = false } = {}) {
    const meta = encontrarMeta(estado, metaId);
    conteudo.innerHTML = "";

    if (meta === null) {
      modal.close();
      return;
    }

    conteudo.appendChild(criarDetalhesDaMeta(estado, meta, {
      aoAlterar: (opcoes) => {
        salvar(estado);
        desenharMetas(estado);
        redesenhar(opcoes);
      },
      aoEditar: () => {
        modal.close();
        abrirFormularioEdicaoMeta(estado, meta);
      },
      aoFechar: () => modal.close()
    }));

    if (focarNovaEtapa) {
      const campo = conteudo.querySelector(".formulario-etapa input");
      campo?.focus();
    }
  }

  redesenhar();
}

function criarDetalhesDaMeta(estado, meta, acoes) {
  const etapas = Array.isArray(meta.etapas) ? meta.etapas : [];
  const tipo = ROTULOS_TIPO[meta.tipo] ? meta.tipo : "pessoal";
  const situacao = ROTULOS_SITUACAO[meta.situacao] ? meta.situacao : "ativa";
  const tituloId = `meta-detalhes-titulo-${meta.id}`;

  const bloco = document.createElement("div");
  bloco.className = "meta-detalhes";

  const topo = document.createElement("div");
  topo.className = "meta-cartao-topo";

  const seloTipo = document.createElement("span");
  seloTipo.className = "meta-badge meta-badge-tipo";
  seloTipo.textContent = ROTULOS_TIPO[tipo];

  const seloSituacao = document.createElement("span");
  seloSituacao.className = `meta-badge meta-badge-${situacao}`;
  seloSituacao.textContent = ROTULOS_SITUACAO[situacao];

  topo.appendChild(seloTipo);
  topo.appendChild(seloSituacao);

  const titulo = document.createElement("h3");
  titulo.className = "meta-detalhes-titulo";
  titulo.id = tituloId;
  titulo.textContent = meta.titulo;

  bloco.appendChild(topo);
  bloco.appendChild(titulo);

  if (meta.descricao) {
    const descricao = document.createElement("p");
    descricao.className = "meta-detalhes-descricao";
    descricao.textContent = meta.descricao;
    bloco.appendChild(descricao);
  }

  const info = document.createElement("div");
  info.className = "meta-info";

  const prazo = document.createElement("span");
  prazo.textContent = meta.prazo ? `Prazo: ${formatarData(meta.prazo)}` : "Sem prazo";
  info.appendChild(prazo);
  bloco.appendChild(info);

  // Mesma regra dos cartões: a barra financeira é o progresso principal
  // quando a meta é financeira e não há etapas.
  if (etapas.length > 0 || tipo !== "financeira") {
    const rotulo = etapas.length > 0
      ? "Progresso pelas etapas"
      : "Progresso manual";
    bloco.appendChild(criarProgresso(tituloId, calcularProgresso(meta), rotulo));
  }

  if (tipo === "financeira") {
    bloco.appendChild(criarResumoFinanceiro(meta, tituloId));
  }

  bloco.appendChild(criarSecaoDeEtapas(estado, meta, acoes));
  bloco.appendChild(criarSecaoDeTarefas(estado, meta, acoes));
  bloco.appendChild(criarRodapeDosDetalhes(acoes));

  return bloco;
}

function criarSecaoDeEtapas(estado, meta, acoes) {
  const etapas = Array.isArray(meta.etapas) ? meta.etapas : [];
  const concluidas = etapas.filter((etapa) => etapa?.concluida).length;

  const secao = document.createElement("section");
  secao.className = "meta-secao";

  const titulo = document.createElement("h4");
  titulo.className = "meta-secao-titulo";
  titulo.textContent = "Etapas";
  secao.appendChild(titulo);

  const ajuda = document.createElement("p");
  ajuda.className = "meta-ajuda";

  if (etapas.length === 0) {
    ajuda.textContent = meta.tipo === "financeira"
      ? "Sem etapas. A barra financeira é o progresso principal; adicione etapas para acompanhar marcos."
      : `Sem etapas. Vale o progresso manual (${calcularProgresso(meta)}%); ` +
        "use “Editar meta” para ajustá-lo ou adicione etapas para calcular automaticamente.";
  } else {
    ajuda.textContent =
      `${concluidas} de ${etapas.length} etapa(s) concluída(s). ` +
      "O progresso é calculado pelas etapas.";
  }

  secao.appendChild(ajuda);

  if (etapas.length > 0) {
    const lista = document.createElement("ul");
    lista.className = "lista-etapas";

    for (const etapa of etapas) {
      lista.appendChild(criarItemEtapa(estado, meta, etapa, acoes));
    }

    secao.appendChild(lista);
  }

  secao.appendChild(criarFormularioEtapa(estado, meta, acoes));
  return secao;
}

function criarItemEtapa(estado, meta, etapa, acoes) {
  const item = document.createElement("li");
  item.className = `meta-etapa${etapa.concluida ? " concluida" : ""}`;

  const rotulo = document.createElement("label");
  rotulo.className = "meta-etapa-rotulo";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = etapa.concluida === true;

  checkbox.addEventListener("change", () => {
    if (alternarEtapa(estado, meta.id, etapa.id) === null) {
      checkbox.checked = !checkbox.checked;
      return;
    }

    acoes.aoAlterar();
  });

  const texto = document.createElement("span");
  texto.className = "meta-etapa-titulo";
  texto.textContent = etapa.titulo;

  rotulo.appendChild(checkbox);
  rotulo.appendChild(texto);

  const remover = document.createElement("button");
  remover.type = "button";
  remover.className = "botao-icone meta-etapa-remover";
  remover.textContent = "🗑";
  remover.setAttribute("aria-label", `Excluir etapa "${etapa.titulo}"`);

  remover.addEventListener("click", () => {
    if (excluirEtapa(estado, meta.id, etapa.id) === null) return;
    acoes.aoAlterar();
  });

  item.appendChild(rotulo);
  item.appendChild(remover);
  return item;
}

function criarFormularioEtapa(estado, meta, acoes) {
  const formulario = document.createElement("form");
  formulario.className = "formulario-etapa";
  formulario.noValidate = true;

  const entrada = document.createElement("input");
  entrada.type = "text";
  entrada.maxLength = 120;
  entrada.placeholder = "Ex.: Separar o valor mensal";
  entrada.setAttribute("aria-label", "Título da nova etapa");

  const botao = document.createElement("button");
  botao.type = "submit";
  botao.className = "botao-secundario";
  botao.textContent = "Adicionar etapa";

  const erro = document.createElement("p");
  erro.className = "erro-formulario";
  erro.hidden = true;

  entrada.addEventListener("input", () => {
    if (!erro.hidden) erro.hidden = true;
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (entrada.value.trim() === "") {
      erro.textContent = "Digite o título da etapa.";
      erro.hidden = false;
      entrada.focus();
      return;
    }

    if (adicionarEtapa(estado, meta.id, entrada.value) === null) {
      erro.textContent = "Não foi possível adicionar a etapa.";
      erro.hidden = false;
      return;
    }

    acoes.aoAlterar({ focarNovaEtapa: true });
  });

  formulario.appendChild(entrada);
  formulario.appendChild(botao);
  formulario.appendChild(erro);
  return formulario;
}

function criarSecaoDeTarefas(estado, meta, acoes) {
  const tarefas = tarefasDaMeta(estado, meta.id);

  const secao = document.createElement("section");
  secao.className = "meta-secao";

  const titulo = document.createElement("h4");
  titulo.className = "meta-secao-titulo";
  titulo.textContent = "Tarefas vinculadas";
  secao.appendChild(titulo);

  const ajuda = document.createElement("p");
  ajuda.className = "meta-ajuda";

  if (tarefas.length === 0) {
    ajuda.textContent =
      "Nenhuma tarefa vinculada. No formulário de uma tarefa, escolha esta meta em “Meta (opcional)”.";
    secao.appendChild(ajuda);
    return secao;
  }

  ajuda.textContent = tarefas.length === 1
    ? "1 tarefa vinculada. Ela é referência e não altera o progresso."
    : `${tarefas.length} tarefas vinculadas. Elas são referência e não alteram o progresso.`;
  secao.appendChild(ajuda);

  const lista = document.createElement("ul");
  lista.className = "lista-tarefas-meta";

  for (const tarefa of tarefas) {
    lista.appendChild(criarItemTarefaDaMeta(estado, tarefa, acoes));
  }

  secao.appendChild(lista);
  return secao;
}

function criarItemTarefaDaMeta(estado, tarefa, acoes) {
  const item = document.createElement("li");
  item.className = "tarefa-meta";

  const info = document.createElement("div");
  info.className = "tarefa-meta-info";

  const titulo = document.createElement("strong");
  titulo.className = "tarefa-meta-titulo";
  titulo.textContent = tarefa.titulo;

  const detalhes = document.createElement("span");
  detalhes.className = "tarefa-meta-detalhes";

  const partes = [];
  if (tarefa.data) partes.push(formatarData(tarefa.data));
  if (tarefa.horaInicio) partes.push(tarefa.horaInicio);
  if (tarefa.categoria) partes.push(tarefa.categoria);
  if (ehRecorrente(tarefa)) partes.push("↻ recorrente");
  detalhes.textContent = partes.join(" · ") || "Sem data definida";

  info.appendChild(titulo);
  info.appendChild(detalhes);

  const desvincular = document.createElement("button");
  desvincular.type = "button";
  desvincular.className = "botao-discreto";
  desvincular.textContent = "Desvincular";
  desvincular.setAttribute(
    "aria-label",
    `Desvincular a tarefa "${tarefa.titulo}" desta meta`
  );

  desvincular.addEventListener("click", () => {
    if (vincularTarefa(estado, tarefa.id, null) === null) return;
    acoes.aoAlterar();
  });

  item.appendChild(info);
  item.appendChild(desvincular);
  return item;
}

function criarRodapeDosDetalhes(acoes) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-botoes meta-detalhes-acoes";

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "botao-secundario";
  fechar.textContent = "Fechar";
  fechar.addEventListener("click", () => acoes.aoFechar());

  const editar = document.createElement("button");
  editar.type = "button";
  editar.className = "botao-principal";
  editar.textContent = "Editar meta";
  editar.addEventListener("click", () => acoes.aoEditar());

  grupo.appendChild(fechar);
  grupo.appendChild(editar);
  return grupo;
}

// --- Exclusão ---

function confirmarExclusaoMeta(estado, meta) {
  const tarefas = tarefasDaMeta(estado, meta.id);
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent = `Excluir a meta “${meta.titulo}”? Esta ação não pode ser desfeita.`;

  conteudo.appendChild(texto);

  if (tarefas.length > 0) {
    const aviso = document.createElement("p");
    aviso.className = "modal-texto";
    aviso.textContent =
      `${tarefas.length} tarefa(s) estão vinculadas a esta meta. ` +
      "Elas continuarão na agenda, mas ficarão sem meta.";
    conteudo.appendChild(aviso);
  }

  const grupo = criarGrupoDeBotoes([
    {
      rotulo: "Cancelar",
      classe: "botao-secundario",
      aoClicar: () => modal.close()
    },
    {
      rotulo: "Excluir meta",
      classe: "botao-perigo",
      aoClicar: () => {
        excluirMeta(estado, meta.id);
        salvar(estado);
        modal.close();
        desenharMetas(
          estado,
          tarefas.length > 0
            ? "Meta excluída. As tarefas vinculadas continuam na agenda."
            : "Meta excluída."
        );
      }
    }
  ]);

  conteudo.appendChild(grupo);

  const modal = abrirModal({
    titulo: "Excluir meta",
    conteudo
  });
}

// --- Utilidades ---

function ordenarMetas(metas) {
  const ordemSituacao = { ativa: 0, concluida: 1, abandonada: 2 };

  return [...metas].sort((a, b) => {
    const porSituacao =
      (ordemSituacao[a.situacao] ?? 9) - (ordemSituacao[b.situacao] ?? 9);
    if (porSituacao !== 0) return porSituacao;

    const prazoA = a.prazo ?? "9999-12-31";
    const prazoB = b.prazo ?? "9999-12-31";
    const porPrazo = prazoA.localeCompare(prazoB);
    if (porPrazo !== 0) return porPrazo;

    return (a.titulo ?? "").localeCompare(b.titulo ?? "", "pt-BR");
  });
}

function criarBotaoAcao(acao, ariaLabel, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-icone";
  botao.dataset.acao = acao;
  botao.setAttribute("aria-label", ariaLabel);
  botao.addEventListener("click", aoClicar);
  return botao;
}

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
