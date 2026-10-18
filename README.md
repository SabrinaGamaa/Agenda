# Meu Painel Pessoal

Sistema web pessoal de organização, feito com **HTML, CSS e JavaScript puros** (sem frameworks), como projeto de aprendizagem. Reúne agenda/tarefas, metas e finanças em um só lugar.

O plano completo do projeto (fases, modelo de dados, regras e critérios de conclusão) está em [PLANO.md](PLANO.md).

## Situação atual

**Fase 0 — estrutura inicial.** A página já abre e o JavaScript carrega; as funcionalidades entram uma a uma nas próximas fases.

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

## Como testar (Fase 0)

1. Abra a página pelo servidor local (opção A, B ou C acima).
2. Verifique que aparecem o título **Meu Painel Pessoal** e a mensagem "JavaScript carregado e módulos ES funcionando.".
3. Abra o console do navegador (`F12` → Console): não deve haver erros vermelhos, e deve aparecer a mensagem "Meu Painel Pessoal: aplicativo iniciado.".
