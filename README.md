# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 1 em andamento — tarefas do dia completas.** Criar, editar, concluir/reabrir e excluir, com os dados salvos no navegador (`localStorage`). O próximo passo traz a navegação entre dias e a ordenação da lista.

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
2. Crie uma tarefa pelo formulário e observe a prévia do horário final.
3. Clique **Concluir** em uma tarefa: o título fica riscado e aparece a mensagem "Tarefa concluída!". Clique **Reabrir** para desfazer.
4. Clique **Editar**: abre uma janela com os dados preenchidos; mude o que quiser e salve — ou cancele sem alterar nada.
5. Clique **Excluir**: a janela pede confirmação antes de apagar de vez.
6. Recarregue a página: tudo permanece como estava (incluindo o riscado das concluídas).
7. Console (`F12`): sem erros.
