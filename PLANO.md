# Plano do Projeto — Meu Painel Pessoal

> **Status:** plano aprovado em 18/10/2026. Implementação iniciada pela Fase 0.
> **Data:** 18/10/2026

## Sumário

1. Visão geral
2. Método de trabalho
3. Banco de dados: opções e recomendação
4. Arquitetura recomendada
5. Estrutura de pastas
6. Modelo de dados inicial
7. Regras de recorrência
8. Regras dos lançamentos financeiros
9. MVP — primeira versão funcional
10. Fases, estimativas e critérios de conclusão
11. Riscos técnicos e mitigações
12. Estratégia de testes
13. Estratégia de Git e checkpoints
14. Estimativa total e ritmo
15. Dúvidas a resolver antes de começar

## 1. Visão geral

Sistema web de organização pessoal para uso diário, com quatro partes:

- **Agenda e tarefas** — tarefas e compromissos com data, horário, duração e recorrência.
- **Metas** — sonhos e objetivos pessoais, profissionais e financeiros, com etapas e progresso.
- **Finanças** — receitas, despesas, contas fixas, relatórios e projeções.
- **Painel principal** — resumo do dia (tarefas, metas e finanças).

Premissas e restrições:

- Projeto de aprendizagem: cada etapa é explicada antes e depois de ser implementada.
- **HTML, CSS e JavaScript puros** — sem React, sem TypeScript, sem etapa de build.
- Orçamento zero: nenhum serviço ou API paga; nenhuma biblioteca sem necessidade explicada.
- Apenas **dados fictícios** durante o desenvolvimento.
- **Notificações e alarmes estão fora de escopo** por enquanto (fase futura).

## 2. Método de trabalho

Para cada etapa (uma funcionalidade por vez):

1. **Objetivo** — explico o que vamos construir e por quê.
2. **Plano** — apresento o plano antes de alterar qualquer arquivo.
3. **Arquivos** — listo o que será criado ou modificado.
4. **Implementação** — uma funcionalidade por vez, com explicação do código e das decisões.
5. **Teste manual** — roteiro passo a passo para conferir.
6. **Correção** — verificamos os erros juntos e corrigimos.
7. **Commit** — sugiro uma mensagem de commit quando a etapa estiver funcionando.

Nada avança sem a etapa anterior funcionando e testada; cada passo é aprovado por você antes do próximo.

## 3. Banco de dados: opções e recomendação

### Opção A — Sem banco: `localStorage` + backup em JSON

- **Como funciona:** os dados ficam guardados no próprio navegador, como texto JSON; botões "exportar" (baixa um arquivo de backup) e "importar" (restaura).
- **Vantagens:** zero instalação; adequado ao momento de aprendizagem; funciona offline; suficiente para milhares de registros de texto (limite típico de ~5 MB por site).
- **Limitações:**
  - **Persistência:** vive em um navegador e uma máquina; limpar os dados do navegador apaga tudo (por isso o backup em arquivo desde a Fase 1); sem histórico nem desfazer.
  - **Segurança:** sem criptografia; qualquer extensão do navegador ou script na página consegue ler. Sem problema para dados fictícios; ponto de atenção se um dia houver dados reais.
  - **Celular e outros dispositivos:** não sincroniza; acesso simultâneo não existe. Ponte manual: exportar o JSON e importar no outro aparelho.

### Opção B — SQLite no navegador (via WebAssembly)

- **Como funciona:** uma biblioteca roda o SQLite dentro do navegador; a persistência exige uma segunda camada (IndexedDB/OPFS).
- **Vantagens:** SQL de verdade, com tabelas e consultas.
- **Limitações:** dependência externa, APIs assíncronas e conceitos avançados antes mesmo da primeira tela de tarefas existir — energia gasta em infraestrutura em vez de funcionalidades. Não recomendo agora; dá para adotar depois, pois a camada de dados ficará isolada.

