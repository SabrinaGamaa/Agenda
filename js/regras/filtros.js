// Filtros de exibição (categoria, prioridade e situação).
// Valem para as três visões (mês, semana e dia) e combinam entre si:
// todas as condições valem juntas (E lógico).
// O estado vive em memória: ao recarregar a página, os filtros voltam ao padrão.

import { estaConcluida } from "./tarefas.js";

let filtros = {
  categoria: "",    // "" = todas as categorias
  prioridade: "",   // "" = todas | "baixa" | "media" | "alta"
  situacao: "todas" // "todas" | "pendentes" | "concluidas"
};

// Devolve uma cópia dos filtros atuais (para montar a interface).
export function obterFiltros() {
  return { ...filtros };
}

// Atualiza um filtro específico: "categoria" | "prioridade" | "situacao".
export function definirFiltro(nome, valor) {
  filtros = { ...filtros, [nome]: valor };
}

// Volta tudo ao padrão (nenhum filtro).
export function limparFiltros() {
  filtros = { categoria: "", prioridade: "", situacao: "todas" };
}

// Há algum filtro ativo? (usado para mostrar o botão "Limpar" e os avisos)
export function temFiltroAtivo() {
  return filtros.categoria !== "" || filtros.prioridade !== "" || filtros.situacao !== "todas";
}

// Filtra as tarefas de um dia. A data é necessária porque a conclusão
// é por data (exceções) — a mesma tarefa pode estar pendente num dia e
// concluída em outro, nas recorrências futuras.
export function filtrarTarefas(tarefas, dataISO) {
  return tarefas.filter((tarefa) => {
    if (filtros.categoria && tarefa.categoria !== filtros.categoria) return false;
    if (filtros.prioridade && tarefa.prioridade !== filtros.prioridade) return false;

    const concluida = estaConcluida(tarefa, dataISO);
    if (filtros.situacao === "pendentes" && concluida) return false;
    if (filtros.situacao === "concluidas" && !concluida) return false;

    return true;
  });
}
