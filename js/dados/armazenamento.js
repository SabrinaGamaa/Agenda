// Camada de armazenamento: é a ÚNICA parte do sistema que conversa com o localStorage.
// As telas nunca falam com o localStorage diretamente; isso permite, no futuro,
// trocar o armazenamento (IndexedDB, servidor...) sem mexer nas telas.

import { tarefasDeExemplo } from "./exemplo.js";

const CHAVE = "painel.dados";
const CHAVE_BACKUP_CORROMPIDO = "painel.dados.corrompido";
const VERSAO_ESQUEMA = 1;

// Listas usadas na primeira execução e também para reparar estados antigos
// que ficaram sem categorias (por exemplo, um backup importado incompleto).
const CATEGORIAS_TAREFAS_PADRAO = ["Trabalho", "Pessoal", "Estudos", "Saúde"];
const CATEGORIAS_FINANCAS_PADRAO = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Outros"];

// Carrega o estado salvo. Na primeira execução (ou se os dados estiverem
// corrompidos), cria e salva um estado inicial com dados de exemplo.
export function carregar() {
  const texto = localStorage.getItem(CHAVE);

  if (texto === null) {
    const estadoInicial = criarEstadoInicial();
    salvar(estadoInicial);
    return estadoInicial;
  }

  let estado;

  try {
    estado = JSON.parse(texto);
    if (!estado || typeof estado !== "object" || Array.isArray(estado)) {
      throw new Error("O estado salvo não é um objeto.");
    }
  } catch (erro) {
    // Não apagamos nada: guardamos o texto corrompido num backup antes de recomeçar.
    console.error(
      "Os dados salvos estão corrompidos. Um backup foi guardado em",
      CHAVE_BACKUP_CORROMPIDO,
      erro
    );
    localStorage.setItem(CHAVE_BACKUP_CORROMPIDO, texto);
    const estadoInicial = criarEstadoInicial();
    salvar(estadoInicial);
    return estadoInicial;
  }

  // Um estado antigo pode ter configuração sem categorias. Sem essa correção,
  // os seletores do formulário e dos filtros ficam vazios.
  if (normalizarConfiguracoes(estado)) {
    salvar(estado);
  }

  return estado;
}

// Garante que a configuração exista e que as listas de categorias não fiquem
// vazias. Devolve true quando alterou algo, para persistir a correção.
function normalizarConfiguracoes(estado) {
  let alterou = false;

  if (!estado.config || typeof estado.config !== "object" || Array.isArray(estado.config)) {
    estado.config = {};
    alterou = true;
  }

  if (!Array.isArray(estado.config.categoriasTarefas) || estado.config.categoriasTarefas.length === 0) {
    estado.config.categoriasTarefas = [...CATEGORIAS_TAREFAS_PADRAO];
    alterou = true;
  }

  if (!Array.isArray(estado.config.categoriasFinancas) || estado.config.categoriasFinancas.length === 0) {
    estado.config.categoriasFinancas = [...CATEGORIAS_FINANCAS_PADRAO];
    alterou = true;
  }

  return alterou;
}

// Salva o estado inteiro como texto JSON.
export function salvar(estado) {
  localStorage.setItem(CHAVE, JSON.stringify(estado));
}

// A forma do "documento" que guarda tudo. Cresce conforme as fases avançam.
// Exportada para os testes conseguirem conferir a estrutura inicial.
export function criarEstadoInicial() {
  return {
    schemaVersion: VERSAO_ESQUEMA,
    config: {
      categoriasTarefas: [...CATEGORIAS_TAREFAS_PADRAO],
      categoriasFinancas: [...CATEGORIAS_FINANCAS_PADRAO]
    },
    tarefas: tarefasDeExemplo(),
    metas: [],
    lancamentos: [],
    contasFixas: [],
    pagamentos: []
  };
}
