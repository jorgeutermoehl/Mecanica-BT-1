import { prisma } from "@/lib/prisma";

/**
 * Central de notificações do painel — derivada do estado atual do sistema
 * (sempre correta, sem tabela própria): estoque baixo, pedidos aguardando
 * ação e mensagens de contato não respondidas.
 */

export type AdminNotification = {
  id: string;
  kind: "low_stock" | "order" | "contact";
  severity: "warning" | "info";
  title: string;
  description: string;
  href: string;
  at: string;
};

export async function getNotifications(): Promise<{ items: AdminNotification[]; count: number }> {
  const [lowStock, pendingOrders, newContacts] = await Promise.all([
    prisma.$queryRawUnsafe<{ id: string; name: string; sku: string; stockQuantity: number; minStock: number; updatedAt: string }[]>(
      `SELECT id, name, sku, stockQuantity, minStock, updatedAt FROM Product
       WHERE deletedAt IS NULL AND status != 'INACTIVE' AND stockQuantity <= minStock
       ORDER BY (stockQuantity - minStock) ASC LIMIT 20`,
    ),
    prisma.order.findMany({
      where: { status: { in: ["AWAITING_PAYMENT", "PAID"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, number: true, customerName: true, status: true, total: true, createdAt: true },
    }),
    prisma.contactMessage.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, subject: true, createdAt: true },
    }),
  ]);

  const items: AdminNotification[] = [
    ...lowStock.map((p) => ({
      id: `stock-${p.id}`,
      kind: "low_stock" as const,
      severity: "warning" as const,
      title: `Estoque baixo: ${p.name}`,
      description: `${p.sku} — ${p.stockQuantity} un em estoque (mínimo ${p.minStock}). Reponha para não perder venda.`,
      href: "/admin/estoque",
      at: new Date(p.updatedAt).toISOString(),
    })),
    ...pendingOrders.map((o) => ({
      id: `order-${o.id}`,
      kind: "order" as const,
      severity: "info" as const,
      title:
        o.status === "AWAITING_PAYMENT"
          ? `Pedido ${o.number} aguardando pagamento`
          : `Pedido ${o.number} pago — separar itens`,
      description: `${o.customerName} · R$ ${Number(o.total).toFixed(2).replace(".", ",")}`,
      href: `/admin/pedidos/${o.id}`,
      at: o.createdAt.toISOString(),
    })),
    ...newContacts.map((c) => ({
      id: `contact-${c.id}`,
      kind: "contact" as const,
      severity: "info" as const,
      title: `Nova mensagem de ${c.name}`,
      description: c.subject ?? "Contato pelo site",
      href: "/admin/notificacoes",
      at: c.createdAt.toISOString(),
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return { items, count: items.length };
}
