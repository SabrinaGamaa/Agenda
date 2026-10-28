# 📊 Meu Painel Pessoal — Sistema Web de Organização Integrada

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B%20Modules-f7df1e?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Semântico-e34f26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Flexbox%20%26%20Grid-1572b6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![Sem Dependências](https://img.shields.io/badge/Dependências-Zero%20Frameworks-success)](#arquitetura-e-decisões-de-engenharia)
[![Licença](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)

Aplicação web responsiva para **gestão pessoal integrada**, reunindo **Agenda & Tarefas Recorrentes**, **Metas & Etapas**, **Finanças & Projeções** e um **Painel Principal (Dashboard)** dinâmico.

Construído do zero utilizando **Vanilla JavaScript (Módulos ES)**, **HTML5** e **CSS3**, sem o uso de frameworks ou bibliotecas externas.

---

## 🎯 Objetivo do Projeto

Demonstrar a aplicação prática de **fundamentos de Engenharia de Software** e **desenvolvimento web nativo**:
- **Arquitetura modular em camadas** (Camada de Dados, Regras de Negócio Puras, Telas e Componentes UI).
- **Testabilidade**: Suite de testes automatizados construída em JS nativo, sem necessidade de `npm` ou ferramentas de build.
- **Domínio de assincronismo, manipulação de estado, cálculo de datas e operações financeiras com precisão de centavos**.
- **Acessibilidade e Responsividade**: Layout adaptável para telas móveis e desktop, com suporte a tema escuro.

---

## 💡 Funcionalidades Principais

### 🗓️ 1. Agenda & Tarefas Recorrentes
- **Visões Flexíveis**: Navegação interativa por visão **Diária**, **Semanal** e **Mensal (Calendário)**.
- **Motor de Recorrência**: Suporte a repetições diárias, semanais, nos dias da semana e mensais (com tratamento automático para meses curtos/bissextos).
- **Gestão de Exceções**: Possibilidade de cancelar, reagendar ou alterar o horário de uma **única ocorrência** sem afetar a série inteira.
- **Prioridades e Categorias**: Filtros combinados por categoria, prioridade (Baixa, Média, Alta) e situação (Pendente/Concluída).

### 🎯 2. Gestão de Metas & Progresso
- **Tipos de Metas**: Pessoais, Profissionais e Financeiras.
- **Decomposição em Etapas**: Subtarefas com cálculo automático do progresso de conclusão.
- **Metas Financeiras**: Acompanhamento de valor alvo, valor atual, barra de progresso visual e cálculo do montante restante.
- **Vínculo com Tarefas**: Associação de tarefas da agenda às metas correspondentes.

### 💰 3. Finanças, Contas Fixas & Projeções
- **Precisão Financeira**: Operações numéricas armazenadas e calculadas em **centavos inteiros**, prevenindo erros de arredondamento em ponto flutuante.
- **Lançamentos Diários**: Cadastro de receitas e despesas com atalho de prevenção a lançamentos duplicados.
- **Contas Fixas & Pagamentos**: Agendamento de despesas recorrentes (aluguel, salário, internet), controle de vencimentos e geração automática de lançamentos no pagamento.
- **Relatórios & Gráficos**: Distribuição de gastos por categoria e comparação percentual/nominal em relação ao mês anterior.
- **Projeção Futura**: Estimativa do saldo do próximo mês baseada nas contas fixas ativas e na média de gastos variáveis dos últimos 3 meses.

### 🏠 4. Painel Principal (Dashboard)
- Resumo executivo reunindo os 4 pilares do sistema:
  1. **Tarefas de Hoje e Próximos 7 Dias**.
  2. **Metas Ativas e Progresso**.
  3. **Resumo Financeiro do Mês Atual**.
  4. **Contas a Vencer no Período**.

---

## 📐 Arquitetura e Decisões de Engenharia

O código segue o padrão de **Clean Architecture (Arquitetura Limpa)** adaptado para aplicações de página única (SPA) com JavaScript Vanilla:

```
Agenda/
├── css/                  # Temas CSS, variáveis e estilos globais
├── js/
│   ├── app.js            # Ponto de entrada (Bootstrapping da SPA)
│   ├── roteador.js       # Roteamento baseado em navegação por Hash (#/painel)
│   ├── dados/            # Camada de Armazenamento (localStorage + Export/Import JSON)
│   ├── regras/           # Regras de Negócio PURAS (Sem dependência de DOM ou localStorage)
│   ├── componentes/      # Componentes de UI reutilizáveis (Modais, Calendário, Formulários)
│   └── telas/            # Controladores das telas (Painel, Agenda, Metas, Finanças)
├── testes/               # Suite de testes automatizados nativa em JS
└── index.html            # Estrutura HTML5 semântica e container da SPA
```

### Principais Padrões Utilizados:
1. **Regras de Negócio Puras (`js/regras/`)**:
   - Todas as funções de cálculo de datas, ocorrências recorrentes, totais financeiros e progresso de metas são **funções puras** (dado a mesma entrada, sempre produzem a mesma saída, sem efeitos colaterais).
   - Facilita a manutenção e permite rodar testes unitários instantâneos.

2. **Isolamento de Dados (`js/dados/`)**:
   - A aplicação nunca interage diretamente com o `localStorage` a partir das telas. A camada de armazenamento encapsula a persistência e validações de esquema (`schemaVersion`), permitindo trocar o motor de banco de dados facilmente no futuro (ex.: IndexedDB ou API REST).

3. **Gerenciamento de Estado Previsível**:
   - Unidirectional Data Flow (Fluxo Unidirecional): **Ação do Usuário → Atualização de Estado → Salvamento na Camada de Dados → Re-renderização do Componente**.

---

## 🧪 Testes Automatizados

A aplicação possui um **Test Runner próprio**, sem necessidade de Jest, Vitest ou Node.js.

### Como executar os testes:
1. Abra a aplicação em um servidor local (veja seção abaixo).
2. Acesse no navegador a URL `/testes/testes.html` (ou clique no link de testes).
3. Clique em **▶ Executar todos os testes**.
4. A suite roda instantaneamente, validando:
   - Cálculos financeiros e soma de centavos.
   - Regras de datas, fuso horário e virada de meia-noite.
   - Algoritmo de expansão de recorrências e exceções por data.
   - Métricas do painel e relatórios.

---

## 🚀 Como Executar o Projeto Localmente

Como o projeto faz uso nativo de **Módulos ES** (`import`/`export`), ele deve ser servido através de um protocolo HTTP/HTTPS (não abra clicando duas vezes no arquivo `index.html`).

### Opção 1: VS Code (Live Server) — Recomendado
1. Instale a extensão **Live Server** no VS Code.
2. Abra a pasta do projeto no VS Code.
3. Clique com o botão direito no `index.html` e selecione **Open with Live Server**.

### Opção 2: Python
No terminal, execute:
```bash
python -m http.server 5500
# Ou no Windows com instalador oficial do Python:
py -m http.server 5500
```
Acesse `http://localhost:5500` no navegador.

### Opção 3: Node.js (npx)
```bash
npx serve .
```

---

## 📦 Backup e Portabilidade de Dados

O sistema conta com um mecanismo completo de **Exportação e Importação de Backup**:
- **Exportar**: Baixa um arquivo `.json` estruturado com controle de versão de schema e timestamp no nome.
- **Importar**: Valida a integridade do arquivo antes de restaurar os dados no ambiente local.

---

## 👤 Desenvolvedora

**Sabrina Gama**  
- GitHub: [@SabrinaGamaa](https://github.com/SabrinaGamaa)  
- Projeto criado como demonstração de competências em **JavaScript Avançado, Engenharia de Software, Arquitetura Frontend e Boas Práticas de Código**.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE) — sinta-se à vontade para utilizar para fins de estudo e aprendizado.