### Opção C — SQLite no servidor (Node.js + API)

- **Como funciona:** os dados moram em um arquivo SQLite acessado por uma API que nós escreveríamos.
- **Vantagens:** persistência robusta; caminho natural para **login e sincronização entre celular e computador**.
- **Limitações:** exige um backend inteiro (servidor, rotas, instalação, deploy) — salto grande demais para começar.

### Recomendação

**Começar com a Opção A**, usando uma **camada de armazenamento isolada** (`js/dados/armazenamento.js`): as telas nunca falam diretamente com o `localStorage`. Assim:

- hoje o armazenamento é local e simples;
- no futuro, trocar apenas essa camada (por IndexedDB ou por API + SQLite) migra o sistema inteiro sem mexer nas telas;
- exportar/importar JSON, já na Fase 1, é backup e "ponte" manual para o celular.

O SQLite entra no roteiro na fase futura de backend (após a F8), junto com autenticação — quando multidispositivo passa a ser necessidade real.

## 4. Arquitetura recomendada

- **HTML5 + CSS3 + JavaScript moderno**, com **módulos ES** (`<script type="module">`). Sem framework e sem etapa de build.
- **Por que módulos ES:** dividem o código em arquivos com `import`/`export` nativos do navegador — organização profissional sem instalar nada.
- **Consequência importante:** módulos ES não funcionam abrindo com duplo clique (`file://`). O projeto será aberto por um **servidor local**: extensão **Live Server** (VS Code), ou `npx serve` (Node.js), ou `python -m http.server` (Python). Escolhemos na Fase 0 conforme seu ambiente (dúvida 1).
- **Formato:** aplicação de página única (SPA simples) com **navegação por hash**: `#/painel`, `#/tarefas`, `#/metas`, `#/financas`. Menu em um só lugar; o roteador é pequeno (~30 linhas) e didático.
- **Camadas:**
  1. **Dados** (`js/dados/`) — carregar/salvar (localStorage), exportar/importar, `schemaVersion`.
  2. **Regras** (`js/regras/`) — funções puras: datas, recorrência, finanças, progresso de metas. **Não tocam DOM nem localStorage** → fáceis de testar.
  3. **Telas** (`js/telas/`) — montam a interface e tratam cliques/formulários.
  4. **Componentes** (`js/componentes/`) — peças reutilizadas (modal de confirmação, campos de formulário).
- **Padrão de atualização:** estado único em memória → alterar o estado → salvar → redesenhar a seção atual. Previsível e sem otimizações prematuras.
- **IDs:** `crypto.randomUUID()` (nativo do navegador).
- **Evolução preparada:** camadas + IDs estáveis + `schemaVersion` permitem acrescentar autenticação, banco compartilhado e instalação no celular (PWA) sem reescrever a aplicação.

## 5. Estrutura de pastas (alvo; começa pequena e cresce por fase)

```
Agenda/
├── index.html
├── AGENTS.md
├── PLANO.md
├── README.md               # como abrir e usar (Fase 0)
├── .gitignore
├── css/
│   └── estilo.css
├── js/
│   ├── app.js              # ponto de entrada: carrega dados, inicia o roteador
│   ├── roteador.js         # navegação por hash
│   ├── dados/
│   │   ├── armazenamento.js    # localStorage + export/import + schemaVersion
│   │   └── exemplo.js          # dados fictícios para desenvolvimento
│   ├── regras/
│   │   ├── datas.js
│   │   ├── tarefas.js
│   │   ├── recorrencia.js
│   │   ├── metas.js
│   │   └── financas.js
│   ├── telas/
│   │   ├── painel.js
│   │   ├── tarefas.js
│   │   ├── metas.js
│   │   └── financas.js
│   └── componentes/
│       ├── modal.js
│       └── formulario.js
├── testes/
│   └── testes.html         # testes das funções puras (sem instalar nada)
└── dados/
    └── exemplo.json        # dados fictícios para importar
```

