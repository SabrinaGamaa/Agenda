// Funções puras para lidar com dinheiro.
// Regra do projeto: valores são guardados em CENTAVOS, sempre inteiros.
// A conversão para reais acontece só na entrada e na exibição.

// Formata centavos como moeda brasileira: 123456 -> "R$ 1.234,56".
export function formatarCentavos(centavos) {
  const numero = Number(centavos);
  const valorSeguro = Number.isFinite(numero) ? Math.round(numero) : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valorSeguro / 100);
}

// Converte reais em centavos. Aceita número (12.34) ou texto.
// Em texto, aceita tanto "1234.56" quanto o formato brasileiro "1.234,56".
export function reaisParaCentavos(valorReais) {
  let numero;

  if (typeof valorReais === "string") {
    const texto = valorReais.trim();

    if (texto === "") return 0;

    // Se tem vírgula, ela é o separador decimal e os pontos são de milhar.
    const normalizado = texto.includes(",")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto;

    numero = Number(normalizado);
  } else {
    numero = Number(valorReais);
  }

  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}

// Converte centavos no texto usado por campos de valor: 123456 -> "1234.56".
// O ponto é o separador decimal esperado por <input type="number">.
export function centavosParaReais(centavos) {
  const numero = Number(centavos);
  const valorSeguro = Number.isFinite(numero) ? Math.round(numero) : 0;
  return (valorSeguro / 100).toFixed(2);
}
