# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 1 em andamento — lista do dia (somente leitura).** O navegador já guarda os dados (`localStorage`) e a tela mostra as tarefas de hoje a partir deles, com dados fictícios de exemplo. Criação, edição e exclusão chegam nos próximos passos.

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
2. Deve aparecer o cartão "Tarefas de hoje" com a data por extenso e três tarefas fictícias de exemplo, cada uma com horário inicial–final, categoria, duração e prioridade (a cor da borda esquerda indica a prioridade).
3. Recarregue a página: as tarefas continuam iguais (foram salvas pelo navegador).
4. No console (`F12`): "Meu Painel Pessoal: aplicativo iniciado." e nenhum erro. Experimente digitar `estado.tarefas` para ver os dados brutos.
5. F12 → aba Application (Chrome/Edge) → Local Storage → chave `painel.dados` com o JSON do estado.