A Fase 0 cria apenas `index.html`, `css/estilo.css`, `js/app.js`, `README.md` e `.gitignore`; cada fase acrescenta somente os arquivos que usa.

## 6. Modelo de dados inicial

Todos os dados ficam em um único documento JSON:

```json
{
  "schemaVersion": 1,
  "config": {
    "categoriasTarefas": ["Trabalho", "Pessoal", "Estudos"],
    "categoriasFinancas": ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Outros"]
  },
  "tarefas": [],
  "metas": [],
  "lancamentos": [],
  "contasFixas": [],
  "pagamentos": []
}
```

Convenções gerais:

- **Dinheiro em centavos, sempre inteiro** (R$ 12,34 → `1234`); formatação só na exibição (`Intl.NumberFormat('pt-BR')`). Evita os erros clássicos de soma com decimais.
- **Datas como texto `"AAAA-MM-DD"`** e **horários como `"HH:MM"`**; nunca objetos de data circulando soltos pelo sistema.
- IDs: `crypto.randomUUID()`.

### Tarefa

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | gerado automaticamente |
| `titulo` | texto | obrigatório |
| `descricao` | texto | opcional |
| `categoria` | texto | escolhida da lista em `config` |
| `prioridade` | `"baixa"` \| `"media"` \| `"alta"` | |
| `data` | data | primeira ocorrência (ou única) |
| `horaInicio` | hora | |
| `duracaoMinutos` | inteiro | maior que zero |
| `recorrencia` | objeto ou `null` | `null` = tarefa única (ver §7) |
| `metaId` | texto ou `null` | vínculo com uma meta |
| `excecoes` | objeto | ajustes por data (ver §7) |
| `criadaEm` / `atualizadaEm` | texto ISO | auditoria simples |

### Meta

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | |
| `titulo` | texto | obrigatório |
| `descricao` | texto | opcional |
| `tipo` | `"pessoal"` \| `"profissional"` \| `"financeira"` | |
| `prazo` | data ou `null` | |
| `situacao` | `"ativa"` \| `"concluida"` \| `"abandonada"` | |
| `etapas` | lista | `{ "id", "titulo", "concluida" }` |
| `valorAlvoCentavos` | inteiro ou `null` | só metas financeiras |
| `valorAtualCentavos` | inteiro | só metas financeiras |
| `progressoManual` | 0–100 ou `null` | usado quando não há etapas |
| `criadaEm` / `atualizadaEm` | texto ISO | |

### Lançamento (receita ou despesa)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | |
| `tipo` | `"receita"` \| `"despesa"` | |
| `data` | data | |
| `valorCentavos` | inteiro | sempre positivo |
| `descricao` | texto | |
| `categoria` | texto | da lista de categorias financeiras |
| `origem` | `"manual"` \| `"pagamento"` | pagamento = gerado por conta fixa |
| `origemId` | texto ou `null` | id do pagamento, quando gerado |
| `criadoEm` | texto ISO | |

### Conta fixa

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | |
| `nome` | texto | ex.: "Aluguel" |
| `tipo` | `"receita"` \| `"despesa"` | |
| `valorPrevistoCentavos` | inteiro | |
| `diaVencimento` | 1–31 | ajusta para o último dia do mês quando necessário |
| `categoria` | texto | |
| `ativa` | booleano | |
| `inicioEm` / `fimEm` | data / data ou `null` | |

### Pagamento

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | |
| `contaFixaId` | texto | referência à conta fixa |
| `competencia` | `"AAAA-MM"` | mês de referência |
| `valorPagoCentavos` | inteiro | pode diferir do previsto |
| `dataPagamento` | data | |
| `lancamentoId` | texto | lançamento real gerado |

### Relacionamentos

