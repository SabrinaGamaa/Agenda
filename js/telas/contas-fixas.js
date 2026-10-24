// Tela de contas fixas: cadastro, edição, ativação/desativação e exclusão.
// Pagamentos e vencimentos do mês entram na etapa seguinte; aqui o foco é
// manter o cadastro do que deve acontecer todo mês.
// As regras ficam em js/regras/contas-fixas.js.

import { formatarData } from "../regras/datas.js";
import { formatarCentavos } from "../regras/dinheiro.js";
import {
  criarContaFixa,
  atualizarContaFixa,
  excluirContaFixa,
  pagamentosDaConta
} from "../regras/contas-fixas.js";
import { criarFormularioContaFixa } from "../componentes/formulario-conta-fixa.js";
import { abrirModal } from "../componentes/modal.js";
import { salvar } from "../dados/armazenamento.js";

const ROTULOS_TIPO = {
  despesa: "Despesa",
  receita: "Receita"
};

export function desenharContasFixas(
  estado,
  { mensagem = null, aoVoltar = null } = {}
) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = "";

  conteudo.appendChild(criarBarra(estado, aoVoltar));

  if (mensagem) {
    const aviso = document.createElement("p");
    aviso.className = "mensagem-sucesso";
    aviso.textContent = mensagem;
    conteudo.appendChild(aviso);
  }

  const contas = ordenarContas(estado.contasFixas ?? []);

  if (contas.length === 0) {
    conteudo.appendChild(criarEstadoVazio(estado, aoVoltar));
    return;
  }

  conteudo.appendChild(criarCartaoLista(estado, contas, aoVoltar));
}

// --- Barra superior ---

function criarBarra(estado, aoVoltar) {
  const barra = document.createElement("div");
  barra.className = "financas-barra";

  const blocoTexto = document.createElement("div");

  const titulo = document.createElement("h2");
  titulo.className = "financas-titulo";
  titulo.textContent = "Contas fixas";

  const subtitulo = document.createElement("p");
  subtitulo.className = "financas-subtitulo";
  subtitulo.textContent =
    "O que deve acontecer todo mês. Ative ou desative quando precisar.";

  blocoTexto.appendChild(titulo);
  blocoTexto.appendChild(subtitulo);

  const acoes = document.createElement("div");
  acoes.className = "financas-barra-acoes";

  if (typeof aoVoltar === "function") {
    const voltar = document.createElement("button");
    voltar.type = "button";
    voltar.className = "botao-secundario";
    voltar.textContent = "‹ Voltar";
    voltar.addEventListener("click", () => aoVoltar());
    acoes.appendChild(voltar);
  }

  const nova = document.createElement("button");
  nova.type = "button";
  nova.className = "botao-principal";
  nova.textContent = "+ Nova conta fixa";
  nova.addEventListener("click", () => abrirFormularioNovaConta(estado, aoVoltar));
  acoes.appendChild(nova);

  barra.appendChild(blocoTexto);
  barra.appendChild(acoes);
  return barra;
}

// --- Estado vazio ---

function criarEstadoVazio(estado, aoVoltar) {
  const vazio = document.createElement("div");
  vazio.className = "estado-vazio";

  const texto = document.createElement("p");
  texto.textContent =
    "Nenhuma conta fixa cadastrada ainda. Comece por aluguel, salário, " +
    "internet ou outra conta que se repete todo mês.";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-secundario";
  botao.textContent = "Criar primeira conta fixa";
  botao.addEventListener("click", () => abrirFormularioNovaConta(estado, aoVoltar));

  vazio.appendChild(texto);
  vazio.appendChild(botao);
  return vazio;
}

// --- Lista ---

