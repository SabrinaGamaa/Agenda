# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas, finanças, contas fixas e projeções em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 7 concluída — painel principal.** O Home agora abre com quatro blocos: **Hoje e próximas** (tarefas pendentes de hoje e dos próximos 7 dias), **Metas ativas** (com barra de progresso), **Finanças do mês** (receitas, despesas e saldo) e **Contas a vencer** (próximos 7 dias, inclusive quando a janela cruza o mês). Tarefas, metas e contas são clicáveis, e os links **Ver finanças** / **Ver contas** abrem a aba correspondente; quando não há dados, o bloco mostra uma orientação. O painel usa as mesmas regras puras das telas e foi testado com 500 registros fictícios (carga abaixo de 300 ms no ambiente de teste). A primeira execução também ganhou metas, lançamentos e contas fixas de exemplo.

**Fase 8 em andamento — polimento, celular e backup.** A interface já tem ajustes responsivos, estados vazios e de erro, indicadores de foco e exportação com data no nome do arquivo. A verificação em larguras de 320 a 1024 px não encontrou rolagem horizontal; falta conferir o acesso em um celular real pela rede local.

**Fase 6 concluída — contas fixas e projeções.** A aba **Finanças** agora tem uma tela interna de **contas fixas** (aluguel, salário, internet etc.) com ativação/desativação, início/fim e exclusão segura (bloqueada quando há pagamentos). O card **Contas fixas do mês** mostra o previsto, o pago e o em aberto por competência; o pagamento gera um lançamento real vinculado, que é atualizado ou removido junto com o pagamento. Um segundo pagamento da mesma conta na mesma competência é bloqueado. O card **Projeção do próximo mês** separa **previsto** (contas fixas ativas + média variável de até 3 meses anteriores) e **realizado** (lançamentos com data no mês alvo), sem somar os dois; sem histórico, avisa “histórico insuficiente”.

**Fase 5 concluída — finanças básicas.** A aba **Finanças** permite criar, editar e excluir receitas e despesas, com data, valor, categoria e descrição. A tela mostra o resumo do mês (receitas, despesas e saldo), a lista agrupada por dia com o saldo de cada dia, navegação ‹ › entre meses e o botão **Este mês**. Antes de gravar um possível duplicata (mesmo tipo, valor e data), o sistema pede confirmação. Os valores ficam em centavos e são exibidos em reais. A tela também mostra os **totais por categoria** (barras e percentuais de despesas e receitas) e a **comparação com o mês anterior**, com a variação em R$ e em %. O relatório mensal é conferido por um teste automatizado com 20 lançamentos fictícios.

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

## Acesso pelo celular na rede local

O computador e o celular precisam estar conectados à mesma rede Wi-Fi. No terminal do projeto, inicie o servidor aceitando conexões da rede local:

```powershell
py -m http.server 5501 --bind 0.0.0.0
```

No Windows, execute `ipconfig` e procure o **Endereço IPv4** do adaptador Wi-Fi ativo. No navegador do celular, abra `http://IP-DO-COMPUTADOR:5501/`, substituindo o trecho pelo endereço encontrado (por exemplo, `http://192.168.1.25:5501/`). Se o Firewall do Windows perguntar, permita o acesso somente em redes privadas. Use apenas uma rede confiável e mantenha os dados fictícios; o servidor local não oferece autenticação nem criptografia. Para encerrar, volte ao terminal e pressione `Ctrl+C`.

## Backup e restauração

- Para exportar, abra o menu **⋮** no cabeçalho e escolha **Exportar JSON**. O navegador baixa um arquivo chamado `painel-backup-AAAA-MM-DD.json`, com a data local da exportação.
- Guarde uma cópia fora da pasta do projeto e exporte novamente após alterações importantes. O arquivo contém todos os dados do painel; use apenas dados fictícios neste projeto.
- Para restaurar, abra **⋮ → Importar JSON** e selecione o arquivo de backup. A confirmação informa que a importação substitui todos os dados atuais. Antes de confirmar, exporte o estado atual caso queira poder recuperá-lo.
- Se o arquivo não for JSON válido ou não tiver a estrutura compatível, a importação mostra um erro e não substitui o estado atual.

## Como testar (passo atual)

1. Abra pela URL do servidor local (opções acima) — abre no **Home**, na visão **Mês**.
2. **Painel principal** (topo do Home): confira os quatro blocos.
   - **Hoje e próximas**: tarefas pendentes de hoje e dos próximos 7 dias. Clique em uma tarefa para abrir o dia; **Abrir hoje** leva à tela de hoje.
   - **Metas ativas**: metas com barra e percentual de progresso. Clique em uma meta ou em **Ver metas** para abrir a aba Metas.
   - **Finanças do mês**: receitas, despesas e saldo do mês atual. **Ver finanças** abre a aba Finanças no mês mostrado.
   - **Contas a vencer**: contas fixas pendentes nos próximos 7 dias, inclusive na virada do mês. Clique em uma conta para abrir Finanças na competência dela.
   - Sem dados, cada bloco mostra uma orientação (ex.: "Nenhuma meta ativa ainda...").
