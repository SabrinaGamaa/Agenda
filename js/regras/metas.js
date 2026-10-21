// Regras de negócio das metas: criar, editar, excluir, etapas e progresso.
// Funções puras (não tocam DOM nem localStorage), para serem testáveis.
//
// Convenções do modelo (PLANO.md §6):
// - valores financeiros sempre em centavos inteiros;
// - progresso pelas etapas quando existem etapas;
// - progressoManual só vale quando a meta não tem etapas;
// - tarefas vinculadas são referência e NÃO alteram o progresso.

export const TIPOS_META = ["pessoal", "profissional", "financeira"];
export const SITUACOES_META = ["ativa", "concluida", "abandonada"];

// Cria uma meta nova (ainda não salva) a partir dos campos do formulário.
export function criarMeta(campos = {}) {
  const agora = new Date().toISOString();
  const meta = {
    id: crypto.randomUUID(),
    titulo: "",
    descricao: null,
    tipo: "pessoal",
    prazo: null,
    situacao: "ativa",
    etapas: [],
    valorAlvoCentavos: null,
    valorAtualCentavos: 0,
    progressoManual: 0,
    criadaEm: agora,
    atualizadaEm: agora
  };

  aplicarCampos(meta, campos);
  return meta;
}

// Procura uma meta pelo id (ou null se não existir).
export function encontrarMeta(estado, metaId) {
  return (estado.metas ?? []).find((meta) => meta.id === metaId) ?? null;
}

// Atualiza os campos editáveis de uma meta existente.
// As etapas são alteradas pelas funções próprias e nunca por aqui.
export function atualizarMeta(estado, metaId, campos = {}) {
  const meta = encontrarMeta(estado, metaId);
  if (meta === null) return null;

  aplicarCampos(meta, campos);
  meta.atualizadaEm = new Date().toISOString();
  return meta;
}

// Aplica só os campos enviados. Isso evita apagar dados quando uma edição
// antiga (ou parcial) não conhece determinado campo.
function aplicarCampos(meta, campos) {
  if ("titulo" in campos) {
    meta.titulo = String(campos.titulo ?? "").trim();
  }

  if ("descricao" in campos) {
    const texto = String(campos.descricao ?? "").trim();
    meta.descricao = texto === "" ? null : texto;
  }

  if ("tipo" in campos) {
    meta.tipo = TIPOS_META.includes(campos.tipo) ? campos.tipo : "pessoal";
  }

  if ("prazo" in campos) {
    meta.prazo = normalizarPrazo(campos.prazo);
  }

  if ("situacao" in campos) {
    meta.situacao = SITUACOES_META.includes(campos.situacao)
      ? campos.situacao
      : "ativa";
  }

  if ("progressoManual" in campos) {
    meta.progressoManual = limitarPercentual(campos.progressoManual);
  }

  if ("valorAlvoCentavos" in campos) {
    meta.valorAlvoCentavos = normalizarCentavos(campos.valorAlvoCentavos, null);
  }

  if ("valorAtualCentavos" in campos) {
    meta.valorAtualCentavos = normalizarCentavos(campos.valorAtualCentavos, 0);
  }

  // Valores financeiros só fazem sentido em metas financeiras.
  // Ao trocar o tipo, os campos são limpos para não guardar dados órfãos.
  if (meta.tipo !== "financeira") {
    meta.valorAlvoCentavos = null;
    meta.valorAtualCentavos = 0;
  }
}

// Progresso em porcentagem inteira (0 a 100).
// Com etapas, o cálculo é automático; sem etapas, vale o progresso manual.
export function calcularProgresso(meta) {
  if (!meta) return 0;

  const etapas = Array.isArray(meta.etapas) ? meta.etapas : [];

  if (etapas.length > 0) {
    const concluidas = etapas.filter((etapa) => etapa?.concluida === true).length;
    return Math.round((concluidas / etapas.length) * 100);
  }

  return limitarPercentual(meta.progressoManual ?? 0);
}

