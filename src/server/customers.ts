import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CustomerFormInput, SaleChannel } from "@/lib/validations";
import {
  addressDedupeKey,
  normalizeDocument,
  normalizeEmail,
  normalizeInstagramHandle,
  normalizePhoneBR,
} from "@/lib/normalize";
import { logAudit } from "@/server/audit";

/** Serviço de clientes: identity resolution, ficha 360º e métricas derivadas. */

type Db = Prisma.TransactionClient;

export interface ResolveCustomerInput {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  instagramHandle?: string | null;
  whatsapp?: string | null;
  /** Canal de aquisição gravado apenas na criação (primeira origem). */
  acquisitionChannel?: SaleChannel;
}

/**
 * Identity resolution (ESPEC-V2, Onda 1 item 3): antes de criar cliente,
 * procura por identificadores FORTES em ordem de prioridade —
 * 1) documento (só dígitos), 2) e-mail, 3) telefone E.164, 4) handle Instagram.
 * Match encontrado reaproveita o cadastro preenchendo APENAS campos vazios,
 * nunca sobrescrevendo dado existente. Sem match, cria.
 */
export async function resolveCustomer(
  db: Db,
  input: ResolveCustomerInput,
): Promise<{ id: string; created: boolean }> {
  const documentNormalized = normalizeDocument(input.document);
  const email = normalizeEmail(input.email);
  const phoneNormalized = normalizePhoneBR(input.phone) ?? normalizePhoneBR(input.whatsapp);
  const instagramHandle = normalizeInstagramHandle(input.instagramHandle);

  const matchers: Prisma.CustomerWhereInput[] = [];
  if (documentNormalized) matchers.push({ documentNormalized });
  if (email) matchers.push({ email });
  if (phoneNormalized) matchers.push({ phoneNormalized });
  if (instagramHandle) matchers.push({ instagramHandle });

  let existing = null;
  for (const matcher of matchers) {
    existing = await db.customer.findFirst({
      where: { ...matcher, deletedAt: null, mergedIntoId: null },
    });
    if (existing) break;
  }

  if (existing) {
    // Completa somente o que está vazio — dado já cadastrado tem prioridade.
    const fill: Prisma.CustomerUpdateInput = {};
    if (!existing.document && input.document) fill.document = input.document;
    if (!existing.documentNormalized && documentNormalized) fill.documentNormalized = documentNormalized;
    if (!existing.email && email) fill.email = email;
    if (!existing.phone && input.phone) fill.phone = input.phone;
    if (!existing.phoneNormalized && phoneNormalized) fill.phoneNormalized = phoneNormalized;
    if (!existing.instagramHandle && instagramHandle) fill.instagramHandle = instagramHandle;
    if (!existing.whatsapp && input.whatsapp) fill.whatsapp = input.whatsapp;
    if (Object.keys(fill).length > 0) {
      await db.customer.update({ where: { id: existing.id }, data: fill });
    }
    return { id: existing.id, created: false };
  }

  const customer = await db.customer.create({
    data: {
      name: input.name.trim(),
      document: input.document || null,
      documentNormalized,
      email,
      phone: input.phone || null,
      phoneNormalized,
      instagramHandle,
      whatsapp: input.whatsapp || null,
      acquisitionChannel: input.acquisitionChannel ?? null,
    },
  });
  return { id: customer.id, created: true };
}

/**
 * Escritor ÚNICO das métricas derivadas do cliente (ESPEC-V2, Onda 1 item 6).
 * Recalcula do zero (idempotente) a partir dos pedidos não cancelados/devolvidos.
 */
export async function recalcCustomerStats(db: Db, customerId: string) {
  const agg = await db.order.aggregate({
    where: { customerId, status: { notIn: ["CANCELLED", "RETURNED"] } },
    _sum: { total: true },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  await db.customer.update({
    where: { id: customerId },
    data: {
      totalSpent: agg._sum.total ?? 0,
      ordersCount: agg._count._all,
      lastPurchaseAt: agg._max.createdAt,
    },
  });
}

export interface AddressInput {
  zipCode: string;
  street: string;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city: string;
  state: string;
}

/**
 * Endereço do checkout vira Address reutilizável (ESPEC-V2, Onda 1 item 7).
 * Dedupe por CEP+número+complemento; o primeiro endereço do cliente vira
 * padrão com label "Entrega". O snapshot ship* do pedido permanece intocado.
 */
export async function upsertCustomerAddress(db: Db, customerId: string, input: AddressInput) {
  const key = addressDedupeKey(input);
  const existing = await db.address.findMany({ where: { customerId } });
  const match = existing.find((a) => addressDedupeKey(a) === key);
  if (match) return { id: match.id, created: false };

  const address = await db.address.create({
    data: {
      customerId,
      label: "Entrega",
      zipCode: input.zipCode,
      street: input.street,
      number: input.number || null,
      complement: input.complement || null,
      district: input.district || null,
      city: input.city,
      state: input.state.toUpperCase(),
      isDefault: existing.length === 0,
    },
  });
  return { id: address.id, created: true };
}

export async function listCustomers(search?: string) {
  const q = search?.trim();
  const qHandle = normalizeInstagramHandle(q);
  const qPhone = normalizePhoneBR(q);
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q.toLowerCase() } },
              { document: { contains: q } },
              ...(qHandle ? [{ instagramHandle: qHandle }] : []),
              ...(qPhone ? [{ phoneNormalized: qPhone }] : []),
            ],
          }
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
      instagramHandle: c.instagramHandle,
      whatsapp: c.whatsapp,
      acquisitionChannel: (c.acquisitionChannel as SaleChannel | null) ?? null,
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