3. **Alternador Mês | Semana** (topo, à esquerda): clique em **Semana** para ver os 7 dias (Dom→Sáb) com as tarefas de cada dia em cartões (horário + tarja de prioridade).
4. **Navegação de período**: botões ‹ › mudam a semana/mês; **Hoje** volta ao período atual (o botão só aparece quando você saiu dele).
5. **Filtros** (topo, à direita): **Categoria**, **Prioridade** e **Situação** combinam entre si (ex.: Trabalho + Alta + Pendentes); "Limpar filtros" volta ao normal. Vale nas três visões: mês (bolinhas), semana (cartões) e tela do dia (lista).
6. **Clique num dia** (no calendário, no cabeçalho do dia da semana, ou num cartão de tarefa) → abre a **tela de tarefas** daquele dia.
7. Na tela do dia: botão **⌂ (Home)** no cabeçalho; navegação ‹ › + **Hoje**; formulário "Nova tarefa" (data já preenchida); ações por ícone: concluir ✓ / reabrir ↺ / editar ✎ / excluir 🗑 (com confirmação).
8. **Recorrência**: no formulário, em **Repetição**, escolha "Todos os dias", "Toda semana", "Dias da semana" ou "Todo mês". Ajuste o intervalo, marque os dias (quando for o caso) e escolha **Termina**: nunca, em uma data ou após N ocorrências. O resumo abaixo do bloco mostra a regra antes de salvar. Ao editar uma tarefa recorrente, escolha entre **Toda a série** (o formulário completo, com a regra atual) e **Somente esta ocorrência**.
9. **Exceções de uma ocorrência**: clique em **editar ✎** numa tarefa recorrente → "Somente esta ocorrência": a data fica fixa, o bloco de repetição some e as alterações valem só para aquele dia. Para remover um dia, clique em **excluir 🗑** → "Cancelar esta ocorrência" (a série continua nos outros dias). "Excluir a série inteira" pede uma segunda confirmação. Concluir/reabrir ✓ também afeta só o dia.
10. **Período vazio**: sem tarefas (ou todas filtradas), cada visão mostra uma mensagem clara — ex.: "Nenhuma tarefa nesta semana com os filtros atuais."
11. **Metas**: clique na aba **Metas** no cabeçalho. Use **+ Nova meta** para criar uma meta pessoal, profissional ou financeira. Em uma meta financeira, preencha **Valor alvo** e **Valor atual**; o cartão mostra o percentual, quanto falta e a barra financeira. Edite pelo ícone ✎ e exclua pelo ícone 🗑 (com confirmação). Clique em **Detalhes** para abrir a meta, **adicionar etapas**, marcar/desmarcar as concluídas e excluir etapas; o progresso é recalculado na hora (ex.: 3 de 4 etapas = 75%). Metas pessoais e profissionais sem etapas usam o **progresso manual**. Para vincular uma tarefa, abra a aba **Agenda**, edite uma tarefa e escolha a meta em **Meta (opcional)**; a tarefa aparece nos detalhes da meta e pode ser desvinculada por lá. Tarefas vinculadas não alteram o progresso. Ao excluir a meta, as tarefas continuam na agenda, sem meta.
12. **Finanças**: clique na aba **Finanças**. Use **+ Novo lançamento** para registrar uma despesa ou receita: escolha o tipo, a data, digite o valor no formato brasileiro (ex.: `1.234,56`), a categoria e a descrição. O resumo e a lista por dia são atualizados na hora. Edite pelo ícone ✎ e exclua pelo 🗑 (com confirmação). Navegue entre meses com ‹ › e volte com **Este mês**. Se tentar gravar um lançamento com o mesmo tipo, valor e data de outro, aparece o aviso de duplicata; só grava depois de **Gravar mesmo assim**.
13. **Relatórios de Finanças**: no mês com lançamentos, confira **Por categoria** (barras, valores e percentuais de despesas e receitas) e **Comparação com o mês anterior** (valor atual, anterior e variação em R$ e %). Se o mês anterior não tiver movimento no grupo, aparece “sem base”; se os dois meses estiverem vazios, os cartões de relatório não aparecem.
14. **Contas fixas**: em Finanças, clique em **Contas fixas** no topo. Cadastre uma conta com nome, tipo, valor previsto, dia de vencimento, categoria, início e fim (opcional). Ative/desative pelo botão; exclua pelo 🗑 (contas com pagamentos não podem ser excluídas).
15. **Contas do mês e pagamentos**: no card **Contas fixas do mês**, confira **Previsto**, **Pago** e **Em aberto**. Clique em **Pagar** para registrar valor e data; o lançamento vinculado aparece na lista. Use as ações do pagamento no card para editar ou excluir; o lançamento é sincronizado. Um segundo pagamento da mesma conta na mesma competência é bloqueado.
16. **Projeção**: o card **Projeção do próximo mês** mostra **Previsto** (contas fixas ativas + média de até 3 meses anteriores) e **Realizado** (lançamentos com data no mês alvo) em blocos separados, sem somar os dois. Use **Ver [mês]** para abrir o mês projetado. Sem histórico variável, aparece o aviso de histórico insuficiente. Desativar uma conta muda o previsto.
17. **Exportar/Importar**: menu **⋮** no cabeçalho → "Exportar JSON" / "Importar JSON".
18. **Testes automatizados**: abra `http://localhost:5500/testes/testes.html` → "▶ Executar todos os testes" → veja ✅/❌ por suite.
19. **Recarregue**: volta pro Home (visão Mês, mês de hoje); dados intactos.
20. Console (`F12`): sem erros.
21. **Backup**: exporte um JSON, confira a data no nome e importe o mesmo arquivo; após confirmar, confira se os dados continuam presentes. Para testar uma falha sem risco, tente importar um arquivo `.json` inválido e confirme que os dados atuais permanecem.
22. **Celular**: siga "Acesso pelo celular na rede local". Confira Home, Agenda (mês e semana), Metas e Finanças em retrato e paisagem; navegue, abra formulários e confirme que não há conteúdo cortado nem rolagem horizontal. Se mudar a porta `5501`, use a nova porta no endereço do celular.
