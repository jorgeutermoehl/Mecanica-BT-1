import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { matchesProductQuery } from "@/lib/search";
import type { StoreCategory, StoreProduct } from "@/types/store";

/**
 * Leituras da vitrine (loja pública). Converte Decimal → number e devolve
 * tipos JSON-safe (StoreProduct/StoreCategory) prontos para client components.
 *
 * Cache com tag "catalog" (ESPEC-V2, Onda 1 item 8): as páginas públicas leem
 * daqui sem ir ao banco a cada request; os server actions de produto/preço
 * disparam revalidateTag("catalog") e o cadastro aparece imediatamente na loja.
 */

export const CATALOG_TAG = "catalog";

const NEW_DAYS = 45;

type ProductWithRelations = Awaited<ReturnType<typeof fetchProducts>>[number];

function fetchProducts(where: object = {}) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      status: { not: "INACTIVE" },
      ...where,
    },
    include: {
      category: true,
      brand: true,
      images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
      applications: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function soldByProduct(): Promise<Map<string, number>> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: { order: { status: { notIn: ["CANCELLED", "RETURNED"] } } },
  });
  const map = new Map<string, number>();
  for (const g of grouped) {
    if (g.productId) map.set(g.productId, g._sum.quantity ?? 0);
  }
  return map;
}

function toStoreProduct(p: ProductWithRelations, sold: number): StoreProduct {
  const images = p.images.map((i) => i.url);
  const ageDays = (Date.now() - p.createdAt.getTime()) / 86_400_000;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? null,
    category: p.category.name,
    categorySlug: p.category.slug,
    icon: p.category.icon ?? p.category.slug,
    price: Number(p.salePrice),
    promoPrice: p.promoPrice !== null ? Number(p.promoPrice) : null,
    stock: p.stockQuantity,
    image: images[0] ?? null,
    images,
    fitment: p.fitment,
    description: p.description,
    technicalSpecs: p.technicalSpecs,
    warranty: p.warranty,
    originalCode: p.originalCode,
    sold,
    isNew: ageDays <= NEW_DAYS,
    fitmentType: p.fitmentType,
    applications: p.applications.map((a) => ({
      vehicleVersionId: a.vehicleVersionId,
      vehicleBrand: a.vehicleBrand,
      vehicleModel: a.vehicleModel,
      yearStart: a.yearStart,
      yearEnd: a.yearEnd,
      engine: a.engine,
    })),
  };
}

/** Todos os produtos publicados na loja (cacheado por tag). */
export const getStoreProducts = unstable_cache(
  async (): Promise<StoreProduct[]> => {
    const [products, sold] = await Promise.all([fetchProducts(), soldByProduct()]);
    return products.map((p) => toStoreProduct(p, sold.get(p.id) ?? 0));
  },
  ["store-products"],
  { tags: [CATALOG_TAG] },
);

export async function getStoreProduct(slug: string): Promise<StoreProduct | null> {
  const all = await getStoreProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

/** Busca única do catálogo — implementação interna trocável (tsvector no Postgres). */
export async function searchProducts(query: string): Promise<StoreProduct[]> {
  const all = await getStoreProducts();
  return all.filter((p) => matchesProductQuery(p, query));
}

export async function getRelatedProducts(product: StoreProduct, limit = 4): Promise<StoreProduct[]> {
  const all = await getStoreProducts();
  return all.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, limit);
}

export const getStoreCategories = unstable_cache(
  async (): Promise<StoreCategory[]> => {
    const cats = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null, status: { not: "INACTIVE" } } } },
        },
      },
    });
    return cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? c.slug,
      featured: c.featured,
      description: c.description,
      count: c._count.products,
    }));
  },
  ["store-categories"],
  { tags: [CATALOG_TAG] },
);

/**
 * Catálogo de veículos para o seletor "Meu Carro" (árvore completa — pequena
 * o bastante para ir inteira ao client e alimentar a cascata sem round-trips).
 */
export const getVehicleCatalog = unstable_cache(
  async () => {
    const makes = await prisma.vehicleMake.findMany({
      where: { isActive: true, models: { some: { isActive: true, versions: { some: { isActive: true } } } } },
      orderBy: { name: "asc" },
      include: {
        models: {
          where: { isActive: true, versions: { some: { isActive: true } } },
          orderBy: { name: "asc" },
          include: {
            versions: {
              where: { isActive: true },
              orderBy: [{ yearStart: "desc" }, { name: "asc" }],
            },
          },
        },
      },
    });
    return makes.map((make) => ({
      id: make.id,
      name: make.name,
      slug: make.slug,
      models: make.models.map((model) => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        versions: model.versions.map((v) => ({
          id: v.id,
          name: v.name,
          yearStart: v.yearStart,
          yearEnd: v.yearEnd,
          engine: v.engine,
          label: `${v.name} ${v.yearEnd ? `${v.yearStart}–${v.yearEnd}` : `${v.yearStart}+`}${v.engine ? ` · ${v.engine}` : ""}`,
        })),
      })),
    }));
  },
  ["vehicle-catalog"],
  { tags: [CATALOG_TAG] },
);

export type VehicleCatalog = Awaited<ReturnType<typeof getVehicleCatalog>>;

/** Dados agregados da home (uma ida ao banco para a lista, depois fatia). */
export async function getHomeData() {
  const [products, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  const inStock = products.filter((p) => p.stock > 0);
  const bySold = [...inStock].sort((a, b) => b.sold - a.sold);

  return {
    categories,
    bestSellers: bySold.slice(0, 4),
    onSale: products.filter((p) => p.promoPrice !== null).slice(0, 8),
    wheels: products.filter((p) => p.categorySlug === "rodas").slice(0, 4),
    newArrivals: products.filter((p) => p.isNew).slice(0, 4),
    totalProducts: products.length,
  };
}
