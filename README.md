# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 1 em andamento — redesign completo (tema escuro + calendário home).** Tela inicial com calendário mensal (bolinhas por prioridade) + painel lateral (próximos prazos, top categorias, resumo da semana). Lista de tarefas com botões-ícone, linha fina de prioridade, concluídas com opacity. Navegação Home ↔ Dia funcionando. O próximo passo traz exportação/importação dos dados e os primeiros testes automatizados.

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

1. Abra pela URL do servidor local (opções acima) — abre no **Home** (calendário + painel lateral).
2. **Calendário**: veja o mês atual; dia de hoje tem contorno roxo + bolinha; dias 19/20/21 têm bolinhas coloridas (vermelho=alta, roxo=média, azul=baixa).
3. **Painel lateral** (direita): "Próximos prazos" (3 primeiros), "Top categorias", "Semana" (concluídas/pendentes).
4. **Clique num dia** no calendário → abre a **tela de tarefas** daquele dia.
5. Na tela de tarefas: botão **⌂ (Home)** no cabeçalho para voltar ao calendário.
6. **Navegação entre dias**: botões ‹ › + data por extenso + botão **⌂ Hoje** (roxo) quando não é hoje.
7. **Criar tarefa**: formulário sugere a data do dia atual; prioridade = linha fina à esquerda (vermelho/roxo/azul).
8. **Concluir** (ícone ✓): tarefa vai para o fim, `opacity: .35` + risco fino; **Reabrir** (↺) volta pro lugar.
9. **Editar** (✎): abre modal; **Excluir** (🗑): pede confirmação.
10. **Volta ao Home** (botão ⌂): bolinhas do calendário e painel lateral atualizados.
11. **Recarregue**: volta pro Home (hoje); dados intactos.
12. Console (`F12`): sem erros.
