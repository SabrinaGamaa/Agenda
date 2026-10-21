// Tela de metas: lista em cartões + criação, edição e exclusão.
// As regras ficam em js/regras/metas.js; esta tela só monta a interface.

import {
  criarMeta,
  atualizarMeta,
  excluirMeta,
  calcularProgresso,
  progressoFinanceiro,
  tarefasDaMeta
} from "../regras/metas.js";
import { formatarCentavos } from "../regras/dinheiro.js";
import { formatarData } from "../regras/datas.js";
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
