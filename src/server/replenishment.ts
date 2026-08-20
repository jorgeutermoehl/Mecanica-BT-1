import { prisma } from "@/lib/prisma";
import { getAvailable } from "@/server/inventory";
import { classifyAbc, periodStartKey, type AbcClass } from "@/server/reports/abc";

/**
 * Relatório de reposição (ESPEC-V2, Onda 3 item 14) — fonte ÚNICA da tela
 * /admin/relatorios/reposicao. Regras:
 * - Demanda diária = qtySold 90d/90 do snapshot product_sales_daily.
 * - Lead time efetivo com fonte única: products.leadTimeDaysOverride ??
 *   supplier.leadTimeDays ?? 7.
 * - Sugestão = CEIL(demanda × (cobertura alvo + lead time)) − disponível −
 *   em trânsito (itens de stock_entries com financeiro OPEN) — nunca negativa.
 * - Ponto de reposição = demanda × lead time + estoque de segurança;
 *   sem histórico de venda, fallback para minStock.
 * - Classe ABC 90d calculada on-the-fly (mesmo corte da tela de Curva ABC).
 */

const DEMAND_WINDOW_DAYS = 90;
const DEFAULT_LEAD_TIME_DAYS = 7;

export async function getReplenishmentReport() {
  const start90 = periodStartKey(DEMAND_WINDOW_DAYS);

  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: { not: "INACTIVE" } },
    select: {
      id: true,
      sku: true,
      name: true,
      stockQuantity: true,
      minStock: true,
      safetyStock: true,
      targetCoverageDays: true,
      leadTimeDaysOverride: true,
      costPrice: true,
      categoryId: true,
      category: { select: { name: true } },
      supplierId: true,
      supplier: { select: { tradeName: true, legalName: true, leadTimeDays: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { name: "asc" },
  });
  const ids = products.map((p) => p.id);

  const [snap90All, available, inTransitAgg] = await Promise.all([
    // Snapshot 90d SEM filtro de produto: a classe ABC considera toda a venda
    // do período, batendo com a tela de Curva ABC.
    prisma.productSalesDaily.groupBy({
      by: ["productId"],
      where: { date: { gte: start90 } },
      _sum: { qtySold: true, netRevenue: true },
    }),
    getAvailable(ids),
    // Em trânsito: itens de entradas pendentes (financialStatus OPEN).
    prisma.stockEntryItem.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, stockEntry: { financialStatus: "OPEN" } },
      _sum: { quantity: true },
    }),
  ]);

  const abcClasses = classifyAbc(
    new Map(snap90All.map((s) => [s.productId, Number(s._sum.netRevenue ?? 0)])),
  );
  const qty90By = new Map(snap90All.map((s) => [s.productId, s._sum.qtySold ?? 0]));
  const inTransitBy = new Map(inTransitAgg.map((i) => [i.productId, i._sum.quantity ?? 0]));

  const rows = products.map((p) => {
    const physical = p.stockQuantity;
    const availableQty = available.get(p.id) ?? physical;
    const reserved = physical - availableQty;
    const inTransit = inTransitBy.get(p.id) ?? 0;

    const qty90 = qty90By.get(p.id) ?? 0;
    const avgDailySales = qty90 / DEMAND_WINDOW_DAYS;
    const coverageDays = avgDailySales > 0 ? availableQty / avgDailySales : null;

    const leadTimeDays =
      p.leadTimeDaysOverride ?? p.supplier?.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS;

    const suggestion = Math.max(
      0,
      Math.ceil(avgDailySales * (p.targetCoverageDays + leadTimeDays)) - availableQty - inTransit,
    );

    // Ponto de reposição: demanda × lead time + segurança; sem histórico de
    // venda no período, o fallback é o minStock cadastrado.
    const reorderPoint =
      qty90 > 0 ? Math.ceil(avgDailySales * leadTimeDays + p.safetyStock) : p.minStock;
    const belowReorderPoint = reorderPoint > 0 && availableQty <= reorderPoint;

    const costPrice = Number(p.costPrice);
    const abcClass: AbcClass = abcClasses.get(p.id) ?? "C";

    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      /** Thumbnail: URL da imagem primária (fallback: primeira por posição). */
      image: p.images[0]?.url ?? null,
      categoryId: p.categoryId,
      category: p.category.name,
      supplierId: p.supplierId,
      supplierName: p.supplier?.tradeName ?? p.supplier?.legalName ?? null,
      physical,
      reserved,
      available: availableQty,
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      coverageDays: coverageDays !== null ? Math.round(coverageDays * 10) / 10 : null,
      abcClass,
      leadTimeDays,
      targetCoverageDays: p.targetCoverageDays,
      inTransit,
      reorderPoint,
      belowReorderPoint,
      suggestion,
      costPrice,
      /** Valor estimado da compra sugerida ao custo médio atual. */
      suggestionCost: suggestion * costPrice,
    };
  });

  // Prioridade de compra: abaixo do ponto primeiro, depois maior sugestão.
  rows.sort((a, b) => {
    if (a.belowReorderPoint !== b.belowReorderPoint) return a.belowReorderPoint ? -1 : 1;
    if (a.suggestion !== b.suggestion) return b.suggestion - a.suggestion;
    return a.name.localeCompare(b.name);
  });

  return {
    rows,
    totals: {
      products: rows.length,
      belowReorderPoint: rows.filter((r) => r.belowReorderPoint).length,
      suggestionUnits: rows.reduce((s, r) => s + r.suggestion, 0),
      suggestionCost: rows.reduce((s, r) => s + r.suggestionCost, 0),
    },
  };
}

export type ReplenishmentReport = Awaited<ReturnType<typeof getReplenishmentReport>>;
export type ReplenishmentRow = ReplenishmentReport["rows"][number];
