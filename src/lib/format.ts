import { COMMERCE } from "@/lib/constants";

/** Formata um valor numérico como moeda brasileira (R$). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Valor de cada parcela sem juros (máximo configurado em COMMERCE). */
export function installment(total: number, times: number = COMMERCE.maxInstallments): string {
  return formatBRL(total / times);
}

/** Percentual de desconto entre preço cheio e promocional. */
export function discountPercent(price: number, promo: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - promo) / price) * 100);
}