- Tarefa → Meta (opcional): `tarefa.metaId`.
- Meta → Etapas: lista dentro da própria meta.
- Tarefa → Exceções: por data, dentro da própria tarefa.
- Conta fixa → Pagamentos: no máximo um por competência.
- Pagamento → Lançamento: registro do valor realmente pago.
- Lançamento / Conta fixa → Categoria financeira.

## 7. Regras de recorrência

Princípio central: **as ocorrências são calculadas, não armazenadas.** A série é guardada uma única vez (a "definição"), e as telas pedem ao módulo de recorrência as ocorrências de um período (dia, semana ou mês). Isso evita duplicar dados, permite séries "para sempre" e torna a edição da série uma operação simples.

Como uma tarefa descreve a repetição:

```json
"recorrencia": {
  "tipo": "diaria" | "semanal" | "diasDaSemana" | "mensal",
  "intervalo": 1,
  "diasDaSemana": [1, 3, 5],
  "fim": { "tipo": "nunca" }
       | { "tipo": "emData", "data": "AAAA-MM-DD" }
       | { "tipo": "apos", "quantidade": 10 }
}
```

- `diaria`: repete a cada `intervalo` dias (1 = todos os dias).
- `semanal`: mesmo dia da semana da data inicial, a cada `intervalo` semanas.
- `diasDaSemana`: repete nos dias escolhidos da semana (0 = domingo ... 6 = sábado), todas as semanas.
- `mensal`: mesmo dia do mês, a cada `intervalo` meses. **Dia inexistente** (ex.: 31 em fevereiro): a ocorrência cai no **último dia do mês** (28/02 ou 29/02 em ano bissexto) — confirmar na dúvida 5.
- `fim`: série infinita, até uma data, ou por quantidade de ocorrências.

**Ajustes de uma ocorrência (exceções)** — chave = data:

```json
"excecoes": {
  "2026-10-20": { "cancelada": true },
  "2026-10-21": { "concluida": true },
  "2026-10-22": { "horaInicio": "15:00", "duracaoMinutos": 45 }
}
```

- **Cancelar uma ocorrência**: não afeta as demais datas da série.
- **Alterar uma ocorrência**: os campos alterados ficam guardados só naquela data.
- **Concluir uma ocorrência** de série: marca só aquele dia (concluir um dia não conclui os outros).
- **Tarefa única** funciona como uma série de uma ocorrência só — mesma lógica, sem código duplicado.
- **Editar a série inteira** (título, horário, regra): altera a definição; exceções já registradas continuam valendo (decisão conservadora: não apagar histórico de ajustes).
- **"Esta e as próximas"** (alterar a série a partir de uma data): fase futura — é a variação mais complexa. Nesta fase: **somente esta ocorrência** ou **toda a série**.

Casos de borda previstos (com testes): término após a meia-noite (dúvida 4); dia 29–31 em meses curtos; séries infinitas nunca são materializadas (cálculo sempre em janelas); data inicial no passado.

## 8. Regras dos lançamentos financeiros

- **Valores em centavos (inteiros)** — regra inegociável; formatação só na exibição.
- **Lançamento manual**: receita ou despesa com data, valor, descrição e categoria — "o que realmente aconteceu".
- **Conta fixa** (ex.: aluguel, salário, internet): nome, tipo (receita/despesa), valor previsto, dia de vencimento, categoria, ativa/inativa, início e fim opcionais — "o que deve acontecer todo mês".
- **Pagamento**: registro de que a conta fixa de uma competência (mês) foi paga/recebida, com **valor efetivo** (pode diferir do previsto, ex.: conta de luz) e data.
  - Registrar o pagamento cria automaticamente o **lançamento real** vinculado (`origem: "pagamento"`).
  - Editar o pagamento atualiza o lançamento; excluir o pagamento remove o lançamento gerado (com confirmação).
- **Evitar duplicidade:**
  - É impossível registrar dois pagamentos da mesma conta fixa na mesma competência; se já existir, a tela mostra "pago" e permite corrigir/editar o existente.
  - Lançamento manual com mesmo tipo + valor + data existente: o sistema avisa "possível duplicata" e só grava após confirmação.
