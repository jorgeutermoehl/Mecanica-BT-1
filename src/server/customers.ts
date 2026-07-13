import { prisma } from "@/lib/prisma";
import type { CustomerFormInput, SaleChannel } from "@/lib/validations";

/** Serviço de clientes do painel (cadastro + histórico por canal). */

export async function listCustomers(search?: string) {
  const q = search?.trim();
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { document: { contains: q } }] }
        : {}),
    },
    include: {
      orders: {
        where: { status: { notIn: ["CANCELLED", "RETURNED"] } },
        select: { channel: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    const channels = [...new Set(c.orders.map((o) => o.channel))] as SaleChannel[];
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      document: c.document,
      personType: c.personType as "INDIVIDUAL" | "COMPANY",
      notes: c.notes,
      ordersCount: c.orders.length,
      totalSpent: Number(c.totalSpent),
      lastPurchaseAt: c.lastPurchaseAt?.toISOString() ?? null,
      channels,
      createdAt: c.createdAt.toISOString(),
    };
  });
}

export type CustomerRow = Awaited<ReturnType<typeof listCustomers>>[number];

export async function createCustomer(input: CustomerFormInput, userId: string) {
  const email = input.email?.toLowerCase().trim();
  if (email) {
    const existing = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
    if (existing) throw new Error("Já existe um cliente com esse e-mail.");
  }
  const customer = await prisma.customer.create({
    data: {
      name: input.name.trim(),
      email: email || null,
      phone: input.phone || null,
      document: input.document || null,
      notes: input.notes || null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE",
      entity: "Customer",
      entityId: customer.id,
      description: `Cliente "${customer.name}" cadastrado pelo painel`,
    },
  });
  return { id: customer.id };
}

/** Pedidos de um cliente (para o painel). */
export async function getCustomerOrders(customerId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, status: true, channel: true, total: true, createdAt: true },
  });
  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    channel: o.channel as SaleChannel,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
  }));
}
