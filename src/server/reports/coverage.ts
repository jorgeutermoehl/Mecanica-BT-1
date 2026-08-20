import { prisma } from "@/lib/prisma";
import { getAvailable } from "@/server/inventory";
import { periodStartKey } from "@/server/reports/abc";

/**
 * Giro e cobertura de estoque (ESPEC-V2, Onda 3 item 13).
 * - Demanda: qtySold 90d/90 do snapshot; fallback 30d/30 para produto com
 *   primeiro movimento IN há menos de 90 dias (min(createdAt) no ledger).
 * - Cobertura: disponível (físico − reservas ativas) / demanda diária.
 * - Giro anualizado APROXIMADO por 2 pontos do razão: estoque médio ≈
 *   (saldo atual + balanceAfter do movimento mais antigo do período) / 2.
 *   É estimativa gerencial — a tela documenta a fórmula, sem uso contábil.
 * - Margem média do período sobre custo congelado do snapshot
 *   ((netRevenue − cogs) / netRevenue), com alerta abaixo de minMarginPercent.
 */

export type CoverageBand = "SEM_GIRO" | "CRITICO" | "SAUDAVEL" | "ATENCAO" | "ENCALHADO";

/** Faixas de cobertura em dias: <15 crítico, 15–45 saudável, 45–90 atenção, >90 encalhado. */
function bandFor(coverageDays: number | null): CoverageBand {
  if (coverageDays === null) return "SEM_GIRO";
  if (coverageDays < 15) return "CRITICO";
  if (coverageDays <= 45) return "SAUDAVEL";
  if (coverageDays <= 90) return "ATENCAO";
  return "ENCALHADO";
}

const round = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

export async function getCoverageReport() {
  const now = new Date();
  const start90 = periodStartKey(90, now);
  const start30 = periodStartKey(30, now);
  const since90 = new Date(now.getTime() - 90 * 86_400_000);

  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: { not: "INACTIVE" } },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      minMarginPercent: true,
    },
    orderBy: { name: "asc" },
  });
  const ids = products.map((p) => p.id);

  const [snap90, snap30, firstIn, oldestInPeriod, available] = await Promise.all([
    prisma.productSalesDaily.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, date: { gte: start90 } },
      _sum: { qtySold: true, netRevenue: true, cogs: true },
    }),
    prisma.productSalesDaily.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, date: { gte: start30 } },
      _sum: { qtySold: true },
    }),
    // Data do primeiro movimento IN de cada produto (detecta produto novo).
    prisma.inventoryMovement.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, direction: "IN" },
      _min: { createdAt: true },
    }),
    // Movimento mais antigo do período por produto (2º ponto do estoque médio).
    prisma.inventoryMovement.findMany({
      where: { productId: { in: ids }, createdAt: { gte: since90 } },
      orderBy: { createdAt: "asc" },
      distinct: ["productId"],
      select: { productId: true, balanceAfter: true },
    }),
    getAvailable(ids),
  ]);

  const snap90By = new Map(snap90.map((s) => [s.productId, s._sum]));
  const snap30By = new Map(snap30.map((s) => [s.productId, s._sum.qtySold ?? 0]));
  const firstInBy = new Map(firstIn.map((f) => [f.productId, f._min.createdAt]));
  const oldestBalanceBy = new Map(oldestInPeriod.map((m) => [m.productId, m.balanceAfter]));

  const rows = products.map((p) => {
    const sums = snap90By.get(p.id);
    const qty90 = sums?.qtySold ?? 0;
    const netRevenue90 = Number(sums?.netRevenue ?? 0);
    const cogs90 = Number(sums?.cogs ?? 0);

    // Produto novo (primeiro IN há menos de 90d, ou sem histórico de IN):
    // dividir por 90 subestimaria a demanda — usa a janela de 30 dias.
    const firstInAt = firstInBy.get(p.id) ?? null;
    const isNew = firstInAt === null || firstInAt >= since90;
    const avgDailySales = isNew ? (snap30By.get(p.id) ?? 0) / 30 : qty90 / 90;

    const availableQty = available.get(p.id) ?? p.stockQuantity;
    const coverageDays = avgDailySales > 0 ? availableQty / avgDailySales : null;

    // Estoque médio aproximado por 2 pontos do razão (estimativa documentada
    // na tela): sem movimento no período, os 2 pontos coincidem com o saldo atual.
    const oldestBalance = oldestBalanceBy.get(p.id) ?? p.stockQuantity;
    const avgStock = (p.stockQuantity + oldestBalance) / 2;
    const annualTurnover = avgStock > 0 ? (avgDailySales * 365) / avgStock : null;

    const marginPercent =
      netRevenue90 > 0 ? ((netRevenue90 - cogs90) / netRevenue90) * 100 : null;
    const minMarginPercent = p.minMarginPercent !== null ? Number(p.minMarginPercent) : null;
    const belowMinMargin =
      marginPercent !== null && minMarginPercent !== null && marginPercent < minMarginPercent;

    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      physical: p.stockQuantity,
      available: availableQty,
      avgDailySales: round(avgDailySales, 2),
      /** Janela usada na demanda: 30d para produto novo, 90d para o resto. */
      demandWindowDays: (isNew ? 30 : 90) as 30 | 90,
      coverageDays: coverageDays !== null ? round(coverageDays, 1) : null,
      band: bandFor(coverageDays),
      annualTurnover: annualTurnover !== null ? round(annualTurnover, 2) : null,
      marginPercent: marginPercent !== null ? round(marginPercent, 1) : null,
      minMarginPercent,
      belowMinMargin,
    };
  });

  // Mais urgente primeiro: cobertura menor no topo; "sem giro" ao final.
  rows.sort((a, b) => {
    if (a.coverageDays === null && b.coverageDays === null) return a.name.localeCompare(b.name);
    if (a.coverageDays === null) return 1;
    if (b.coverageDays === null) return -1;
    return a.coverageDays - b.coverageDays;
  });

  const countBand = (band: CoverageBand) => rows.filter((r) => r.band === band).length;

  return {
    rows,
    totals: {
      products: rows.length,
      critical: countBand("CRITICO"),
      healthy: countBand("SAUDAVEL"),
      attention: countBand("ATENCAO"),
      stale: countBand("ENCALHADO"),
      noTurnover: countBand("SEM_GIRO"),
      belowMinMargin: rows.filter((r) => r.belowMinMargin).length,
    },
  };
}

export type CoverageReport = Awaited<ReturnType<typeof getCoverageReport>>;
export type CoverageRow = CoverageReport["rows"][number];