- **Relatórios:**
  - **Diário:** lançamentos do dia e total.
  - **Mensal:** receitas, despesas, saldo, totais por categoria e comparação com o mês anterior (variação em R$ e em %).
- **Projeção do próximo mês** (previsto ≠ realizado; nunca somados no mesmo número):
  - Contas fixas ativas do mês alvo + média mensal dos últimos 3 meses de lançamentos variáveis (se houver base; senão, aviso "histórico insuficiente");
  - Saldo previsto = receitas previstas − despesas previstas;
  - **Rótulos e visuais distintos** para previsto (tom apagado) e realizado.
- Fora de escopo por enquanto: cartão de crédito/parcelamento, transferências entre contas, orçamento por categoria.

## 9. MVP — primeira versão funcional (Fase 1)

O MVP é a menor versão que já serve para o dia a dia:

- Criar, visualizar, editar, concluir/reabrir e excluir **tarefas únicas**.
- Campos: título, descrição, data, hora inicial, duração (com **horário final calculado**), categoria e prioridade.
- Lista do dia, com navegação para o dia anterior/seguinte.
- Persistência automática (salva a cada ação; sem botão "salvar tudo").
- **Exportar e importar backup JSON** (proteção contra perda de dados).
- Estados vazios e mensagens de erro amigáveis.

Fora do MVP (entra nas próximas fases): recorrência, visões semana/mês, metas, finanças, painel completo, notificações.

**Pronto quando:**

- criar, editar, concluir, reabrir e excluir tarefas sem erro no console;
- fechar e reabrir o navegador mantém os dados;
- o horário final calcula certo em todos os casos do roteiro de teste (30 min; 1 h 30; virada de meia-noite conforme dúvida 4; duração inválida recusada com mensagem clara);
- exportar gera arquivo válido e importar restaura exatamente o mesmo estado;
- o roteiro de teste manual da fase passa por completo.

## 10. Fases, estimativas e critérios de conclusão

### Resumo

| Fase | Foco | Estimativa* |
|---|---|---|
| F0 | Preparação do projeto | 1–2 sessões |
| F1 | MVP: tarefas (sem recorrência) | 4–6 sessões |
| F2 | Visões semana/mês e filtros | 2–4 sessões |
| F3 | Recorrências e exceções | 5–8 sessões |
| F4 | Metas | 3–4 sessões |
| F5 | Finanças básicas | 4–6 sessões |
| F6 | Contas fixas e projeções | 4–6 sessões |
| F7 | Painel principal | 3–4 sessões |
| F8 | Polimento, celular e backup | 2–4 sessões |

\* Sessões de 1–2 horas. Estimativas revisadas ao final de cada fase.

### F0 — Preparação

- **Objetivo:** projeto abrível no navegador, versionado, com estrutura inicial.
- **Entregáveis:** `.gitignore`, `README.md` (como abrir com servidor local), `index.html`, `css/estilo.css`, `js/app.js` mínimo, primeiro commit.
- **Pronto quando:** a página abre pelo servidor local sem erros no console; o README permite repetir o processo do zero; `git log` mostra o commit inicial.

### F1 — MVP: tarefas (sem recorrência)

- **Entregáveis:** formulário de tarefa; lista do dia; concluir/reabrir; editar; excluir com confirmação; cálculo do horário final; armazenamento; export/import.
- **Pronto quando:** operações sem erro no console; dados persistem após recarregar; horário final correto em 30 min, 1 h 30 e virada de meia-noite (dúvida 4); duração inválida recusada com mensagem; export/import restaura estado idêntico; checklist manual completo.

### F2 — Visões semana/mês e filtros

- **Entregáveis:** visão semana e mês (clique no dia para criar/editar), filtros por categoria/prioridade/situação, navegação anterior/próximo período.
- **Pronto quando:** tarefas aparecem no dia certo nas três visões; filtros combinam entre si; período vazio mostra estado claro.