/** Opções leves para a busca de cliente ("lupa") em formulários do painel. */
export async function listCustomerOptions() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, document: true, instagramHandle: true },
  });
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    hint: c.instagramHandle ? `@${c.instagramHandle}` : (c.phone ?? c.document ?? ""),
  }));
}

export type CustomerOption = Awaited<ReturnType<typeof listCustomerOptions>>[number];

export async function createCustomer(input: CustomerFormInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const resolved = await resolveCustomer(tx, {
      name: input.name,
      document: input.document || null,
      email: input.email || null,
      phone: input.phone || null,
      instagramHandle: input.instagram || null,
      whatsapp: input.whatsapp || null,
      acquisitionChannel: input.acquisitionChannel,
    });
    if (resolved.created && input.notes) {
      await tx.customer.update({ where: { id: resolved.id }, data: { notes: input.notes } });
    }
    await logAudit(tx, {
      userId,
      action: resolved.created ? "CUSTOMER_CREATE" : "CUSTOMER_UPDATE",
      entity: "Customer",
      entityId: resolved.id,
      description: resolved.created
        ? `Cliente "${input.name.trim()}" cadastrado pelo painel`
        : `Cadastro reaproveitado por identificador existente (documento/e-mail/telefone/Instagram)`,
    });
    return { id: resolved.id, created: resolved.created };
  });
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

/** Ficha 360º do cliente (ESPEC-V2, Onda 1 item 5) — tudo JSON-safe. */
export async function getCustomer360(customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          channel: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
        },
      },
      receivables: {
        where: { status: { not: "PAID" } },
        orderBy: { dueDate: "asc" },
        select: { id: true, description: true, amount: true, dueDate: true, status: true },
      },
      couponRedemptions: {
        orderBy: { usedAt: "desc" },
        select: {
          id: true,
          usedAt: true,
          coupon: { select: { code: true, type: true, value: true } },
        },
      },
    },
  });
  if (!customer) return null;

  const [statusHistory, auditTrail] = await Promise.all([
    prisma.orderStatusHistory.findMany({
      where: { order: { customerId } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        note: true,
        createdAt: true,
        order: { select: { number: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: "Customer", entityId: customerId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, action: true, description: true, createdAt: true },
    }),
  ]);

  const paidOrders = customer.orders.filter(
    (o) => !["CANCELLED", "RETURNED"].includes(o.status),
  );
  const totalSpent = Number(customer.totalSpent);

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    whatsapp: customer.whatsapp,
    instagramHandle: customer.instagramHandle,
    document: customer.document,
    personType: customer.personType as "INDIVIDUAL" | "COMPANY",
    acquisitionChannel: (customer.acquisitionChannel as SaleChannel | null) ?? null,
    notes: customer.notes,
    totalSpent,
    ordersCount: customer.ordersCount,
    avgTicket: paidOrders.length > 0 ? totalSpent / paidOrders.length : 0,
    lastPurchaseAt: customer.lastPurchaseAt?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
    addresses: customer.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      zipCode: a.zipCode,
      street: a.street,
      number: a.number,
      complement: a.complement,
      district: a.district,
      city: a.city,
      state: a.state,
      isDefault: a.isDefault,
    })),
    orders: customer.orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      channel: o.channel as SaleChannel,
      total: Number(o.total),
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.toISOString(),
    })),
    openReceivables: customer.receivables.map((r) => ({
      id: r.id,
      description: r.description,
      amount: Number(r.amount),
      dueDate: r.dueDate.toISOString(),
      status: r.status,
    })),
    coupons: customer.couponRedemptions.map((c) => ({
      id: c.id,
      code: c.coupon.code,
      type: c.coupon.type as "PERCENT" | "FIXED",
      value: Number(c.coupon.value),
      usedAt: c.usedAt.toISOString(),
    })),
    timeline: [
      ...statusHistory.map((h) => ({
        id: `st-${h.id}`,
        kind: "ORDER_STATUS" as const,
        title: `Pedido ${h.order.number}`,
        detail: h.note ?? h.status,
        status: h.status,
        at: h.createdAt.toISOString(),
      })),
      ...auditTrail.map((a) => ({
        id: `au-${a.id}`,
        kind: "AUDIT" as const,
        title: a.action,
        detail: a.description ?? "",
        status: null,
        at: a.createdAt.toISOString(),
      })),
    ].sort((x, y) => (x.at < y.at ? 1 : -1)),
  };
}

export type Customer360 = NonNullable<Awaited<ReturnType<typeof getCustomer360>>>;

/**
 * Possíveis duplicados — SÓ sob demanda (botão "Buscar duplicados").
 * Compara apenas colunas normalizadas indexadas; nunca similaridade de nome.
 */
export async function findPossibleDuplicates(customerId: string) {
  const c = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!c) return [];
  const matchers: Prisma.CustomerWhereInput[] = [];
  if (c.documentNormalized) matchers.push({ documentNormalized: c.documentNormalized });
  if (c.email) matchers.push({ email: c.email });
  if (c.phoneNormalized) matchers.push({ phoneNormalized: c.phoneNormalized });
  if (matchers.length === 0) return [];

  const dupes = await prisma.customer.findMany({
    where: { id: { not: customerId }, deletedAt: null, mergedIntoId: null, OR: matchers },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      document: true,
      ordersCount: true,
      totalSpent: true,
    },
  });
  return dupes.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    document: d.document,
    ordersCount: d.ordersCount,
    totalSpent: Number(d.totalSpent),
  }));
}
