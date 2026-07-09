/**
 * Dados de demonstração da vitrine. Espelham o formato do modelo Prisma para
 * facilitar a troca por dados reais quando o banco (Supabase) estiver ligado.
 */

export type IconKey =
  | "turbo"
  | "motor"
  | "freios"
  | "suspensao"
  | "filtros"
  | "eletrica"
  | "oleos"
  | "escape"
  | "bateria"
  | "acessorios";

export type MockCategory = {
  name: string;
  slug: string;
  icon: IconKey;
  count: number;
};

export type MockProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  icon: IconKey;
  brand: string;
  price: number;
  promoPrice?: number;
  stock: number;
  sold?: number;
  rating?: number;
  bestSeller?: boolean;
  isNew?: boolean;
  fitment?: string;
};

export const CATEGORIES: MockCategory[] = [
  { name: "Turbo & Boost", slug: "turbo", icon: "turbo", count: 48 },
  { name: "Motor", slug: "motor", icon: "motor", count: 132 },
  { name: "Escape", slug: "escape", icon: "escape", count: 37 },
  { name: "Freios", slug: "freios", icon: "freios", count: 64 },
  { name: "Suspensão", slug: "suspensao", icon: "suspensao", count: 58 },
  { name: "Admissão & Filtros", slug: "filtros", icon: "filtros", count: 41 },
  { name: "Elétrica & Ignição", slug: "eletrica", icon: "eletrica", count: 73 },
  { name: "Óleos & Fluidos", slug: "oleos", icon: "oleos", count: 29 },
];

export const BRANDS = [
  "Garrett",
  "Bosch",
  "NGK",
  "Cofap",
  "Mahle",
  "Brembo",
  "Sachs",
  "Magneti Marelli",
];

export const PRODUCTS: MockProduct[] = [
  { id: "p1", sku: "TRB-GRT-045", name: "Turbina Billet .50 Anti-lag", slug: "turbina-billet-050-antilag", category: "Turbo & Boost", categorySlug: "turbo", icon: "turbo", brand: "Garrett", price: 3890, promoPrice: 3490, stock: 6, sold: 42, rating: 5, bestSeller: true, fitment: "Universal · até 450cv" },
  { id: "p2", sku: "INT-FMC-012", name: "Intercooler Frontal Race 600x300", slug: "intercooler-frontal-race-600x300", category: "Turbo & Boost", categorySlug: "turbo", icon: "turbo", brand: "Garrett", price: 1290, stock: 14, sold: 31, rating: 5, isNew: true, fitment: "Universal" },
  { id: "p3", sku: "ESC-INX-089", name: "Escape Esportivo Inox 3\" Cat-back", slug: "escape-esportivo-inox-3-catback", category: "Escape", categorySlug: "escape", icon: "escape", brand: "Cofap", price: 2150, promoPrice: 1899, stock: 9, sold: 27, rating: 4, bestSeller: true, fitment: "Golf GTI Mk7" },
  { id: "p4", sku: "SUS-COL-334", name: "Kit Coilover Rosca Regulável", slug: "kit-coilover-rosca-regulavel", category: "Suspensão", categorySlug: "suspensao", icon: "suspensao", brand: "Sachs", price: 4200, stock: 5, sold: 18, rating: 5, fitment: "Civic Si / Type R" },
  { id: "p5", sku: "FRE-BRB-201", name: "Kit Big Brake 4 Pistões", slug: "kit-big-brake-4-pistoes", category: "Freios", categorySlug: "freios", icon: "freios", brand: "Brembo", price: 6890, stock: 3, sold: 12, rating: 5, bestSeller: true, fitment: "Universal · aro 17+" },
  { id: "p6", sku: "IGN-NGK-777", name: "Vela de Ignição Iridium Racing", slug: "vela-ignicao-iridium-racing", category: "Elétrica & Ignição", categorySlug: "eletrica", icon: "eletrica", brand: "NGK", price: 79.9, promoPrice: 59.9, stock: 120, sold: 340, rating: 5, bestSeller: true, fitment: "Multiaplicação" },
  { id: "p7", sku: "ADM-KNF-058", name: "Filtro de Ar Esportivo Cônico", slug: "filtro-ar-esportivo-conico", category: "Admissão & Filtros", categorySlug: "filtros", icon: "filtros", brand: "Mahle", price: 249.9, stock: 64, sold: 96, rating: 4, isNew: true, fitment: "Entrada 76mm" },
  { id: "p8", sku: "MOT-CLT-410", name: "Kit Embreagem Reforçada Cerâmica", slug: "kit-embreagem-reforcada-ceramica", category: "Motor", categorySlug: "motor", icon: "motor", brand: "Sachs", price: 1780, promoPrice: 1590, stock: 8, sold: 22, rating: 5, fitment: "1.8T / 2.0 TSI" },
  { id: "p9", sku: "INJ-BSH-550", name: "Bico Injetor Alta Vazão 550cc", slug: "bico-injetor-alta-vazao-550cc", category: "Motor", categorySlug: "motor", icon: "motor", brand: "Bosch", price: 320, stock: 40, sold: 58, rating: 4, fitment: "Jogo com 4" },
  { id: "p10", sku: "BAT-MAG-060", name: "Bateria Performance 60Ah", slug: "bateria-performance-60ah", category: "Elétrica & Ignição", categorySlug: "eletrica", icon: "bateria", brand: "Magneti Marelli", price: 559.9, stock: 0, sold: 15, rating: 4, fitment: "Universal 12V" },
  { id: "p11", sku: "OIL-MTL-5W40", name: "Óleo Sintético 5W40 Racing 1L", slug: "oleo-sintetico-5w40-racing-1l", category: "Óleos & Fluidos", categorySlug: "oleos", icon: "oleos", brand: "Mahle", price: 64.9, promoPrice: 49.9, stock: 200, sold: 410, rating: 5, bestSeller: true, fitment: "Alta performance" },
  { id: "p12", sku: "TRB-WST-038", name: "Wastegate Externa 44mm", slug: "wastegate-externa-44mm", category: "Turbo & Boost", categorySlug: "turbo", icon: "turbo", brand: "Garrett", price: 890, stock: 11, sold: 19, rating: 5, isNew: true, fitment: "Universal" },
];

export const BEST_SELLERS = PRODUCTS.filter((p) => p.bestSeller);
export const ON_SALE = PRODUCTS.filter((p) => p.promoPrice);
export const NEW_ARRIVALS = PRODUCTS.filter((p) => p.isNew);

export function getProduct(slug: string): MockProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function relatedProducts(product: MockProduct, limit = 4): MockProduct[] {
  return PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  ).slice(0, limit);
}
