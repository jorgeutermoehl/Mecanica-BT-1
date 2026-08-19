import { prisma } from "@/lib/prisma";

/**
 * Snapshot diário de vendas (ESPEC-V2, Onda 3 item 10) — base ÚNICA de ABC,
 * giro, cobertura e reposição.
 * - Upsert IDEMPOTENTE derivado de order_items JOIN orders.
 * - Recompute do dia é chamado APÓS o commit da transação de venda/status
 *   (nunca dentro da transação crítica).
 * - Datas pré-truncadas "YYYY-MM-DD" (portável SQLite→Postgres).
 * - Status contabilizados: pedidos não cancelados/devolvidos (mesma regra do
 *   DRE e do totalSpent do cliente).
 */

const COUNTED_STATUSES = ["PAID", "SEPARATING", "SHIPPED", "DELIVERED", "AWAITING_PAYMENT"] as const;

/** Trunca uma data para a chave "YYYY-MM-DD" (fuso do servidor). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Recalcula o snapshot de UM dia do zero (idempotente): apaga as linhas do
 * dia e regrava a partir dos pedidos. Chamar após criar pedido, cancelar,
 * devolver ou corrigir — sempre fora da transação crítica.
 */
export async function recomputeSalesDaily(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Dia inválido: ${day}`);
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start.getTime() + 86_400_000);

  const items = await prisma.orderItem.findMany({
    where: {
      productId: { not: null },
      order: { createdAt: { gte: start, lt: end }, status: { in: [...COUNTED_STATUSES] } },
    },
    select: {
      productId: true,
      quantity: true,
      unitPrice: true,
      unitCostAtSale: true,
      discount: true,
      total: true,
      orderId: true,
      order: { select: { channel: true } },
    },
  });

  type Bucket = {
    qtySold: number;
    grossRevenue: number;
    discounts: number;
    cogs: number;
    netRevenue: number;
    orders: Set<string>;
  };
  const buckets = new Map<string, Bucket>();
  for (const item of items) {
    const key = `${item.productId}|${item.order.channel}`;
    const b =
      buckets.get(key) ??
      ({ qtySold: 0, grossRevenue: 0, discounts: 0, cogs: 0, netRevenue: 0, orders: new Set() } as Bucket);
    b.qtySold += item.quantity;
    b.grossRevenue += Number(item.unitPrice) * item.quantity;
    b.discounts += Number(item.discount);
    b.cogs += Number(item.unitCostAtSale) * item.quantity;
    b.netRevenue += Number(item.total);
    b.orders.add(item.orderId);
    buckets.set(key, b);
  }

  await prisma.$transaction([
    prisma.productSalesDaily.deleteMany({ where: { date: day } }),
    ...[...buckets.entries()].map(([key, b]) => {
      const [productId, channel] = key.split("|");
      return prisma.productSalesDaily.create({
        data: {
          productId,
          date: day,
          channel,
          qtySold: b.qtySold,
          grossRevenue: b.grossRevenue,
          discounts: b.discounts,
          cogs: b.cogs,
          netRevenue: b.netRevenue,
          ordersCount: b.orders.size,
        },
      });
    }),
  ]);

  return { day, rows: buckets.size };
}

/** Reconstrói o snapshot de todos os dias com venda (backfill/reparo). */
export async function rebuildSalesDaily() {
  const orders = await prisma.order.findMany({
    where: { status: { in: [...COUNTED_STATUSES] } },
    select: { createdAt: true },
  });
  const days = [...new Set(orders.map((o) => dateKey(o.createdAt)))].sort();
  for (const day of days) await recomputeSalesDaily(day);
  return { days: days.length };
}

/**
 * Teste de consistência: SUM(snapshot) deve bater com SUM(order_items) do
 * período — divergência indica bug de agregação (mesma base do DRE).
 */
export async function verifySalesDaily() {
  const [snapshot, source] = await Promise.all([
    prisma.productSalesDaily.aggregate({ _sum: { netRevenue: true, qtySold: true } }),
    prisma.orderItem.aggregate({
      where: { productId: { not: null }, order: { status: { in: [...COUNTED_STATUSES] } } },
      _sum: { total: true, quantity: true },
    }),
  ]);
  const snapNet = Number(snapshot._sum.netRevenue ?? 0);
  const srcNet = Number(source._sum.total ?? 0);
  return {
    ok: Math.abs(snapNet - srcNet) < 0.01 && (snapshot._sum.qtySold ?? 0) === (source._sum.quantity ?? 0),
    snapshot: { netRevenue: snapNet, qtySold: snapshot._sum.qtySold ?? 0 },
    source: { netRevenue: srcNet, qtySold: source._sum.quantity ?? 0 },
  };
}
