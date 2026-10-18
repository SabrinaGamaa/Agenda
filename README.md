# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 1 em andamento — criar e listar tarefas do dia.** Os dados ficam no navegador (`localStorage`); já é possível criar tarefas pelo formulário (com horário final calculado) e vê-las na lista do dia. Edição, conclusão e exclusão chegam nos próximos passos.

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

1. Abra pela URL do servidor local (opções acima).
2. No cartão "Nova tarefa", preencha título, data (hoje), horário e duração — o texto abaixo mostra o **horário final calculado** enquanto você digita (com "(dia seguinte)" quando atravessa a meia-noite).
3. Clique em "Adicionar tarefa": ela aparece na lista de hoje, com borda colorida pela prioridade.
4. Recarregue a página: a tarefa continua lá (foi salva pelo navegador).
5. Teste as validações: tente salvar sem título, sem horário ou com duração vazia — deve aparecer uma mensagem de erro em português.
6. Crie uma tarefa para outra data: um aviso explica que ela não aparece na lista de hoje.
7. Console (`F12`): sem erros; digite `estado.tarefas` para conferir os dados salvos.