### F3 — Recorrências e exceções

- **Entregáveis:** os 4 tipos de recorrência; fim nunca/em data/após N; cancelar, alterar e concluir uma ocorrência; editar a série inteira.
- **Pronto quando:** cada tipo gera ocorrências corretas numa janela de 3 meses (verificação manual + testes automatizados); ajustes afetam só a data escolhida; série infinita não trava a tela; dia 29–31 segue a regra aprovada.
- *(Fase de maior risco técnico; testes automatizados são essenciais aqui.)*

### F4 — Metas

- **Entregáveis:** CRUD de metas; etapas; progresso; metas financeiras (alvo/atual); associar/desassociar tarefas.
- **Pronto quando:** progresso calculado bate (ex.: 3 de 4 etapas = 75%); tarefa associada aparece na meta; excluir meta desvincula as tarefas sem apagá-las; metas financeiras mostram alvo, atual e quanto falta.

### F5 — Finanças básicas

- **Entregáveis:** CRUD de lançamentos (receita/despesa); categorias; relatório diário e mensal; comparação com o mês anterior; aviso de duplicata.
- **Pronto quando:** somas exatas com centavos (3 × R$ 0,10 = R$ 0,30); relatório do mês confere com conferência manual de 20 lançamentos fictícios; editar/excluir lançamento atualiza na hora; duplicata só grava após confirmação.

### F6 — Contas fixas e projeções

- **Entregáveis:** CRUD de contas fixas; tela de contas do mês com vencimentos; registrar pagamento com valor efetivo; bloqueio de pagamento duplicado; projeção do próximo mês.
- **Pronto quando:** segundo pagamento na mesma competência é impossível; pagamento gera lançamento real vinculado; editar/excluir pagamento reflete no lançamento e nos relatórios; projeção muda ao ativar/desativar conta; previsto e realizado aparecem em blocos e rótulos distintos, nunca somados.

### F7 — Painel principal

- **Entregáveis:** tarefas de hoje + próximas; metas ativas com progresso; resumo financeiro do mês; contas a vencer em 7 dias.
- **Pronto quando:** os quatro blocos aparecem corretos com dados de exemplo; clicar num item navega para a seção correspondente; carrega rápido com ~500 registros fictícios; sem dados, cada bloco mostra orientação ("nenhuma meta ainda").

### F8 — Polimento, celular e backup

- **Entregáveis:** responsividade (usável no celular); estados vazios/erros amigáveis; acessibilidade básica; export com nome datado; instruções de backup no README.
- **Pronto quando:** usável no celular via rede local (ou hospedagem gratuita, se aprovado) sem quebra de layout; nenhuma tela quebra sem dados; README explica backup/restauração.

### Depois da F8 (fora deste plano)

Backend + SQLite + autenticação; sincronização entre dispositivos; instalação no celular (PWA); notificações/alarmes; recorrência "esta e as próximas"; cartão/parcelamento.

## 11. Riscos técnicos e mitigações

| Risco | Gravidade | Mitigação |
|---|---|---|
| Perda de dados (navegador limpo, formatação) | Alta | Export/import desde a F1; lembretes de backup; README |
| Bugs de datas/recorrência (meia-noite, mês curto, fuso) | Alta | Datas como texto; módulo único de datas; ocorrências calculadas em janela; testes com casos de borda |
| Erro de dinheiro por decimal (0,1 + 0,2) | Alta | Centavos inteiros; testes de soma |
| Duplicidade financeira | Média | Unicidade por conta + competência; aviso em lançamentos manuais |
| Escopo grande demais / desmotivação | Alta | MVP primeiro; uma funcionalidade por vez; fases pequenas e utilizáveis |
| Privacidade (financeiro sem criptografia) | Alta | Só dados fictícios; nunca commitar dados reais; futuro backend + login |
| Estado de UI confuso sem framework | Média | Padrão único: alterar → salvar → redesenhar; funções pequenas |
| Abertura exige servidor local (`file://` não funciona) | Baixa | Documentado no README; Live Server |
| Travar em um bug | Média | Explicação passo a passo; teste mínimo isolado; tags por fase para voltar atrás |

