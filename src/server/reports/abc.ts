import { prisma } from "@/lib/prisma";
import { dateKey } from "@/server/reports/aggregation";

/**
 * Curva ABC (ESPEC-V2, Onda 3 item 11) sobre o snapshot product_sales_daily.
 * A classe é SEMPRE calculada on-the-fly (depende do período) — nunca gravada.
 * Corte clássico por participação acumulada da receita: A ≤80%, B ≤95%, C resto.
 */

export const ABC_PERIODS = [30, 90, 180] as const;
export type AbcPeriod = (typeof ABC_PERIODS)[number];
export type AbcClass = "A" | "B" | "C";

/** Tolerância para o corte (evita que 80,000000001% de ruído de float vire classe B). */
const EPSILON = 1e-9;

/**
 * Classe pelo acumulado ANTES do item: o produto que cruza o corte pertence à
 * classe que ele completa (ABC clássico — senão o produto que sozinho fatura
 * 100% viraria classe C).
 */
function classFor(cumulativeBeforePercent: number): AbcClass {
  if (cumulativeBeforePercent < 80 - EPSILON) return "A";
  if (cumulativeBeforePercent < 95 - EPSILON) return "B";
  return "C";
}

/** Chave "YYYY-MM-DD" do início do período (hoje − periodDays). */
export function periodStartKey(periodDays: number, now = new Date()): string {
  return dateKey(new Date(now.getTime() - periodDays * 86_400_000));
}

/**
 * Classifica produtos em A/B/C pela participação acumulada da receita.
 * Reutilizada pelo relatório de reposição (classe ABC 90d) — cálculo único.
 */
export function classifyAbc(revenueByProduct: Map<string, number>): Map<string, AbcClass> {
  const sorted = [...revenueByProduct.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, revenue]) => s + revenue, 0);
  const classes = new Map<string, AbcClass>();
  let cumulative = 0;
  for (const [productId, revenue] of sorted) {
    const beforePercent = total > 0 ? (cumulative / total) * 100 : 100;
    classes.set(productId, classFor(beforePercent));
    cumulative += revenue;
  }
  return classes;
}

export async function getAbcReport(periodDays: AbcPeriod, channel?: string) {
  const start = periodStartKey(periodDays);

  const grouped = await prisma.productSalesDaily.groupBy({
    by: ["productId"],
    where: { date: { gte: start }, ...(channel ? { channel } : {}) },
    _sum: { netRevenue: true, qtySold: true },
  });

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((g) => g.productId) } },
    select: {
      id: true,
      name: true,
      sku: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const totalRevenue = grouped.reduce((s, g) => s + Number(g._sum.netRevenue ?? 0), 0);
  const sorted = grouped
    .map((g) => ({
      productId: g.productId,
      netRevenue: Number(g._sum.netRevenue ?? 0),
      qtySold: g._sum.qtySold ?? 0,
    }))
    .sort((a, b) => b.netRevenue - a.netRevenue);

  let cumulative = 0;
  const rows = sorted.map((g) => {
    const beforePercent = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 100;
    cumulative += g.netRevenue;
    const sharePercent = totalRevenue > 0 ? (g.netRevenue / totalRevenue) * 100 : 0;
    const cumulativePercent = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 100;
    const abcClass = classFor(beforePercent);
    const product = productById.get(g.productId);
    return {
      productId: g.productId,
      name: product?.name ?? "Produto removido",
      sku: product?.sku ?? "—",
      /** Thumbnail: URL da imagem primária (fallback: primeira por posição). */
      image: product?.images[0]?.url ?? null,
      qtySold: g.qtySold,
      netRevenue: g.netRevenue,
      sharePercent,
      cumulativePercent,
      class: abcClass,
    };
  });

  const countBy = (cls: AbcClass) => rows.filter((r) => r.class === cls).length;
  const revenueBy = (cls: AbcClass) =>
    rows.filter((r) => r.class === cls).reduce((s, r) => s + r.netRevenue, 0);

  return {
    periodDays,
    channel: channel ?? null,
    rows,
    totals: {
      products: rows.length,
      qtySold: rows.reduce((s, r) => s + r.qtySold, 0),
      netRevenue: totalRevenue,
      countA: countBy("A"),
      countB: countBy("B"),
      countC: countBy("C"),
      revenueA: revenueBy("A"),
      revenueB: revenueBy("B"),
      revenueC: revenueBy("C"),
    },
  };
}

export type AbcReport = Awaited<ReturnType<typeof getAbcReport>>;
export type AbcRow = AbcReport["rows"][number];
