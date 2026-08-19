import type { StoreProduct } from "@/types/store";

/**
 * Busca ÚNICA do catálogo (ESPEC-V2, Onda 1 item 9): comparação normalizada
 * em minúsculas, portável entre SQLite e Postgres (nada de LIKE dependente de
 * collation). Usada pelo filtro client-side e pelo searchProducts() do server;
 * no Postgres a implementação interna do server troca por tsvector sem tocar
 * os componentes.
 */
export function matchesProductQuery(p: StoreProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [p.name, p.sku, p.brand ?? "", p.fitment ?? "", p.originalCode ?? ""]
    .join(" ")
    .toLowerCase();
  // Cada termo precisa bater (busca AND) — "turbo golf" acha "Kit Turbo p/ Golf".
  return q.split(/\s+/).every((term) => haystack.includes(term));
}