## 12. Estratégia de testes

- **Regras (funções puras)** → testes automatizados **sem instalar nada**: `testes/testes.html` importa os módulos de regras e roda verificações com `verificar(descrição, condição)`, mostrando OK/FALHOU e um resumo. Justificativa: pega regressões em datas, recorrência e cálculos — onde os bugs doem mais — sem adicionar instalação.
- **Interface** → testes manuais guiados (roteiro fornecido a cada etapa).
- **Futuro opcional:** migrar para Vitest/Node quando você quiser aprender ferramentas de mercado (explico na hora).
- **Casos de borda obrigatórios:** virada de meia-noite; dia 31 em fevereiro; 29/02 bissexto; ocorrência cancelada some de todas as visões; concluir uma ocorrência não afeta as outras; 3 × R$ 0,10 = R$ 0,30; pagamento duplicado bloqueado; projeção não mistura previsto e realizado; importar backup restaura idêntico; JSON corrompido → erro amigável e dados antigos preservados.

## 13. Estratégia de Git e checkpoints

- Trabalhar direto na `main`; commits **pequenos e frequentes** (um por passo concluído e testado).
- Mensagens descritivas no imperativo, em português (ex.: "Adiciona cálculo do horário final").
- Ao concluir cada fase: **tag** `fase-N` — ponto seguro para voltar.
- Nunca versionar: dados reais, backups exportados, credenciais (não haverá nesta fase). O `.gitignore` cobre backups locais e arquivos do sistema operacional.
- Branches e pull requests: quando houver backend/deploy — aprendemos na hora.

## 14. Estimativa total e ritmo

- **28–44 sessões de 1–2 h** (ordem de grandeza: 40–70 h de trabalho conjunto).
- Sugestão de ritmo: 3–5 sessões por semana; cada sessão termina com algo funcionando e um commit.
- Estimativas revisadas ao final de cada fase.

## 15. Decisões aprovadas (18/10/2026)

Respostas confirmadas pela mantenedora:

1. **Ambiente:** VS Code no Windows; Node.js v24.22.0 e npm funcionando; Python instalado. O projeto será aberto por servidor local (Live Server, `npx serve` ou `python -m http.server`).
2. **Idioma do código:** nomes de variáveis, funções e comentários em **português**; nomes técnicos exigidos por ferramentas permanecem em inglês.
3. **Celular:** será usado no futuro, não nas primeiras fases; a arquitetura fica preparada para essa evolução.
4. **Tarefas após a meia-noite:** permitidas, mostrando corretamente a data e o horário final; o sistema avisa quando duração ou horários parecerem inconsistentes.
5. **Recorrência mensal nos dias 29–31:** quando o mês não tiver o dia, usar o último dia daquele mês (ex.: 31 → 28/29 de fevereiro ou 30).
6. **Edição de recorrências:** nesta fase, editar **somente esta ocorrência** ou **toda a série**; ao editar a série, perguntar se a mudança vale também para as ocorrências futuras — a forma exata será decidida na Fase 3, evitando complicação excessiva.
7. **Progresso das metas:** calculado automaticamente pelas etapas concluídas; tarefas relacionadas são referência e não alteram a porcentagem.
8. **Commits:** sugerir, explicar o que será salvo e mostrar os comandos, aguardando autorização antes de cada commit.
9. **Dados de exemplo:** permitido criar e commitar `dados/exemplo.json`, com dados claramente identificados como demonstração e sem informações pessoais ou financeiras reais.

---

> **Plano aprovado em 18/10/2026.** Próximo passo: Fase 0 — estrutura inicial do projeto.

