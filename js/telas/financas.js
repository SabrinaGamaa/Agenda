// Tela de finanças: resumo do mês, lançamentos, contas fixas e projeção.
// As regras ficam em js/regras/financas.js e js/regras/contas-fixas.js;
// esta tela só monta a interface.

import { hojeISO, formatarData } from "../regras/datas.js";
import { formatarCentavos } from "../regras/dinheiro.js";
import {
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
  lancamentosDoMes,
  resumoDoMes,
  resumoDoDia,
  totaisPorCategoria,
  percentualDoTotal,
  compararComMesAnterior,
  possivelDuplicata,
  competenciaDaData,
  competenciaValida,
  somarCompetencias,
  formatarCompetencia
} from "../regras/financas.js";
import {
  contasDoMes,
  resumoContasDoMes,
  registrarPagamento,
  atualizarPagamento,
  excluirPagamento,
  projetarMes
} from "../regras/contas-fixas.js";
import { criarFormularioLancamento } from "../componentes/formulario-lancamento.js";
import { criarFormularioPagamento } from "../componentes/formulario-pagamento.js";
import { abrirModal } from "../componentes/modal.js";
import { salvar } from "../dados/armazenamento.js";
import { desenharContasFixas } from "./contas-fixas.js";

// Mês exibido. Começa no mês atual e só muda pela navegação ‹ ›.
// Fica em memória: ao recarregar, voltamos para o mês atual.
let competenciaAtual = null;

export function desenharFinancas(estado, mensagem = null, competencia = null) {
  if (competencia !== null && competenciaValida(competencia)) {
    competenciaAtual = competencia;
  } else if (competenciaAtual === null) {
    competenciaAtual = competenciaDaData(hojeISO());
  }

  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = "";

  conteudo.appendChild(criarBarra(estado));

  if (mensagem) {
    const aviso = document.createElement("p");
    aviso.className = "mensagem-sucesso";
    aviso.textContent = mensagem;
    conteudo.appendChild(aviso);
  }

  conteudo.appendChild(criarPeriodo(estado));
  conteudo.appendChild(criarResumo(estado));
  conteudo.appendChild(criarCartaoContasDoMes(estado));

  const relatorios = criarRelatorios(estado);
  if (relatorios) {
    conteudo.appendChild(relatorios);
  }

  conteudo.appendChild(criarCartaoProjecao(estado));
  conteudo.appendChild(criarCartaoLista(estado));
}

// --- Barra superior ---

function criarBarra(estado) {
  const barra = document.createElement("div");
  barra.className = "financas-barra";

  const blocoTexto = document.createElement("div");

  const titulo = document.createElement("h2");
  titulo.className = "financas-titulo";
  titulo.textContent = "Finanças";

  const subtitulo = document.createElement("p");
  subtitulo.className = "financas-subtitulo";
  subtitulo.textContent = "Registre receitas e despesas e acompanhe o mês.";

  blocoTexto.appendChild(titulo);
  blocoTexto.appendChild(subtitulo);

  const acoes = document.createElement("div");
  acoes.className = "financas-barra-acoes";

  const contasFixas = document.createElement("button");
  contasFixas.type = "button";
  contasFixas.className = "botao-secundario";
  contasFixas.textContent = "Contas fixas";
  contasFixas.addEventListener("click", () => abrirContasFixas(estado));

  const novo = document.createElement("button");
  novo.type = "button";
  novo.className = "botao-principal";
  novo.textContent = "+ Novo lançamento";
  novo.addEventListener("click", () => abrirFormularioNovoLancamento(estado));

  acoes.appendChild(contasFixas);
  acoes.appendChild(novo);

  barra.appendChild(blocoTexto);
  barra.appendChild(acoes);
  return barra;
}

// Abre o cadastro de contas fixas sem sair da aba Finanças.
function abrirContasFixas(estado) {
  desenharContasFixas(estado, {
    aoVoltar: () => desenharFinancas(estado)
  });
}

// --- Navegação de mês ---

function criarPeriodo(estado) {
  const barra = document.createElement("div");
  barra.className = "financas-periodo";

  barra.appendChild(criarBotaoNavegacao("‹", "Mês anterior", () => {
    irParaCompetencia(estado, somarCompetencias(competenciaAtual, -1));
  }));

  const rotulo = document.createElement("span");
  rotulo.className = "financas-mes";
  rotulo.textContent = formatarCompetencia(competenciaAtual);
  rotulo.setAttribute("aria-live", "polite");
  barra.appendChild(rotulo);

  barra.appendChild(criarBotaoNavegacao("›", "Próximo mês", () => {
    irParaCompetencia(estado, somarCompetencias(competenciaAtual, 1));
  }));

  if (competenciaAtual !== competenciaDaData(hojeISO())) {
    const atual = document.createElement("button");
    atual.type = "button";
    atual.className = "botao-discreto";
    atual.textContent = "Este mês";
    atual.addEventListener("click", () => {
      irParaCompetencia(estado, competenciaDaData(hojeISO()));
    });
    barra.appendChild(atual);
  }

  return barra;
}

function irParaCompetencia(estado, competencia) {
  if (!competencia) return;
  competenciaAtual = competencia;
  desenharFinancas(estado);
}

// --- Resumo do mês ---