function criarCartaoLista(estado, contas, aoVoltar) {
  const cartao = document.createElement("section");
  cartao.className = "cartao";

  const titulo = document.createElement("h2");
  titulo.textContent = "Contas cadastradas";
  cartao.appendChild(titulo);

  const total = contas.length;
  const ativas = contas.filter((conta) => conta.ativa !== false).length;
  const inativas = total - ativas;

  const resumo = document.createElement("p");
  resumo.className = "financas-ajuda";
  resumo.textContent =
    `${contar(total, "conta cadastrada", "contas cadastradas")} · ` +
    `${contar(ativas, "ativa", "ativas")} · ` +
    `${contar(inativas, "inativa", "inativas")}`;
  cartao.appendChild(resumo);

  if (inativas > 0) {
    const aviso = document.createElement("p");
    aviso.className = "financas-ajuda";
    aviso.textContent =
      "Contas inativas continuam no cadastro e nos pagamentos antigos, " +
      "mas não entram em novos totais e projeções.";
    cartao.appendChild(aviso);
  }

  const lista = document.createElement("ul");
  lista.className = "financas-lista";

  for (const conta of contas) {
    lista.appendChild(criarItemConta(estado, conta, aoVoltar));
  }

  cartao.appendChild(lista);
  return cartao;
}

function criarItemConta(estado, conta, aoVoltar) {
  const tipo = conta.tipo === "receita" ? "receita" : "despesa";
  const ativa = conta.ativa !== false;

  const item = document.createElement("li");
  item.className = `financas-item conta-fixa-item ${tipo}`;
  if (!ativa) item.classList.add("inativa");
  item.dataset.contaId = conta.id;

  const info = document.createElement("div");
  info.className = "financas-item-info";

  const nome = document.createElement("strong");
  nome.className = "financas-item-descricao";
  nome.textContent = conta.nome ?? "Sem nome";

  const detalhes = document.createElement("span");
  detalhes.className = "financas-item-detalhes";

  const partes = [
    ativa ? "Ativa" : "Inativa",
    ROTULOS_TIPO[tipo],
    conta.categoria ?? "Sem categoria",
    `vence dia ${conta.diaVencimento}`
  ];

  const periodo = formatarPeriodo(conta);
  if (periodo) partes.push(periodo);

  const quantidadePagamentos = pagamentosDaConta(estado, conta.id).length;
  if (quantidadePagamentos > 0) {
    partes.push(
      contar(
        quantidadePagamentos,
        "pagamento registrado",
        "pagamentos registrados"
      )
    );
  }

  detalhes.textContent = partes.join(" · ");

  info.appendChild(nome);
  info.appendChild(detalhes);

  const sinal = tipo === "receita" ? "+" : "−";

  const valor = document.createElement("span");
  valor.className = `financas-item-valor ${tipo}`;
  valor.textContent = `${sinal} ${formatarCentavos(conta.valorPrevistoCentavos)}`;

  const acoes = document.createElement("div");
  acoes.className = "financas-item-acoes";

  acoes.appendChild(criarBotaoAcao(
    "editar",
    `Editar a conta fixa "${conta.nome ?? "sem nome"}"`,
    () => abrirFormularioEdicaoConta(estado, conta, aoVoltar)
  ));

  acoes.appendChild(criarBotaoAcao(
    "excluir",
    `Excluir a conta fixa "${conta.nome ?? "sem nome"}"`,
    () => confirmarExclusao(estado, conta, aoVoltar)
  ));

  item.appendChild(info);
  item.appendChild(valor);
  item.appendChild(acoes);
  return item;
}

// "2026-10-01" e "2026-12-31" -> "de 01/10/2026 a 31/12/2026".
function formatarPeriodo(conta) {
  if (!conta.inicioEm && !conta.fimEm) return null;

  if (conta.inicioEm && conta.fimEm) {
    return `de ${formatarData(conta.inicioEm)} a ${formatarData(conta.fimEm)}`;
  }

  if (conta.inicioEm) {
    return `a partir de ${formatarData(conta.inicioEm)}`;
  }

  return `até ${formatarData(conta.fimEm)}`;
}

// --- Criação e edição ---

