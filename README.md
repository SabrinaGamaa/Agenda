# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 2 completa — visões de mês e semana + filtros.** O Home alterna entre **Mês** (calendário com bolinhas de prioridade) e **Semana** (tarefas de cada dia lado a lado), com navegação ‹ › e botão "Hoje". Filtros por categoria, prioridade e situação valem nas três visões (mês, semana e dia). Export/import JSON completo e testes automatizados em `testes/testes.html`.

## Como abrir o projeto

O projeto usa **módulos ES** (`import`/`export`), que o navegador só carrega a partir de um **servidor local**. Abrir o `index.html` com duplo clique (`file://`) não funciona.

Escolha **uma** das opções:

### Opção A — Extensão Live Server (VS Code) — recomendada

1. No VS Code, instale a extensão **Live Server** (Ritwick Dey).
2. Abra a pasta do projeto.
3. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.

### Opção B — Python

No terminal, dentro da pasta do projeto:

```powershell
py -m http.server 5500
```

> Atenção: nesta máquina, o comando `python` abre o atalho da Microsoft Store e não funciona. Use `py`, que aponta para o Python real instalado.

Depois abra `http://localhost:5500` no navegador. Para encerrar o servidor: `Ctrl+C`.

### Opção C — Node.js

```powershell
npx serve .
```

Depois abra o endereço mostrado pelo comando (geralmente `http://localhost:3000`).

> Dica: se o `npx` não funcionar no PowerShell por causa de política de execução, use `npx.cmd serve .`.

## Como testar (passo atual)

1. Abra pela URL do servidor local (opções acima) — abre no **Home**, na visão **Mês**.
2. **Alternador Mês | Semana** (topo, à esquerda): clique em **Semana** para ver os 7 dias (Dom→Sáb) com as tarefas de cada dia em cartões (horário + tarja de prioridade).
3. **Navegação de período**: botões ‹ › mudam a semana/mês; **Hoje** volta ao período atual (o botão só aparece quando você saiu dele).
4. **Filtros** (topo, à direita): **Categoria**, **Prioridade** e **Situação** combinam entre si (ex.: Trabalho + Alta + Pendentes); "Limpar filtros" volta ao normal. Vale nas três visões: mês (bolinhas), semana (cartões) e tela do dia (lista).
5. **Clique num dia** (no calendário, no cabeçalho do dia da semana, ou num cartão de tarefa) → abre a **tela de tarefas** daquele dia.
6. Na tela do dia: botão **⌂ (Home)** no cabeçalho; navegação ‹ › + **Hoje**; formulário "Nova tarefa" (data já preenchida); ações por ícone: concluir ✓ / reabrir ↺ / editar ✎ / excluir 🗑 (com confirmação).
7. **Período vazio**: sem tarefas (ou todas filtradas), cada visão mostra uma mensagem clara — ex.: "Nenhuma tarefa nesta semana com os filtros atuais."
8. **Exportar/Importar**: menu **⋮** no cabeçalho → "Exportar JSON" / "Importar JSON".
9. **Testes automatizados**: abra `http://localhost:5500/testes/testes.html` → "▶ Executar todos os testes" → veja ✅/❌ por suite.
10. **Recarregue**: volta pro Home (visão Mês, mês de hoje); dados intactos.
11. Console (`F12`): sem erros.