function criarResumo(estado) {
  const resumo = resumoDoMes(estado, competenciaAtual);

  const grade = document.createElement("div");
  grade.className = "financas-resumo";

  grade.appendChild(criarCartaoResumo(
    "Receitas",
    resumo.receitasCentavos,
    "receitas",
    "Entradas do mês"
  ));

  grade.appendChild(criarCartaoResumo(
    "Despesas",
    resumo.despesasCentavos,
    "despesas",
    "Saídas do mês"
  ));

  grade.appendChild(criarCartaoResumo(
    "Saldo",
    resumo.saldoCentavos,
    `saldo${classeSaldo(resumo.saldoCentavos)}`,
    "Receitas menos despesas"
  ));

  return grade;
}

function criarCartaoResumo(rotulo, valorCentavos, classe, ajuda) {
  const cartao = document.createElement("section");
  cartao.className = `financas-resumo-card ${classe}`;

  const rotuloElemento = document.createElement("span");
  rotuloElemento.className = "financas-resumo-rotulo";
  rotuloElemento.textContent = rotulo;

  const valor = document.createElement("strong");
  valor.className = "financas-resumo-valor";
  valor.textContent = formatarCentavos(valorCentavos);

  const ajudaElemento = document.createElement("span");
  ajudaElemento.className = "financas-resumo-ajuda";
  ajudaElemento.textContent = ajuda;

  cartao.appendChild(rotuloElemento);
  cartao.appendChild(valor);
  cartao.appendChild(ajudaElemento);
  return cartao;
}

// --- Contas fixas do mês ---

// Card principal: mostra as contas vigentes na competência, o previsto, o pago
// e o que ainda está em aberto. O pagamento gera um lançamento real; por isso
// a edição e a exclusão ficam aqui, não na lista de lançamentos.
function criarCartaoContasDoMes(estado) {
  const cartao = document.createElement("section");
  cartao.className = "cartao conta-mes";

  const contas = contasDoMes(estado, competenciaAtual);
  const resumo = resumoContasDoMes(estado, competenciaAtual);
  const quantidadeCadastradas = (estado.contasFixas ?? []).length;

  const cabecalho = document.createElement("div");
  cabecalho.className = "conta-mes-cabecalho";

  const titulo = document.createElement("h2");
  titulo.textContent = "Contas fixas do mês";

  const contagem = document.createElement("span");
  contagem.className = "conta-mes-contagem";

  if (quantidadeCadastradas === 0) {
    contagem.textContent = "Nenhuma conta cadastrada";
  } else if (contas.length === 0) {
    contagem.textContent = "Nenhuma conta vigente";
  } else {
    const total = resumo.quantidade;
    contagem.textContent =
      `${resumo.quantidadePagas} de ${total} ${total === 1 ? "paga" : "pagas"}`;
  }

  cabecalho.appendChild(titulo);
  cabecalho.appendChild(contagem);
  cartao.appendChild(cabecalho);

  if (quantidadeCadastradas === 0) {
    cartao.appendChild(criarVazioContasDoMes(
      "Nenhuma conta fixa cadastrada. Cadastre aluguel, salário, internet ou outra conta que se repete todo mês.",
      "Cadastrar conta fixa",
      estado
    ));
    return cartao;
  }

  if (contas.length === 0) {
    cartao.appendChild(criarVazioContasDoMes(
      `Nenhuma conta fixa vigente em ${formatarCompetencia(competenciaAtual).toLowerCase()}.`,
      "Gerenciar contas fixas",
      estado
    ));
    return cartao;
  }

  cartao.appendChild(criarResumoContasDoMes(contas, resumo));

  const lista = document.createElement("ul");
  lista.className = "financas-lista conta-mes-lista";

  for (const conta of contas) {
    lista.appendChild(criarItemContaDoMes(estado, conta));
  }

  cartao.appendChild(lista);

  const rodape = document.createElement("div");
  rodape.className = "conta-mes-rodape";

  const gerenciar = document.createElement("button");
  gerenciar.type = "button";
  gerenciar.className = "botao-discreto";
  gerenciar.textContent = "Gerenciar contas fixas";
  gerenciar.addEventListener("click", () => abrirContasFixas(estado));
  rodape.appendChild(gerenciar);

  cartao.appendChild(rodape);
  return cartao;
}

function criarVazioContasDoMes(texto, rotuloBotao, estado) {
  const vazio = document.createElement("div");
  vazio.className = "estado-vazio conta-mes-vazio";

  const mensagem = document.createElement("p");
  mensagem.textContent = texto;

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-principal botao-pequeno";
  botao.textContent = rotuloBotao;
  botao.addEventListener("click", () => abrirContasFixas(estado));

  vazio.appendChild(mensagem);
  vazio.appendChild(botao);
  return vazio;
}

function criarResumoContasDoMes(contas, resumo) {
  const grade = document.createElement("div");
  grade.className = "conta-mes-resumo";

  grade.appendChild(criarBlocoResumoContas(
    "Previsto",
    resumo.saldoPrevistoCentavos,
    "saldo das contas ativas na competência"
  ));

  grade.appendChild(criarBlocoResumoContas(
    "Pago",
    resumo.saldoPagoCentavos,
    "saldo dos pagamentos"
  ));

  const pendentes = resumo.quantidadePendentes;
  grade.appendChild(criarBlocoResumoContas(
    "Em aberto",
    calcularSaldoPendente(contas),
    `${pendentes} ${pendentes === 1 ? "conta pendente" : "contas pendentes"}`
  ));

  return grade;
}

