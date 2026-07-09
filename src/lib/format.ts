/** Formata um valor numérico como moeda brasileira (R$). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Retorna o valor de cada parcela sem juros (padrão 10x). */
export function installment(total: number, times = 10): string {
  return formatBRL(total / times);
}

/** Percentual de desconto entre preço cheio e promocional. */
export function discountPercent(price: number, promo: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - promo) / price) * 100);
}
