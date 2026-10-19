// Camada de armazenamento: é a ÚNICA parte do sistema que conversa com o localStorage.
// As telas nunca falam com o localStorage diretamente; isso permite, no futuro,
// trocar o armazenamento (IndexedDB, servidor...) sem mexer nas telas.

import { tarefasDeExemplo } from "./exemplo.js";

const CHAVE = "painel.dados";
const CHAVE_BACKUP_CORROMPIDO = "painel.dados.corrompido";
const VERSAO_ESQUEMA = 1;

// Carrega o estado salvo. Na primeira execução (ou se os dados estiverem
// corrompidos), cria e salva um estado inicial com dados de exemplo.
export function carregar() {
  const texto = localStorage.getItem(CHAVE);

  if (texto === null) {
    const estadoInicial = criarEstadoInicial();
    salvar(estadoInicial);
    return estadoInicial;
  }

  try {
    return JSON.parse(texto);
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
      categoriasTarefas: ["Trabalho", "Pessoal", "Estudos", "Saúde"],
      categoriasFinancas: ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Outros"]
    },
    tarefas: tarefasDeExemplo(),
    metas: [],
    lancamentos: [],
    contasFixas: [],
    pagamentos: []
  };
}