function criarBlocoResumoContas(rotulo, valorCentavos, ajuda) {
  const bloco = document.createElement("div");
  bloco.className = "conta-mes-resumo-item";

  const rotuloElemento = document.createElement("span");
  rotuloElemento.className = "conta-mes-resumo-rotulo";
  rotuloElemento.textContent = rotulo;

  const valor = document.createElement("strong");
  valor.className = `conta-mes-resumo-valor${classeSaldo(valorCentavos)}`;
  valor.textContent = formatarCentavos(valorCentavos);

  const ajudaElemento = document.createElement("span");
  ajudaElemento.className = "conta-mes-resumo-ajuda";
  ajudaElemento.textContent = ajuda;

  bloco.appendChild(rotuloElemento);
  bloco.appendChild(valor);
  bloco.appendChild(ajudaElemento);
  return bloco;
}

// Soma somente as contas ainda não pagas: é o que falta realizar na competência.
// Receitas entram positivas e despesas negativas, como no saldo do mês.
function calcularSaldoPendente(contas) {
  let total = 0;

  for (const conta of contas) {
    if (!conta.vigente || conta.pago) continue;

    const valor = Number(conta.valorPrevistoCentavos) || 0;
    total += conta.tipo === "receita" ? valor : -valor;
  }

  return total;
}

function criarItemContaDoMes(estado, conta) {
  const tipo = conta.tipo === "receita" ? "receita" : "despesa";

  const item = document.createElement("li");
  item.className = `financas-item conta-mes-item ${tipo}`;
  item.dataset.contaId = conta.id;

  const info = document.createElement("div");
  info.className = "financas-item-info";

  const nome = document.createElement("strong");
  nome.className = "financas-item-descricao";
  nome.textContent = conta.nome ?? "Conta fixa";

  const detalhes = document.createElement("span");
  detalhes.className = "financas-item-detalhes";

  const partes = [];
  if (conta.ativa === false) partes.push("Inativa");
  else if (!conta.vigente) partes.push("Fora do período");
  if (conta.categoria) partes.push(conta.categoria);
  if (conta.dataVencimento) {
    partes.push(`vence ${formatarData(conta.dataVencimento)}`);
  }

  if (conta.pago && conta.pagamento) {
    partes.push(`pago em ${formatarData(conta.pagamento.dataPagamento)}`);

    if (conta.pagamento.valorPagoCentavos !== conta.valorPrevistoCentavos) {
      partes.push(`valor pago ${formatarCentavos(conta.pagamento.valorPagoCentavos)}`);
    }
  }

  detalhes.textContent = partes.join(" · ") || "Sem categoria";

  info.appendChild(nome);
  info.appendChild(detalhes);

  const sinal = tipo === "receita" ? "+" : "−";

  const valor = document.createElement("span");
  valor.className = `financas-item-valor ${tipo}`;
  valor.textContent = `${sinal} ${formatarCentavos(conta.valorPrevistoCentavos)}`;

  const status = document.createElement("span");
  status.className = `conta-mes-status ${conta.pago ? "pago" : "pendente"}`;
  status.textContent = conta.pago ? "Pago" : "Em aberto";

  const acoes = document.createElement("div");
  acoes.className = "financas-item-acoes";

  if (conta.pago && conta.pagamento) {
    const nomeConta = conta.nome ?? "conta fixa";

    acoes.appendChild(criarBotaoAcao(
      "editar",
      `Editar o pagamento de "${nomeConta}"`,
      () => abrirFormularioEdicaoPagamento(estado, conta, conta.pagamento)
    ));

    acoes.appendChild(criarBotaoAcao(
      "excluir",
      `Excluir o pagamento de "${nomeConta}"`,
      () => confirmarExclusaoPagamento(estado, conta, conta.pagamento)
    ));
  } else if (conta.vigente) {
    const pagar = document.createElement("button");
    pagar.type = "button";
    pagar.className = "botao-principal botao-pequeno";
    pagar.textContent = "Pagar";
    pagar.addEventListener("click", () => abrirFormularioNovoPagamento(estado, conta));
    acoes.appendChild(pagar);
  }

  item.appendChild(info);
  item.appendChild(valor);
  item.appendChild(status);

  if (acoes.childElementCount > 0) {
    item.appendChild(acoes);
  }

  return item;
}

// --- Projeção do próximo mês ---

