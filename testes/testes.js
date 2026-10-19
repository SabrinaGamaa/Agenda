// Runner de testes automatizados no navegador.
// Carrega todas as suites (*.test.js) e executa, mostrando resultados na tela.

/**
 * Assert simples com mensagens legíveis.
 */
export class Assert {
  static count = { pass: 0, fail: 0 };
  static errors = [];
  static suiteAtual = null;
  static testAtual = null;

  static reset() {
    Assert.count = { pass: 0, fail: 0 };
    Assert.errors = [];
    Assert.suiteAtual = null;
    Assert.testAtual = null;
  }

  static _record(pass, msg, erro = null) {
    // Alguns testes antigos não passam mensagem. Nesse caso, usamos o nome do
    // teste em execução (ou um texto genérico) para nunca gravar undefined.
    const mensagem = msg ?? Assert.testAtual ?? "Verificação sem descrição";

    if (pass) {
      Assert.count.pass++;
    } else {
      Assert.count.fail++;
    }

    Assert.errors.push({
      msg: mensagem,
      pass,
      erro: pass ? null : erro,
      suite: Assert.suiteAtual ?? "Geral"
    });
  }

  static true(condicao, msg) {
    Assert._record(!!condicao, msg, condicao ? null : `Esperado true, recebeu ${condicao}`);
  }

  static false(condicao, msg) {
    Assert._record(!condicao, msg, condicao ? `Esperado false, recebeu ${condicao}` : null);
  }

  static equals(atual, esperado, msg) {
    const pass = atual === esperado;
    Assert._record(pass, msg, pass ? null : `Esperado ${JSON.stringify(esperado)}, recebeu ${JSON.stringify(atual)}`);
  }

  static deepEquals(atual, esperado, msg) {
    const pass = JSON.stringify(atual) === JSON.stringify(esperado);
    Assert._record(pass, msg, pass ? null : `Esperado ${JSON.stringify(esperado)}, recebeu ${JSON.stringify(atual)}`);
  }

  static throws(fn, msg) {
    try {
      fn();
      Assert._record(false, msg, "Esperava que lançasse erro, mas não lançou");
    } catch (e) {
      Assert._record(true, msg, null);
    }
  }

  static notThrows(fn, msg) {
    try {
      fn();
      Assert._record(true, msg, null);
    } catch (e) {
      Assert._record(false, msg, `Lançou erro inesperado: ${e.message}`);
    }
  }

  static includes(arr, item, msg) {
    const pass = Array.isArray(arr) && arr.includes(item);
    Assert._record(pass, msg, pass ? null : `Esperado que array incluísse ${JSON.stringify(item)}`);
  }

  static length(arr, len, msg) {
    const pass = Array.isArray(arr) && arr.length === len;
    Assert._record(pass, msg, pass ? null : `Esperado length ${len}, recebeu ${arr?.length ?? "não é array"}`);
  }
}

/**
 * Suite de testes - agrupa vários testes relacionados.
 */
export class Suite {
  constructor(nome) {
    this.nome = nome;
    this.testes = [];
    this.beforeEachFn = null;
    this.afterEachFn = null;
  }

  beforeEach(fn) { this.beforeEachFn = fn; }
  afterEach(fn) { this.afterEachFn = fn; }

  test(nome, fn) {
    this.testes.push({ nome, fn });
  }

  async run() {
    const resultados = [];
    Assert.suiteAtual = this.nome;

    for (const { nome, fn } of this.testes) {
      Assert.testAtual = nome;
      if (this.beforeEachFn) await this.beforeEachFn();
      let erro = null;
      try {
        await fn(Assert);
      } catch (e) {
        erro = e.message;
        Assert._record(false, nome, erro);
      }
      if (this.afterEachFn) await this.afterEachFn();
    }

    Assert.testAtual = null;
    Assert.suiteAtual = null;
    return resultados;
  }
}

