import { prisma } from "@/lib/prisma";

/** KPIs e listas do dashboard administrativo. */

const REVENUE_STATUSES = ["PAID", "SEPARATING", "SHIPPED", "DELIVERED"];

export async function getDashboardData() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [ordersToday, ordersMonth, pendingCount, lowStockProducts, recentOrders, recentMovements, monthItems, productCount] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: dayStart }, status: { in: REVENUE_STATUSES } },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: monthStart }, status: { in: REVENUE_STATUSES } },
        select: { total: true },
      }),
      prisma.order.count({ where: { status: { in: ["AWAITING_PAYMENT", "PAID", "SEPARATING"] } } }),
      prisma.$queryRawUnsafe<{ id: string; name: string; sku: string; stockQuantity: number; minStock: number }[]>(
        `SELECT id, name, sku, stockQuantity, minStock FROM Product
         WHERE deletedAt IS NULL AND status != 'INACTIVE' AND stockQuantity <= minStock
         ORDER BY (stockQuantity - minStock) ASC LIMIT 8`,
      ),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, number: true, customerName: true, status: true, total: true, createdAt: true },
      }),
      prisma.inventoryMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { product: { select: { name: true, sku: true } }, user: { select: { name: true } } },
      }),
      prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: monthStart }, status: { in: REVENUE_STATUSES } } },
        select: { quantity: true, unitPrice: true, unitCostAtSale: true, productName: true },
      }),
      prisma.product.count({ where: { deletedAt: null, status: { not: "INACTIVE" } } }),
    ]);

  const revenueToday = ordersToday.reduce((s, o) => s + Number(o.total), 0);
  const revenueMonth = ordersMonth.reduce((s, o) => s + Number(o.total), 0);

  // Lucro estimado do mês via custo congelado (CMV correto).
  const profitMonth = monthItems.reduce(
    (s, i) => s + (Number(i.unitPrice) - Number(i.unitCostAtSale)) * i.quantity,
    0,
  );
  const itemsRevenue = monthItems.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const grossMargin = itemsRevenue > 0 ? (profitMonth / itemsRevenue) * 100 : 0;

  // Mais vendidos do mês.
  const soldByName = new Map<string, number>();
  for (const i of monthItems) {
    soldByName.set(i.productName, (soldByName.get(i.productName) ?? 0) + i.quantity);
  }
  const topSellers = [...soldByName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  return {
    revenueToday,
    revenueMonth,
    ordersToday: ordersToday.length,
    ordersMonth: ordersMonth.length,
    pendingCount,
    productCount,
    profitMonth,
    grossMargin,
    lowStock: lowStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stockQuantity,
      minStock: p.minStock,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
    })),
    recentMovements: recentMovements.map((m) => ({
      id: m.id,
      productName: m.product.name,
      sku: m.product.sku,
      type: m.type,
      direction: m.direction as "IN" | "OUT",
      quantity: m.quantity,
      userName: m.user?.name ?? "Sistema",
      createdAt: m.createdAt.toISOString(),
    })),
    topSellers,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
