# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 1 em andamento — tarefas do dia: criar, editar, concluir/reabrir, excluir e navegar entre dias.** Os dados ficam no navegador (`localStorage`); a lista ordena os pendentes por horário e joga as concluídas para o fim. O próximo passo traz exportação/importação dos dados e os primeiros testes automatizados.

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
2. No cartão da lista, use **‹ anterior** e **próximo ›** para navegar entre os dias; a data muda por extenso. Fora de hoje, aparece o botão **Hoje** para voltar (roxo).
3. Crie uma tarefa para outro dia: o formulário já sugere a data do dia que está na tela, e a mensagem avisa que a tarefa não está na lista atual.
4. Conclua uma tarefa: ela vai para o **fim** da lista, riscada (os pendentes ficam em ordem de horário, do mais cedo ao mais tarde).
5. Edite uma tarefa mudando a data: a mensagem avisa que ela foi para outro dia.
6. Recarregue a página: a visão volta para hoje e os dados continuam salvos.
7. Console (`F12`): sem erros.
