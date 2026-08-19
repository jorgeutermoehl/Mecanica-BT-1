import { prisma } from "@/lib/prisma";
import type { MovementType, SaleChannel } from "@/lib/validations";

/**
 * Relatórios de estoque e DRE gerencial.
 * Base de tudo: o ledger de movimentações (append-only) e o custo congelado
 * dos itens vendidos (order_items.unitCostAtSale).
 */

// ===========================================================================
// Relatório de lançamentos (entradas e saídas)
// ===========================================================================

export type MovementReportFilter = {
  /** ISO date (yyyy-mm-dd) inclusivo. */
  from?: string;
  /** ISO date (yyyy-mm-dd) inclusivo. */
  to?: string;
  direction?: "ALL" | "IN" | "OUT";
};

export async function getMovementsReport(filter: MovementReportFilter = {}) {
  const where: Record<string, unknown> = {};
  if (filter.direction === "IN" || filter.direction === "OUT") {
    where.direction = filter.direction;
  }
  const createdAt: Record<string, Date> = {};
  if (filter.from) createdAt.gte = new Date(`${filter.from}T00:00:00`);
  if (filter.to) createdAt.lte = new Date(`${filter.to}T23:59:59.999`);
  if (Object.keys(createdAt).length) where.createdAt = createdAt;

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
      order: { select: { number: true, channel: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows = movements.map((m) => {
    const unitCost = Number(m.unitCost);
    return {
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      productName: m.product.name,
      sku: m.product.sku,
      type: m.type as MovementType,
      direction: m.direction as "IN" | "OUT",
      quantity: m.quantity,
      unitCost,
      /** Valor movimentado a custo (qtd × custo unitário). */
      totalValue: unitCost * m.quantity,
      balanceBefore: m.balanceBefore,
      balanceAfter: m.balanceAfter,
      reason: m.reason,
      userName: m.user?.name ?? "Sistema",
      orderNumber: m.order?.number ?? null,
      channel: (m.order?.channel ?? null) as SaleChannel | null,
    };
  });

  const entries = rows.filter((r) => r.direction === "IN");
  const outs = rows.filter((r) => r.direction === "OUT");
  const sum = (list: typeof rows, key: "quantity" | "totalValue") =>
    list.reduce((s, r) => s + r[key], 0);

  return {
    rows,
    totals: {
      entriesCount: entries.length,
      entriesQty: sum(entries, "quantity"),
      entriesValue: sum(entries, "totalValue"),
      outsCount: outs.length,
      outsQty: sum(outs, "quantity"),
      outsValue: sum(outs, "totalValue"),
      /** Resultado líquido do período a custo (entradas − saídas). */
      netValue: sum(entries, "totalValue") - sum(outs, "totalValue"),
      netQty: sum(entries, "quantity") - sum(outs, "quantity"),
    },
  };
}

export type MovementsReport = Awaited<ReturnType<typeof getMovementsReport>>;

// ===========================================================================
// Relatório de estoque atual (posição e valorização)
// ===========================================================================

export async function getCurrentStockReport() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true, brand: true },
    orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
  });

  const rows = products.map((p) => {
    const cost = Number(p.costPrice);
    const sale = Number(p.promoPrice ?? p.salePrice);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      brand: p.brand?.name ?? "—",
      status: p.status,
      quantity: p.stockQuantity,
      minStock: p.minStock,
      unitCost: cost,
      unitSale: sale,
      /** Valor do estoque a custo. */
      totalCost: cost * p.stockQuantity,
      /** Valor potencial de venda do estoque. */
      totalSale: sale * p.stockQuantity,
    };
  });

  return {
    rows,
    totals: {
      products: rows.length,
      units: rows.reduce((s, r) => s + r.quantity, 0),
      totalCost: rows.reduce((s, r) => s + r.totalCost, 0),
      totalSale: rows.reduce((s, r) => s + r.totalSale, 0),
      potentialProfit: rows.reduce((s, r) => s + (r.totalSale - r.totalCost), 0),
    },
    generatedAt: new Date().toISOString(),
  };
}

export type CurrentStockReport = Awaited<ReturnType<typeof getCurrentStockReport>>;