// A competência projetada é sempre a seguinte à exibida. O bloco previsto é
// uma estimativa (contas fixas ativas + média variável); o realizado contém
// apenas lançamentos já registrados no mês alvo. Os dois nunca são somados.
function criarCartaoProjecao(estado) {
  const competenciaProjetada = somarCompetencias(competenciaAtual, 1);
  const projecao = projetarMes(estado, competenciaProjetada);

  const cartao = document.createElement("section");
  cartao.className = "cartao projecao";

  if (!projecao) {
    const aviso = document.createElement("p");
    aviso.className = "projecao-aviso";
    aviso.textContent = "Não foi possível calcular a projeção do próximo mês.";
    cartao.appendChild(aviso);
    return cartao;
  }

  const cabecalho = document.createElement("div");
  cabecalho.className = "projecao-cabecalho";

  const blocoTitulo = document.createElement("div");

  const titulo = document.createElement("h2");
  titulo.textContent = "Projeção do próximo mês";

  const subtitulo = document.createElement("p");
  subtitulo.className = "projecao-subtitulo";
  subtitulo.textContent =
    `${formatarCompetencia(competenciaProjetada)} · previsto separado do realizado.`;

  blocoTitulo.appendChild(titulo);
  blocoTitulo.appendChild(subtitulo);

  const abrirMes = document.createElement("button");
  abrirMes.type = "button";
  abrirMes.className = "botao-discreto";
  abrirMes.textContent = `Ver ${nomeDoMes(competenciaProjetada)}`;
  abrirMes.setAttribute(
    "aria-label",
    `Ir para ${formatarCompetencia(competenciaProjetada)}`
  );
  abrirMes.addEventListener("click", () => {
    irParaCompetencia(estado, competenciaProjetada);
  });

  cabecalho.appendChild(blocoTitulo);
  cabecalho.appendChild(abrirMes);
  cartao.appendChild(cabecalho);

  const semDados =
    projecao.contasFixas.quantidade === 0 &&
    !projecao.incluiVariaveis &&
    projecao.realizado.quantidadeLancamentos === 0;

  if (semDados) {
    cartao.appendChild(criarVazioProjecao(estado, competenciaProjetada));
    return cartao;
  }

  const grade = document.createElement("div");
  grade.className = "projecao-grade";

  grade.appendChild(criarBlocoProjecao({
    titulo: "Previsto",
    selo: "estimativa",
    classe: "previsto",
    receitasCentavos: projecao.receitasPrevistasCentavos,
    despesasCentavos: projecao.despesasPrevistasCentavos,
    saldoCentavos: projecao.saldoPrevistoCentavos,
    ajuda: projecao.incluiVariaveis
      ? "Contas fixas ativas + média variável."
      : "Contas fixas ativas; sem histórico variável suficiente."
  }));

  const realizado = projecao.realizado;
  const quantidade = realizado.quantidadeLancamentos;

  grade.appendChild(criarBlocoProjecao({
    titulo: "Realizado",
    selo: "registros",
    classe: "realizado",
    receitasCentavos: realizado.receitasCentavos,
    despesasCentavos: realizado.despesasCentavos,
    saldoCentavos: realizado.saldoCentavos,
    ajuda: quantidade === 0
      ? "Nenhum lançamento com data no mês alvo ainda."
      : `${quantidade} ${quantidade === 1 ? "lançamento" : "lançamentos"} com data no mês alvo.`
  }));

  cartao.appendChild(grade);
  cartao.appendChild(criarBaseProjecao(projecao));
  return cartao;
}

function criarVazioProjecao(estado, competencia) {
  const vazio = document.createElement("div");
  vazio.className = "estado-vazio projecao-vazio";

  const mensagem = document.createElement("p");
  mensagem.textContent =
    `Ainda não há dados para projetar ${formatarCompetencia(competencia).toLowerCase()}. ` +
    "Cadastre contas fixas ou registre lançamentos variáveis.";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-principal botao-pequeno";
  botao.textContent = "Gerenciar contas fixas";
  botao.addEventListener("click", () => abrirContasFixas(estado));

  vazio.appendChild(mensagem);
  vazio.appendChild(botao);
  return vazio;
}

function criarBlocoProjecao({
  titulo,
  selo,
  classe,
  receitasCentavos,
  despesasCentavos,
  saldoCentavos,
  ajuda
}) {
  const bloco = document.createElement("section");
  bloco.className = `projecao-bloco ${classe}`;

  const topo = document.createElement("div");
  topo.className = "projecao-bloco-topo";

  const rotulo = document.createElement("h3");
  rotulo.className = "projecao-bloco-titulo";
  rotulo.textContent = titulo;

  const seloElemento = document.createElement("span");
  seloElemento.className = "projecao-selo";
  seloElemento.textContent = selo;

  topo.appendChild(rotulo);
  topo.appendChild(seloElemento);

  const linhas = document.createElement("dl");
  linhas.className = "projecao-linhas";
  linhas.appendChild(criarLinhaProjecao("Receitas", receitasCentavos, "receita"));
  linhas.appendChild(criarLinhaProjecao("Despesas", despesasCentavos, "despesa"));
  linhas.appendChild(criarLinhaProjecao("Saldo", saldoCentavos, "saldo"));

  const ajudaElemento = document.createElement("p");
  ajudaElemento.className = "projecao-bloco-ajuda";
  ajudaElemento.textContent = ajuda;

  bloco.appendChild(topo);
  bloco.appendChild(linhas);
  bloco.appendChild(ajudaElemento);
  return bloco;
}

function criarLinhaProjecao(rotulo, valorCentavos, tipo) {
  const linha = document.createElement("div");
  linha.className = "projecao-linha";

  const nome = document.createElement("dt");
  nome.className = "projecao-linha-rotulo";
  nome.textContent = rotulo;

  const valor = document.createElement("dd");
  const classeValor = tipo === "saldo"
    ? `saldo${classeSaldo(valorCentavos)}`
    : tipo;
  valor.className = `projecao-linha-valor ${classeValor}`;
  valor.textContent = formatarCentavos(valorCentavos);

  linha.appendChild(nome);
  linha.appendChild(valor);
  return linha;
}

