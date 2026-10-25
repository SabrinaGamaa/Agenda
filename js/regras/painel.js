// Regras do painel principal do Home.
// Funções puras: recebem o estado e devolvem os quatro blocos do painel,
// sem tocar no DOM nem no localStorage.
//
// Blocos:
// - tarefas de hoje + próximas (janela de 7 dias);
// - metas ativas com progresso;
// - resumo financeiro do mês atual;
// - contas fixas a vencer nos próximos 7 dias (inclusive virada de mês).

import { hojeISO, somarDias } from "./datas.js";
import { ocorrenciasNoPeriodo } from "./recorrencia.js";
import { criarOcorrencia, estaConcluida } from "./tarefas.js";
import { calcularProgresso, progressoFinanceiro } from "./metas.js";
import {
  resumoDoMes,
  competenciaDaData,
  dataValida
} from "./financas.js";
import { contasDoMes } from "./contas-fixas.js";

export const DIAS_TAREFAS = 7;
export const DIAS_CONTAS = 7;
export const LIMITE_TAREFAS_HOJE = 3;
export const LIMITE_TAREFAS_PROXIMAS = 3;
export const LIMITE_METAS = 3;
export const LIMITE_CONTAS = 3;

// Data-base segura: usa hoje quando a data recebida for inválida.
function dataBaseSegura(dataBase) {
  return dataValida(dataBase) ? dataBase : hojeISO();
}

// Progresso exibido no painel. Para metas financeiras sem etapas, o valor
// financeiro é mais útil do que o progresso manual; com etapas, vale a
// conclusão das etapas, como na tela de metas.
function progressoDaMeta(meta) {
  const etapas = Array.isArray(meta?.etapas) ? meta.etapas : [];

  if (etapas.length > 0) {
    return calcularProgresso(meta);
  }

  const financeiro = progressoFinanceiro(meta);
  if (financeiro !== null) {
    return financeiro.percentual;
  }

  return calcularProgresso(meta);
}

/**
 * Tarefas pendentes de hoje e dos próximos 7 dias.
 * As listas já vêm limitadas para o cartão; os totais permitem mostrar
 * "mais N" sem renderizar centenas de itens.
 */
export function tarefasDoPainel(estado, dataBase = hojeISO()) {
  const base = dataBaseSegura(dataBase);
  const limite = somarDias(base, DIAS_TAREFAS);
  const ocorrencias = [];
  let concluidasHoje = 0;

  for (const tarefa of estado.tarefas ?? []) {
    const datas = ocorrenciasNoPeriodo(tarefa, base, limite);

    for (const data of datas) {
      const ocorrencia = criarOcorrencia(tarefa, data);

      if (estaConcluida(ocorrencia, data)) {
        if (data === base) concluidasHoje++;
        continue;
      }

      ocorrencias.push(ocorrencia);
    }
  }

  ocorrencias.sort((a, b) => {
    const porData = a.dataOcorrencia.localeCompare(b.dataOcorrencia);
    if (porData !== 0) return porData;

    const porHora = (a.horaInicio ?? "").localeCompare(b.horaInicio ?? "");
    if (porHora !== 0) return porHora;

    return (a.titulo ?? "").localeCompare(b.titulo ?? "", "pt-BR");
  });

  const pendentesHoje = ocorrencias.filter(
    (tarefa) => tarefa.dataOcorrencia === base
  );
  const proximas = ocorrencias.filter(
    (tarefa) => tarefa.dataOcorrencia > base
  );

  return {
    dataBase: base,
    limite,
    hoje: pendentesHoje.slice(0, LIMITE_TAREFAS_HOJE),
    proximas: proximas.slice(0, LIMITE_TAREFAS_PROXIMAS),
    totalHoje: pendentesHoje.length,
    totalProximas: proximas.length,
    concluidasHoje
  };
}

/**
 * Metas ativas, ordenadas por prazo (sem prazo por último) e com o progresso
 * já calculado. A lista de itens é limitada para caber no cartão.
 */
export function metasAtivasDoPainel(estado, limite = LIMITE_METAS) {
  const metas = (estado.metas ?? [])
    .filter((meta) => meta?.situacao === "ativa")
    .map((meta) => ({
      meta,
      progresso: progressoDaMeta(meta)
    }))
    .sort((a, b) => {
      const prazoA = a.meta.prazo ?? "9999-12-31";
      const prazoB = b.meta.prazo ?? "9999-12-31";
      const porPrazo = prazoA.localeCompare(prazoB);
      if (porPrazo !== 0) return porPrazo;

      return (a.meta.titulo ?? "").localeCompare(
        b.meta.titulo ?? "",
        "pt-BR"
      );
    });

  return {
    itens: metas.slice(0, limite),
    total: metas.length
  };
}

/**
 * Resumo financeiro da competência da data-base.
 * `vazio` indica que não há lançamentos no mês (não que o saldo seja zero).
 */
export function resumoFinanceiroDoPainel(estado, dataBase = hojeISO()) {
  const base = dataBaseSegura(dataBase);
  const competencia = competenciaDaData(base) ?? competenciaDaData(hojeISO());
  const resumo = resumoDoMes(estado, competencia);

  return {
    ...resumo,
    vazio: resumo.quantidadeLancamentos === 0
  };
}

/**
 * Contas fixas pendentes com vencimento entre a data-base e os próximos
 * 7 dias. Inclui contas do mês seguinte quando a janela cruza o mês.
 * Contas pagas, inativas ou fora da janela ficam de fora.
 */
export function contasAVencerDoPainel(estado, dataBase = hojeISO()) {
  const base = dataBaseSegura(dataBase);
  const limite = somarDias(base, DIAS_CONTAS);
  const competencias = [
    ...new Set([
      competenciaDaData(base),
      competenciaDaData(limite)
    ].filter(Boolean))
  ];

  const contas = [];

  for (const competencia of competencias) {
    for (const conta of contasDoMes(estado, competencia)) {
      if (!conta.vigente || conta.pago) continue;

      const data = conta.dataVencimento;
      if (!data || data < base || data > limite) continue;

      contas.push({
        ...conta,
        competencia
      });
    }
  }

  contas.sort((a, b) => {
    const porData = (a.dataVencimento ?? "").localeCompare(
      b.dataVencimento ?? ""
    );
    if (porData !== 0) return porData;

    return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
  });

  return {
    dataBase: base,
    limite,
    janelaDias: DIAS_CONTAS,
    itens: contas.slice(0, LIMITE_CONTAS),
    total: contas.length,
    temContasFixas: (estado.contasFixas ?? []).length > 0
  };
}

// Junta os quatro blocos em uma única leitura. A tela usa esta função para
// evitar quatro varreduras separadas do estado.
export function resumoPainel(estado, dataBase = hojeISO()) {
  const base = dataBaseSegura(dataBase);

  return {
    dataBase: base,
    tarefas: tarefasDoPainel(estado, base),
    metas: metasAtivasDoPainel(estado),
    financas: resumoFinanceiroDoPainel(estado, base),
    contas: contasAVencerDoPainel(estado, base)
  };
}


