/**
 * Tipos JSON-safe da vitrine (Decimal do Prisma já convertido para number).
 * São o contrato entre os serviços de leitura (src/server/catalog.ts) e os
 * componentes client da loja.
 */

export type StoreProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  /** Chave de ícone da categoria (fallback visual quando não há imagem). */
  icon: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  /** URL da imagem principal (ou null → mostra ícone). */
  image: string | null;
  images: string[];
  fitment: string | null;
  description: string | null;
  technicalSpecs: string | null;
  warranty: string | null;
  originalCode: string | null;
  /** Unidades vendidas (agregado de order_items). */
  sold: number;
  isNew: boolean;
  /** Política de compatibilidade: UNIVERSAL | SPECIFIC | UNKNOWN. */
  fitmentType: string;
  applications: {
    vehicleVersionId: string | null;
    vehicleBrand: string;
    vehicleModel: string;
    yearStart: number | null;
    yearEnd: number | null;
    engine: string | null;
  }[];
};

/** Veículo selecionado no "Meu Carro" (localStorage + cookie p/ SSR). */
export type MyCar = {
  versionId: string;
  /** Rótulo completo (ex.: "VW Golf GTI Mk7 2014–2019"). */
  label: string;
  year?: number;
};

/**
 * Um produto atende o veículo selecionado?
 * UNIVERSAL sempre aparece (badge "Universal"); SPECIFIC exige aplicação
 * vinculada; UNKNOWN (legado) fica fora do filtro "só compatíveis".
 */
export function productMatchesVehicle(p: StoreProduct, versionId: string): boolean {
  if (p.fitmentType === "UNIVERSAL") return true;
  if (p.fitmentType === "UNKNOWN") return false;
  return p.applications.some((a) => a.vehicleVersionId === versionId);
}

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  featured: boolean;
  description: string | null;
  count: number;
};

/** Item do carrinho persistido no localStorage. */
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  brand: string | null;
  icon: string;
  image: string | null;
  /** Preço unitário efetivo no momento em que entrou no carrinho (exibição). */
  price: number;
  /** Preço cheio (riscado quando em promoção). */
  fullPrice: number;
  stock: number;
  quantity: number;
};
