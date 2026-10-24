# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 5 em andamento — finanças básicas.** A aba **Finanças** permite criar, editar e excluir receitas e despesas, com data, valor, categoria e descrição. A tela mostra o resumo do mês (receitas, despesas e saldo), a lista agrupada por dia com o saldo de cada dia, navegação ‹ › entre meses e o botão **Este mês**. Antes de gravar um possível duplicata (mesmo tipo, valor e data), o sistema pede confirmação. Os valores ficam em centavos e são exibidos em reais.

**Fase 4 concluída.** A aba **Metas** permite criar, editar e excluir metas pessoais, profissionais e financeiras, com prazo, situação, progresso manual e valores em reais. Cada meta tem uma tela de **Detalhes** com etapas (adicionar, concluir, reabrir e excluir), progresso automático e a lista de **tarefas vinculadas**. Metas financeiras mostram valor alvo, valor atual, percentual e quanto falta. Tarefas vinculadas são referência e não alteram o progresso; ao excluir uma meta, as tarefas continuam na agenda, sem vínculo.

A agenda da Fase 3 continua completa: o Home alterna entre **Mês** (calendário com bolinhas de prioridade) e **Semana** (tarefas de cada dia lado a lado), com navegação ‹ › e botão "Hoje". Filtros por categoria, prioridade e situação valem nas três visões (mês, semana e dia). As ocorrências de tarefas recorrentes são calculadas e exibidas nas três visões; o formulário cria e edita séries (diária, semanal, dias da semana e mensal), com fim nunca, em data ou após N ocorrências. Cada ocorrência também pode ser **concluída, alterada ou cancelada sozinha**, sem mudar os outros dias, ou a **série inteira** pode ser editada/excluída. Export/import JSON completo e testes automatizados em `testes/testes.html`.

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
7. **Recorrência**: no formulário, em **Repetição**, escolha "Todos os dias", "Toda semana", "Dias da semana" ou "Todo mês". Ajuste o intervalo, marque os dias (quando for o caso) e escolha **Termina**: nunca, em uma data ou após N ocorrências. O resumo abaixo do bloco mostra a regra antes de salvar. Ao editar uma tarefa recorrente, escolha entre **Toda a série** (o formulário completo, com a regra atual) e **Somente esta ocorrência**.
8. **Exceções de uma ocorrência**: clique em **editar ✎** numa tarefa recorrente → "Somente esta ocorrência": a data fica fixa, o bloco de repetição some e as alterações valem só para aquele dia. Para remover um dia, clique em **excluir 🗑** → "Cancelar esta ocorrência" (a série continua nos outros dias). "Excluir a série inteira" pede uma segunda confirmação. Concluir/reabrir ✓ também afeta só o dia.
9. **Período vazio**: sem tarefas (ou todas filtradas), cada visão mostra uma mensagem clara — ex.: "Nenhuma tarefa nesta semana com os filtros atuais."
10. **Metas**: clique na aba **Metas** no cabeçalho. Use **+ Nova meta** para criar uma meta pessoal, profissional ou financeira. Em uma meta financeira, preencha **Valor alvo** e **Valor atual**; o cartão mostra o percentual, quanto falta e a barra financeira. Edite pelo ícone ✎ e exclua pelo ícone 🗑 (com confirmação). Clique em **Detalhes** para abrir a meta, **adicionar etapas**, marcar/desmarcar as concluídas e excluir etapas; o progresso é recalculado na hora (ex.: 3 de 4 etapas = 75%). Metas pessoais e profissionais sem etapas usam o **progresso manual**. Para vincular uma tarefa, abra a aba **Agenda**, edite uma tarefa e escolha a meta em **Meta (opcional)**; a tarefa aparece nos detalhes da meta e pode ser desvinculada por lá. Tarefas vinculadas não alteram o progresso. Ao excluir a meta, as tarefas continuam na agenda, sem meta.
11. **Finanças**: clique na aba **Finanças**. Use **+ Novo lançamento** para registrar uma despesa ou receita: escolha o tipo, a data, digite o valor no formato brasileiro (ex.: `1.234,56`), a categoria e a descrição. O resumo e a lista por dia são atualizados na hora. Edite pelo ícone ✎ e exclua pelo 🗑 (com confirmação). Navegue entre meses com ‹ › e volte com **Este mês**. Se tentar gravar um lançamento com o mesmo tipo, valor e data de outro, aparece o aviso de duplicata; só grava depois de **Gravar mesmo assim**.
12. **Exportar/Importar**: menu **⋮** no cabeçalho → "Exportar JSON" / "Importar JSON".
13. **Testes automatizados**: abra `http://localhost:5500/testes/testes.html` → "▶ Executar todos os testes" → veja ✅/❌ por suite.
14. **Recarregue**: volta pro Home (visão Mês, mês de hoje); dados intactos.
15. Console (`F12`): sem erros.