// ===========================================================================
// DRE gerencial (geral, por peça e por canal)
// ===========================================================================

/** Pedidos que contam receita (venda válida, mesmo que ainda em fluxo). */
const REVENUE_STATUSES = ["AWAITING_PAYMENT", "PAID", "SEPARATING", "SHIPPED", "DELIVERED"];

export type DreFilter = { from?: string; to?: string };

export async function getDreReport(filter: DreFilter = {}) {
  const createdAt: Record<string, Date> = {};
  if (filter.from) createdAt.gte = new Date(`${filter.from}T00:00:00`);
  if (filter.to) createdAt.lte = new Date(`${filter.to}T23:59:59.999`);
  const orderWhere = {
    status: { in: REVENUE_STATUSES },
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
  };

  const [orders, cancelled, purchasesAgg] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      include: { items: true },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["CANCELLED", "RETURNED"] },
        ...(Object.keys(createdAt).length ? { createdAt } : {}),
      },
      select: { total: true },
    }),
    prisma.stockEntryItem.findMany({
      where: Object.keys(createdAt).length ? { stockEntry: { entryDate: createdAt } } : {},
      select: { totalCost: true, quantity: true },
    }),
  ]);

  // ---- DRE geral (base: itens vendidos com custo congelado) ----
  let grossRevenue = 0;
  let discounts = 0;
  let shipping = 0;
  let cogs = 0;
  for (const o of orders) {
    discounts += Number(o.discount);
    shipping += Number(o.shippingCost);
    for (const i of o.items) {
      grossRevenue += Number(i.unitPrice) * i.quantity;
      cogs += Number(i.unitCostAtSale) * i.quantity;
    }
  }
  const returnsValue = cancelled.reduce((s, o) => s + Number(o.total), 0);
  const netRevenue = grossRevenue - discounts;
  const grossProfit = netRevenue - cogs;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  const purchasesValue = purchasesAgg.reduce((s, i) => s + Number(i.totalCost), 0);
  const purchasesUnits = purchasesAgg.reduce((s, i) => s + i.quantity, 0);

  // ---- DRE por peça ----
  type PerProduct = {
    name: string;
    sku: string;
    units: number;
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
  };
  const byProduct = new Map<string, PerProduct>();
  for (const o of orders) {
    for (const i of o.items) {
      const key = i.sku;
      const acc =
        byProduct.get(key) ??
        ({ name: i.productName, sku: i.sku, units: 0, revenue: 0, cogs: 0, profit: 0, margin: 0 } as PerProduct);
      acc.units += i.quantity;
      acc.revenue += Number(i.unitPrice) * i.quantity;
      acc.cogs += Number(i.unitCostAtSale) * i.quantity;
      byProduct.set(key, acc);
    }
  }
  const perProduct = [...byProduct.values()]
    .map((p) => ({
      ...p,
      profit: p.revenue - p.cogs,
      margin: p.revenue > 0 ? ((p.revenue - p.cogs) / p.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  // ---- Por canal de venda ----
  type PerChannel = { channel: SaleChannel; orders: number; revenue: number; profit: number };
  const byChannel = new Map<string, PerChannel>();
  for (const o of orders) {
    const key = o.channel;
    const acc = byChannel.get(key) ?? { channel: key as SaleChannel, orders: 0, revenue: 0, profit: 0 };
    acc.orders += 1;
    for (const i of o.items) {
      acc.revenue += Number(i.unitPrice) * i.quantity;
      acc.profit += (Number(i.unitPrice) - Number(i.unitCostAtSale)) * i.quantity;
    }
    byChannel.set(key, acc);
  }
  const perChannel = [...byChannel.values()].sort((a, b) => b.revenue - a.revenue);

  return {
    summary: {
      ordersCount: orders.length,
      grossRevenue,
      discounts,
      returnsValue,
      netRevenue,
      cogs,
      grossProfit,
      grossMargin,
      shipping,
      purchasesValue,
      purchasesUnits,
      /** Resultado gerencial do período: lucro bruto das vendas. */
      result: grossProfit,
    },
    perProduct,
    perChannel,
  };
}

export type DreReport = Awaited<ReturnType<typeof getDreReport>>;