function abrirFormularioNovaConta(estado, aoVoltar) {
  const formulario = criarFormularioContaFixa({
    categorias: estado.config.categoriasFinancas,
    aoSalvar: (campos) => {
      const conta = criarContaFixa(campos);
      estado.contasFixas = estado.contasFixas ?? [];
      estado.contasFixas.push(conta);
      salvar(estado);
      modal.close();
      desenharContasFixas(estado, {
        mensagem: "Conta fixa adicionada!",
        aoVoltar
      });
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Nova conta fixa",
    conteudo: formulario
  });

  formulario.querySelector("input, select")?.focus();
}

function abrirFormularioEdicaoConta(estado, conta, aoVoltar) {
  const formulario = criarFormularioContaFixa({
    categorias: estado.config.categoriasFinancas,
    valoresIniciais: conta,
    rotuloBotao: "Salvar alterações",
    aoSalvar: (campos) => {
      const atualizada = atualizarContaFixa(estado, conta.id, campos);
      if (atualizada === null) return;

      salvar(estado);
      modal.close();
      desenharContasFixas(estado, {
        mensagem: "Conta fixa atualizada!",
        aoVoltar
      });
    },
    aoCancelar: () => modal.close()
  });

  const modal = abrirModal({
    titulo: "Editar conta fixa",
    conteudo: formulario
  });

  formulario.querySelector("input, select")?.focus();
}

// --- Exclusão ---

function confirmarExclusao(estado, conta, aoVoltar) {
  const pagamentos = pagamentosDaConta(estado, conta.id);
  const conteudo = document.createElement("div");

  const texto = document.createElement("p");
  texto.className = "modal-texto";
  conteudo.appendChild(texto);

  const erro = document.createElement("p");
  erro.className = "erro-formulario";
  erro.hidden = true;
  conteudo.appendChild(erro);

  if (pagamentos.length > 0) {
    texto.textContent =
      `A conta fixa "${conta.nome ?? "sem nome"}" tem ` +
      `${contar(pagamentos.length, "pagamento registrado", "pagamentos registrados")} ` +
      "e não pode ser excluída sem apagar esse histórico.";

    const aviso = document.createElement("p");
    aviso.className = "modal-texto";
    aviso.textContent = conta.ativa === false
      ? "Ela já está inativa; os pagamentos existentes serão preservados."
      : "Desative a conta para interromper novos pagamentos; o histórico fica preservado.";
    conteudo.appendChild(aviso);

    const botoes = [
      {
        rotulo: "Fechar",
        classe: "botao-secundario",
        aoClicar: () => modal.close()
      }
    ];

    if (conta.ativa !== false) {
      botoes.push({
        rotulo: "Desativar conta",
        classe: "botao-principal",
        aoClicar: () => {
          const atualizada = atualizarContaFixa(estado, conta.id, { ativa: false });

          if (atualizada === null) {
            erro.textContent =
              "Não foi possível desativar a conta. Atualize a tela e tente novamente.";
            erro.hidden = false;
            return;
          }

          salvar(estado);
          modal.close();
          desenharContasFixas(estado, {
            mensagem: "Conta fixa desativada. O histórico foi preservado.",
            aoVoltar
          });
        }
      });
    }

    conteudo.appendChild(criarGrupoDeBotoes(botoes));
  } else {
    texto.textContent =
      `Excluir a conta fixa "${conta.nome ?? "sem nome"}"? ` +
      "Esta ação não pode ser desfeita.";

    const botoes = [
      {
        rotulo: "Cancelar",
        classe: "botao-secundario",
        aoClicar: () => modal.close()
      },
      {
        rotulo: "Excluir conta",
        classe: "botao-perigo",
        aoClicar: () => {
          const resultado = excluirContaFixa(estado, conta.id);

          if (!resultado.sucesso) {
            erro.textContent = resultado.erros.join(" ");
            erro.hidden = false;
            return;
          }

          salvar(estado);
          modal.close();
          desenharContasFixas(estado, {
            mensagem: "Conta fixa excluída.",
            aoVoltar
          });
        }
      }
    ];

    conteudo.appendChild(criarGrupoDeBotoes(botoes));
  }

  const modal = abrirModal({
    titulo: "Excluir conta fixa",
    conteudo
  });
}

// --- Ordenação e utilitários ---

// Ativas primeiro; dentro de cada grupo, ordem alfabética.
function ordenarContas(contas) {
  return [...contas].sort((a, b) => {
    const grupoA = a.ativa === false ? 1 : 0;
    const grupoB = b.ativa === false ? 1 : 0;

    if (grupoA !== grupoB) return grupoA - grupoB;
    return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
  });
}

function contar(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
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