// Resumo financeiro de uma meta financeira.
// Devolve null quando a meta não é financeira ou não tem valor alvo definido.
export function progressoFinanceiro(meta) {
  if (!meta || meta.tipo !== "financeira") return null;

  const alvo = Number(meta.valorAlvoCentavos);
  if (!Number.isFinite(alvo) || alvo <= 0) return null;

  const alvoCentavos = Math.round(alvo);
  const valorAtual = Number(meta.valorAtualCentavos);
  const atualCentavos = Number.isFinite(valorAtual) && valorAtual > 0
    ? Math.round(valorAtual)
    : 0;

  return {
    alvoCentavos,
    atualCentavos,
    faltaCentavos: Math.max(0, alvoCentavos - atualCentavos),
    excedenteCentavos: Math.max(0, atualCentavos - alvoCentavos),
    percentual: Math.min(100, Math.round((atualCentavos / alvoCentavos) * 100)),
    atingida: atualCentavos >= alvoCentavos
  };
}

// Adiciona uma etapa. Devolve a meta alterada (ou null se inválida).
export function adicionarEtapa(estado, metaId, titulo) {
  const meta = encontrarMeta(estado, metaId);
  if (meta === null) return null;

  const textoSeguro = String(titulo ?? "").trim();
  if (textoSeguro === "") return null;

  if (!Array.isArray(meta.etapas)) {
    meta.etapas = [];
  }

  meta.etapas.push({
    id: crypto.randomUUID(),
    titulo: textoSeguro,
    concluida: false
  });

  meta.atualizadaEm = new Date().toISOString();
  return meta;
}

// Conclui ou reabre uma etapa.
export function alternarEtapa(estado, metaId, etapaId) {
  const meta = encontrarMeta(estado, metaId);
  if (meta === null || !Array.isArray(meta.etapas)) return null;

  const etapa = meta.etapas.find((item) => item.id === etapaId);
  if (!etapa) return null;

  etapa.concluida = !etapa.concluida;
  meta.atualizadaEm = new Date().toISOString();
  return meta;
}

// Remove uma etapa. Se era a última, o progresso manual volta a valer.
export function excluirEtapa(estado, metaId, etapaId) {
  const meta = encontrarMeta(estado, metaId);
  if (meta === null || !Array.isArray(meta.etapas)) return null;

  const indice = meta.etapas.findIndex((item) => item.id === etapaId);
  if (indice === -1) return null;

  meta.etapas.splice(indice, 1);
  meta.atualizadaEm = new Date().toISOString();
  return meta;
}

// Exclui a meta e desvincula as tarefas, sem apagá-las.
// Devolve a meta removida (ou null se não existir).
export function excluirMeta(estado, metaId) {
  const metas = estado.metas ?? [];
  const indice = metas.findIndex((meta) => meta.id === metaId);
  if (indice === -1) return null;

  const [removida] = metas.splice(indice, 1);
  const agora = new Date().toISOString();

  for (const tarefa of estado.tarefas ?? []) {
    if (tarefa.metaId === metaId) {
      tarefa.metaId = null;
      tarefa.atualizadaEm = agora;
    }
  }

  return removida;
}

// Liga uma tarefa a uma meta, ou desliga com metaId = null.
// Não permite apontar para uma meta inexistente.
export function vincularTarefa(estado, tarefaId, metaId) {
  const tarefa = (estado.tarefas ?? []).find((item) => item.id === tarefaId);
  if (!tarefa) return null;

  const destino = metaId || null;
  if (destino !== null && encontrarMeta(estado, destino) === null) {
    return null;
  }

  tarefa.metaId = destino;
  tarefa.atualizadaEm = new Date().toISOString();
  return tarefa;
}

// Tarefas (definições) vinculadas a uma meta, em ordem de data e horário.
export function tarefasDaMeta(estado, metaId) {
  return (estado.tarefas ?? [])
    .filter((tarefa) => tarefa.metaId === metaId)
    .sort((a, b) => {
      const porData = (a.data ?? "").localeCompare(b.data ?? "");
      if (porData !== 0) return porData;
      return (a.horaInicio ?? "").localeCompare(b.horaInicio ?? "");
    });
}

// --- Normalizações ---

function limitarPercentual(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  return Math.min(100, Math.max(0, Math.round(numero)));
}

function normalizarCentavos(valor, padrao) {
  if (valor === null || valor === undefined || valor === "") return padrao;

  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return padrao;

  return Math.round(numero);
}

function normalizarPrazo(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null;
  }
  return valor;
}