function criarBaseProjecao(projecao) {
  const base = document.createElement("div");
  base.className = "projecao-base";

  const titulo = document.createElement("h3");
  titulo.className = "projecao-base-titulo";
  titulo.textContent = "Como calculamos";
  base.appendChild(titulo);

  const fixas = projecao.contasFixas;
  const linhaFixas = document.createElement("p");
  linhaFixas.className = "projecao-base-linha";

  if (fixas.quantidade === 0) {
    linhaFixas.textContent = "Contas fixas: nenhuma conta ativa no mês alvo.";
  } else {
    linhaFixas.textContent =
      `Contas fixas: ${fixas.quantidade} ${fixas.quantidade === 1 ? "ativa" : "ativas"} · ` +
      `receitas ${formatarCentavos(fixas.receitasCentavos)} · ` +
      `despesas ${formatarCentavos(fixas.despesasCentavos)}.`;
  }

  base.appendChild(linhaFixas);

  if (projecao.incluiVariaveis) {
    const variaveis = projecao.variaveis;
    const linhaVariaveis = document.createElement("p");
    linhaVariaveis.className = "projecao-base-linha";
    linhaVariaveis.textContent =
      `Variáveis: ${descreverMediaVariavel(variaveis)} · ` +
      `receitas ${formatarCentavos(variaveis.receitasCentavos)} · ` +
      `despesas ${formatarCentavos(variaveis.despesasCentavos)}.`;
    base.appendChild(linhaVariaveis);
  } else {
    const aviso = document.createElement("p");
    aviso.className = "projecao-aviso";
    aviso.textContent =
      "Histórico insuficiente para variáveis: a projeção inclui apenas as contas fixas. " +
      "Registre lançamentos manuais em meses anteriores para ativar a média.";
    base.appendChild(aviso);
  }

  const nota = document.createElement("p");
  nota.className = "projecao-nota";
  nota.textContent =
    "Previsto e realizado são blocos independentes; os valores não são somados.";
  base.appendChild(nota);

  return base;
}

function descreverMediaVariavel(variaveis) {
  const quantidade = variaveis.mesesUsados;

  if (quantidade === 3) {
    return "média dos últimos 3 meses com movimento";
  }

  const rotulo = quantidade === 1 ? "mês com movimento" : "meses com movimento";
  return `média de ${quantidade} ${rotulo} na janela de 3 meses`;
}

function nomeDoMes(competencia) {
  return formatarCompetencia(competencia).split(" de ")[0].toLowerCase();
}

// --- Relatórios do mês ---

// Monta os cartões de categoria e comparação somente quando há algo para mostrar.
// Se o mês atual e o anterior estão vazios, a tela fica limpa (só o estado vazio).
function criarRelatorios(estado) {
  const comparacao = compararComMesAnterior(estado, competenciaAtual);
  if (comparacao === null) return null;

  const resumo = resumoDoMes(estado, competenciaAtual);
  const anteriorTemMovimento =
    comparacao.receitas.anteriorCentavos !== 0 ||
    comparacao.despesas.anteriorCentavos !== 0;

  if (resumo.quantidadeLancamentos === 0 && !anteriorTemMovimento) {
    return null;
  }

  const despesas = totaisPorCategoria(estado, competenciaAtual, "despesa")
    .filter((item) => item.totalCentavos > 0);
  const receitas = totaisPorCategoria(estado, competenciaAtual, "receita")
    .filter((item) => item.totalCentavos > 0);

  const grade = document.createElement("div");
  grade.className = "financas-relatorios";

  if (despesas.length > 0 || receitas.length > 0) {
    grade.appendChild(criarCartaoCategorias({ despesas, receitas, resumo }));
  }

  grade.appendChild(criarCartaoComparacao(comparacao));
  return grade;
}

function criarCartaoCategorias({ despesas, receitas, resumo }) {
  const cartao = document.createElement("section");
  cartao.className = "cartao financas-relatorio";

  const titulo = document.createElement("h2");
  titulo.textContent = "Por categoria";

  const ajuda = document.createElement("p");
  ajuda.className = "financas-relatorio-ajuda";
  ajuda.textContent =
    "Participação de cada categoria no total de despesas ou receitas do mês.";

  cartao.appendChild(titulo);
  cartao.appendChild(ajuda);

  if (despesas.length > 0) {
    cartao.appendChild(criarBlocoCategorias(
      "despesas",
      despesas,
      resumo.despesasCentavos
    ));
  }

  if (receitas.length > 0) {
    cartao.appendChild(criarBlocoCategorias(
      "receitas",
      receitas,
      resumo.receitasCentavos
    ));
  }

  return cartao;
}

function criarBlocoCategorias(tipo, itens, totalCentavos) {
  const bloco = document.createElement("section");
  bloco.className = "financas-categoria-bloco";

  const titulo = document.createElement("h3");
  titulo.className = `financas-categoria-titulo ${tipo}`;
  titulo.textContent = tipo === "despesas" ? "Despesas" : "Receitas";

  const lista = document.createElement("ul");
  lista.className = "financas-categoria-lista";

  for (const item of itens) {
    lista.appendChild(criarItemCategoria(item, totalCentavos, tipo));
  }

  bloco.appendChild(titulo);
  bloco.appendChild(lista);
  return bloco;
}