/**
 * Cria uma suite e a registra globalmente para o runner encontrar.
 */
export function describe(nome, fn) {
  const suite = new Suite(nome);
  fn(suite);
  window.__TEST_SUITES = window.__TEST_SUITES || [];
  window.__TEST_SUITES.push(suite);
  return suite;
}

/**
 * Helper para testar async/await.
 */
export function it(nome, fn) {
  // Usado dentro de describe(suite => { suite.test(...) })
  // Mantido para API familiar, mas o runner usa suite.test()
  return { nome, fn };
}

/**
 * Runner principal - executa todas as suites registradas.
 */
export async function executarTestes() {
  const suites = window.__TEST_SUITES || [];
  if (suites.length === 0) {
    console.warn("Nenhuma suite de testes registrada.");
    return { total: 0, pass: 0, fail: 0, tempo: 0 };
  }

  Assert.reset();
  const inicio = performance.now();

  for (const suite of suites) {
    await suite.run();
  }

  const tempo = Math.round(performance.now() - inicio);
  return {
    total: Assert.count.pass + Assert.count.fail,
    pass: Assert.count.pass,
    fail: Assert.count.fail,
    tempo,
    detalhes: Assert.errors
  };
}

/**
 * Renderiza os resultados na tela.
 */
export function renderizarResultados(resultados, containerId = "resultados") {
  const container = document.getElementById(containerId);
  const resumo = document.getElementById("resumo");
  if (!container) return;

  container.innerHTML = "";

  if (resultados.total === 0) {
    container.innerHTML = `<p class="estado-vazio">Nenhum teste executado.</p>`;
    return;
  }

  // Agrupa pelo nome real da suíte (registrado no momento da verificação).
  // O fallback mantém compatibilidade com resultados antigos sem "suite".
  const porSuite = {};
  for (const { msg, pass, erro, suite } of resultados.detalhes) {
    const suiteNome = suite || (msg ? msg.split(" ")[0] : "Geral");
    if (!porSuite[suiteNome]) porSuite[suiteNome] = [];
    porSuite[suiteNome].push({ msg, pass, erro });
  }

  for (const [suiteNome, testes] of Object.entries(porSuite)) {
    const suiteEl = document.createElement("div");
    suiteEl.className = "teste-suite";

    const h3 = document.createElement("h3");
    h3.textContent = suiteNome;
    suiteEl.appendChild(h3);

    for (const { msg, pass, erro } of testes) {
      const item = document.createElement("div");
      item.className = `teste-item ${pass ? "pass" : "fail"}`;

      const status = document.createElement("div");
      status.className = `teste-status ${pass ? "pass" : "fail"}`;
      status.textContent = pass ? "✓" : "✗";
      item.appendChild(status);

      const nome = document.createElement("div");
      nome.className = "teste-nome";
      nome.textContent = msg;
      item.appendChild(nome);

      if (!pass && erro) {
        const erroEl = document.createElement("div");
        erroEl.className = "teste-erro";
        erroEl.textContent = erro;
        item.appendChild(erroEl);
      }

      suiteEl.appendChild(item);
    }

    container.appendChild(suiteEl);
  }

  // Atualiza resumo
  if (resumo) {
    resumo.style.display = "flex";
    document.getElementById("total").textContent = resultados.total;
    document.getElementById("passou").textContent = resultados.pass;
    document.getElementById("falhou").textContent = resultados.fail;
    document.getElementById("tempo").textContent = resultados.tempo;
  }
}

/**
 * Inicializa o botão de executar testes.
 */
export function inicializarBotaoExecutar(btnId = "btn-executar") {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "⏳ Executando...";

    const resultados = await executarTestes();
    renderizarResultados(resultados);

    btn.disabled = false;
    btn.textContent = resultados.fail > 0
      ? `▶ Executar novamente (${resultados.fail} falharam)`
      : "▶ Executar todos os testes";
  });
}