function criarItemCategoria(item, totalCentavos, tipo) {
  const percentual = percentualDoTotal(item.totalCentavos, totalCentavos) ?? 0;

  const elemento = document.createElement("li");
  elemento.className = `financas-categoria-item ${item.tipo}`;

  const topo = document.createElement("div");
  topo.className = "financas-categoria-topo";

  const nome = document.createElement("span");
  nome.className = "financas-categoria-nome";
  nome.textContent = item.categoria;

  const valor = document.createElement("span");
  valor.className = "financas-categoria-valor";
  valor.textContent = formatarCentavos(item.totalCentavos);

  topo.appendChild(nome);
  topo.appendChild(valor);

  const barra = document.createElement("div");
  barra.className = "financas-categoria-barra";
  barra.setAttribute("aria-hidden", "true");

  const preenchimento = document.createElement("span");
  preenchimento.style.width =
    `${Math.min(Math.max(percentual, 1), 100)}%`;
  barra.appendChild(preenchimento);

  const detalhe = document.createElement("div");
  detalhe.className = "financas-categoria-detalhe";

  const participacao = document.createElement("span");
  participacao.textContent = `${formatarPercentual(percentual)}% das ${tipo}`;

  const quantidade = document.createElement("span");
  quantidade.textContent =
    `${item.quantidade} ${item.quantidade === 1 ? "lançamento" : "lançamentos"}`;

  detalhe.appendChild(participacao);
  detalhe.appendChild(quantidade);

  elemento.appendChild(topo);
  elemento.appendChild(barra);
  elemento.appendChild(detalhe);
  return elemento;
}

function criarCartaoComparacao(comparacao) {
  const cartao = document.createElement("section");
  cartao.className = "cartao financas-relatorio";

  const titulo = document.createElement("h2");
  titulo.textContent = "Comparação com o mês anterior";

  const ajuda = document.createElement("p");
  ajuda.className = "financas-relatorio-ajuda";
  ajuda.textContent =
    `Contra ${formatarCompetencia(comparacao.competenciaAnterior).toLowerCase()}.`;

  const lista = document.createElement("ul");
  lista.className = "financas-comparacao-lista";

  const linhas = [
    { rotulo: "Receitas", bloco: comparacao.receitas, tipo: "receitas" },
    { rotulo: "Despesas", bloco: comparacao.despesas, tipo: "despesas" },
    { rotulo: "Saldo", bloco: comparacao.saldo, tipo: "saldo" }
  ];

  let temSemBase = false;

  for (const linha of linhas) {
    if (linha.bloco.percentual === null) temSemBase = true;
    lista.appendChild(criarLinhaComparacao(linha));
  }

  cartao.appendChild(titulo);
  cartao.appendChild(ajuda);
  cartao.appendChild(lista);

  const rodape = document.createElement("div");
  rodape.className = "financas-comparacao-rodape";

  const legenda = document.createElement("p");
  legenda.textContent = "Cores: verde = melhora; vermelho = piora.";
  rodape.appendChild(legenda);

  if (temSemBase) {
    const nota = document.createElement("p");
    nota.className = "financas-comparacao-nota";
    nota.textContent =
      "Sem base = não houve movimento no mês anterior nesse grupo.";
    rodape.appendChild(nota);
  }

  cartao.appendChild(rodape);
  return cartao;
}

function criarLinhaComparacao({ rotulo, bloco, tipo }) {
  const item = document.createElement("li");
  item.className = "financas-comparacao-item";

  const topo = document.createElement("div");
  topo.className = "financas-comparacao-topo";

  const nome = document.createElement("span");
  nome.className = "financas-comparacao-rotulo";
  nome.textContent = rotulo;

  const atual = document.createElement("span");
  atual.className = "financas-comparacao-atual";
  atual.textContent = formatarCentavos(bloco.atualCentavos);

  topo.appendChild(nome);
  topo.appendChild(atual);

  const base = document.createElement("div");
  base.className = "financas-comparacao-base";

  const anterior = document.createElement("span");
  anterior.textContent = `Antes: ${formatarCentavos(bloco.anteriorCentavos)}`;

  const variacao = document.createElement("span");
  variacao.className =
    `financas-comparacao-variacao${classeVariacaoComparacao(bloco, tipo)}`;
  variacao.textContent = formatarVariacaoComparacao(bloco);

  base.appendChild(anterior);
  base.appendChild(variacao);

  item.appendChild(topo);
  item.appendChild(base);
  return item;
}

// Verde quando a mudança é boa, vermelho quando é ruim.
// Em despesas, cair é bom; em receitas e saldo, subir é bom.
function classeVariacaoComparacao(bloco, tipo) {
  if (bloco.diferencaCentavos === 0) return "";

  const melhorou = tipo === "despesas"
    ? bloco.diferencaCentavos < 0
    : bloco.diferencaCentavos > 0;

  return melhorou ? " positivo" : " negativo";
}

function formatarVariacaoComparacao(bloco) {
  if (bloco.diferencaCentavos === 0) {
    return "sem variação";
  }

  const subiu = bloco.diferencaCentavos > 0;
  const seta = subiu ? "↑" : "↓";
  const sinal = subiu ? "+" : "−";
  const valor = `${sinal}${formatarCentavos(Math.abs(bloco.diferencaCentavos))}`;

  let percentual;

  if (bloco.percentual === null) {
    percentual = "sem base";
  } else if (bloco.percentual === 0) {
    percentual = "menos de 0,1%";
  } else {
    const sinalPercentual = bloco.percentual > 0 ? "+" : "−";
    percentual =
      `${sinalPercentual}${formatarPercentual(Math.abs(bloco.percentual))}%`;
  }

  return `${seta} ${valor} (${percentual})`;
}

function formatarPercentual(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 1
  });
}

// --- Lista de lançamentos ---

function criarCartaoLista(estado) {
  const cartao = document.createElement("section");
  cartao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = "Lançamentos do mês";
  cartao.appendChild(titulo);

  const lancamentos = lancamentosDoMes(estado, competenciaAtual);

  if (lancamentos.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "estado-vazio";
    vazio.textContent =
      `Nenhum lançamento em ${formatarCompetencia(competenciaAtual).toLowerCase()}. ` +
      "Use “+ Novo lançamento” para começar.";
    cartao.appendChild(vazio);
    return cartao;
  }

  const ajuda = document.createElement("p");
  ajuda.className = "financas-ajuda";
  ajuda.textContent =
    "Agrupados por dia. O saldo do dia é receitas menos despesas.";
  cartao.appendChild(ajuda);

  for (const [dataISO, itens] of agruparPorData(lancamentos)) {
    cartao.appendChild(criarGrupoDoDia(estado, dataISO, itens));
  }

  return cartao;
}

function agruparPorData(lancamentos) {
  const grupos = new Map();

  for (const lancamento of lancamentos) {
    if (!grupos.has(lancamento.data)) {
      grupos.set(lancamento.data, []);
    }
    grupos.get(lancamento.data).push(lancamento);
  }

  // Mais recente primeiro: é o que a pessoa acabou de registrar.
  return [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function criarGrupoDoDia(estado, dataISO, lancamentos) {
  const grupo = document.createElement("section");
  grupo.className = "financas-grupo";

  const resumo = resumoDoDia(estado, dataISO);

  const cabecalho = document.createElement("div");
  cabecalho.className = "financas-grupo-cabecalho";

  const data = document.createElement("span");
  data.className = "financas-grupo-data";
  data.textContent = rotuloDoDia(dataISO);

  const total = document.createElement("span");
  total.className = `financas-grupo-total${classeSaldo(resumo.saldoCentavos)}`;
  total.textContent = `Saldo do dia: ${formatarCentavos(resumo.saldoCentavos)}`;

  cabecalho.appendChild(data);
  cabecalho.appendChild(total);

  const lista = document.createElement("ul");
  lista.className = "financas-lista";

  for (const lancamento of lancamentos) {
    lista.appendChild(criarItemLancamento(estado, lancamento));
  }

  grupo.appendChild(cabecalho);
  grupo.appendChild(lista);
  return grupo;
}

function criarItemLancamento(estado, lancamento) {
  const item = document.createElement("li");
  item.className = `financas-item ${lancamento.tipo}`;

  const info = document.createElement("div");
  info.className = "financas-item-info";

  const descricao = document.createElement("strong");
  descricao.className = "financas-item-descricao";
  descricao.textContent = lancamento.descricao ?? "Sem descrição";

  const detalhes = document.createElement("span");
  detalhes.className = "financas-item-detalhes";

  const partes = [];
  if (lancamento.categoria) partes.push(lancamento.categoria);
  if (lancamento.origem === "pagamento") partes.push("conta fixa");
  detalhes.textContent = partes.join(" · ") || "Sem categoria";

  info.appendChild(descricao);
  info.appendChild(detalhes);

  const sinal = lancamento.tipo === "receita" ? "+" : "−";

  const valor = document.createElement("span");
  valor.className = `financas-item-valor ${lancamento.tipo}`;
  valor.textContent = `${sinal} ${formatarCentavos(lancamento.valorCentavos)}`;

  const acoes = document.createElement("div");
  acoes.className = "financas-item-acoes";

  // Lançamentos gerados por pagamento são gerenciados no card de contas fixas.
  // Não oferecemos edição/exclusão direta para manter pagamento e lançamento
  // sempre sincronizados.
  if (lancamento.origem !== "pagamento") {
    acoes.appendChild(criarBotaoAcao(
      "editar",
      `Editar o lançamento "${lancamento.descricao ?? "sem descrição"}"`,
      () => abrirFormularioEdicaoLancamento(estado, lancamento)
    ));

    acoes.appendChild(criarBotaoAcao(
      "excluir",
      `Excluir o lançamento "${lancamento.descricao ?? "sem descrição"}"`,
      () => confirmarExclusao(estado, lancamento)
    ));
  }

  item.appendChild(info);
  item.appendChild(valor);

  if (acoes.childElementCount > 0) {
    item.appendChild(acoes);
  }

  return item;
}

// --- Criação e edição ---

function abrirFormularioNovoLancamento(estado) {
  const formulario = criarFormularioLancamento({
    categorias: estado.config.categoriasFinancas,
    dataPadrao: dataPadraoDoMes(),
    verificarDuplicata: (campos) => possivelDuplicata(estado, campos),
    aoSalvar: (campos) => {
      const lancamento = criarLancamento(campos);
      estado.lancamentos.push(lancamento);
      salvar(estado);
      modal.close();

      // Se a data for de outro mês, acompanha o lançamento.
      competenciaAtual = competenciaDaData(lancamento.data) ?? competenciaAtual;
      desenharFinancas(estado, "Lançamento adicionado!");
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Novo lançamento",
    conteudo: formulario
  });

  formulario.querySelector("select, input")?.focus();
}

function abrirFormularioEdicaoLancamento(estado, lancamento) {
  if (lancamento.origem === "pagamento") return;

  const formulario = criarFormularioLancamento({
    categorias: estado.config.categoriasFinancas,
    valoresIniciais: lancamento,
    dataPadrao: dataPadraoDoMes(),
    rotuloBotao: "Salvar alterações",
    verificarDuplicata: (campos) =>
      possivelDuplicata(estado, campos, lancamento.id),
    aoSalvar: (campos) => {
      const atualizado = atualizarLancamento(estado, lancamento.id, campos);
      if (atualizado === null) return;

      salvar(estado);
      modal.close();
      competenciaAtual = competenciaDaData(atualizado.data) ?? competenciaAtual;
      desenharFinancas(estado, "Lançamento atualizado!");
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Editar lançamento",
    conteudo: formulario
  });

  formulario.querySelector("select, input")?.focus();
}

// --- Pagamentos de contas fixas ---

function abrirFormularioNovoPagamento(estado, conta) {
  const formulario = criarFormularioPagamento({
    conta,
    competencia: competenciaAtual,
    dataPadrao: dataPadraoPagamento(conta),
    aoSalvar: (campos) => {
      const resultado = registrarPagamento(estado, {
        contaFixaId: conta.id,
        competencia: competenciaAtual,
        ...campos
      });

      if (!resultado.sucesso) return resultado;

      salvar(estado);
      modal.close();
      desenharFinancas(estado, "Pagamento registrado!");
      return resultado;
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Pagar conta fixa",
    conteudo: formulario
  });

  const campoValor = formulario.querySelector('input[inputmode="decimal"]');
  campoValor?.focus();
  campoValor?.select();
}

function abrirFormularioEdicaoPagamento(estado, conta, pagamento) {
  const formulario = criarFormularioPagamento({
    conta,
    competencia: competenciaAtual,
    valoresIniciais: pagamento,
    rotuloBotao: "Salvar alterações",
    aoSalvar: (campos) => {
      const resultado = atualizarPagamento(estado, pagamento.id, campos);

      if (!resultado.sucesso) return resultado;

      salvar(estado);
      modal.close();
      desenharFinancas(estado, "Pagamento atualizado!");
      return resultado;
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Editar pagamento",
    conteudo: formulario
  });

  const campoValor = formulario.querySelector('input[inputmode="decimal"]');
  campoValor?.focus();
  campoValor?.select();
}

function confirmarExclusaoPagamento(estado, conta, pagamento) {
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent =
    `Excluir o pagamento de “${conta.nome ?? "conta fixa"}” ` +
    `de ${formatarCentavos(pagamento.valorPagoCentavos)} em ${formatarData(pagamento.dataPagamento)}? ` +
    "O lançamento vinculado também será removido. Esta ação não pode ser desfeita.";
  conteudo.appendChild(texto);

  const erro = document.createElement("p");
  erro.className = "erro-formulario";
  erro.hidden = true;
  erro.setAttribute("role", "alert");
  conteudo.appendChild(erro);

  const grupo = criarGrupoDeBotoes([
    {
      rotulo: "Cancelar",
      classe: "botao-secundario",
      aoClicar: () => modal.close()
    },
    {
      rotulo: "Excluir pagamento",
      classe: "botao-perigo",
      aoClicar: () => {
        const resultado = excluirPagamento(estado, pagamento.id);

        if (!resultado.sucesso) {
          erro.textContent = resultado.erros.join(" ");
          erro.hidden = false;
          return;
        }

        salvar(estado);
        modal.close();
        desenharFinancas(estado, "Pagamento excluído.");
      }
    }
  ]);

  conteudo.appendChild(grupo);

  const modal = abrirModal({
    titulo: "Excluir pagamento",
    conteudo
  });
}

// --- Exclusão ---

function confirmarExclusao(estado, lancamento) {
  if (lancamento.origem === "pagamento") return;

  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  texto.textContent =
    `Excluir o lançamento “${lancamento.descricao ?? "sem descrição"}” ` +
    `de ${formatarCentavos(lancamento.valorCentavos)} em ${formatarData(lancamento.data)}? ` +
    "Esta ação não pode ser desfeita.";
  conteudo.appendChild(texto);

  const grupo = criarGrupoDeBotoes([
    {
      rotulo: "Cancelar",
      classe: "botao-secundario",
      aoClicar: () => modal.close()
    },
    {
      rotulo: "Excluir lançamento",
      classe: "botao-perigo",
      aoClicar: () => {
        excluirLancamento(estado, lancamento.id);
        salvar(estado);
        modal.close();
        desenharFinancas(estado, "Lançamento excluído.");
      }
    }
  ]);

  conteudo.appendChild(grupo);

  const modal = abrirModal({
    titulo: "Excluir lançamento",
    conteudo
  });
}

// --- Utilidades ---

// Se o mês exibido for o atual, sugere hoje; senão, o primeiro dia do mês.
function dataPadraoDoMes() {
  const hoje = hojeISO();
  return competenciaDaData(hoje) === competenciaAtual ? hoje : `${competenciaAtual}-01`;
}

// No mês atual, o pagamento começa com a data de hoje; em outro mês, com o
// vencimento da conta (o usuário pode ajustar para a data real).
function dataPadraoPagamento(conta) {
  const hoje = hojeISO();
  if (competenciaDaData(hoje) === competenciaAtual) return hoje;
  return conta.dataVencimento ?? `${competenciaAtual}-01`;
}

// "2026-10-24" -> "24/10/2026 · sábado"
function rotuloDoDia(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const nomeDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
    .format(new Date(ano, mes - 1, dia));

  return `${formatarData(dataISO)} · ${nomeDia}`;
}

function classeSaldo(valor) {
  if (valor > 0) return " positivo";
  if (valor < 0) return " negativo";
  return "";
}

function criarBotaoNavegacao(texto, ariaLabel, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-icone";
  botao.setAttribute("aria-label", ariaLabel);
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
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
