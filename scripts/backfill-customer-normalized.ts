/**
 * Backfill das colunas normalizadas do Customer (ESPEC-V2, Onda 1 item 3).
 * Idempotente: recalcula documentNormalized/phoneNormalized/instagramHandle
 * a partir dos campos livres e as métricas derivadas a partir dos pedidos.
 *
 * Uso: npx tsx scripts/backfill-customer-normalized.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  normalizeDocument,
  normalizeInstagramHandle,
  normalizePhoneBR,
} from "../src/lib/normalize";

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany();
  let updated = 0;

  for (const c of customers) {
    const documentNormalized = normalizeDocument(c.document);
    const phoneNormalized = normalizePhoneBR(c.phone) ?? normalizePhoneBR(c.whatsapp);
    const instagramHandle = c.instagramHandle ?? normalizeInstagramHandle(null);

    const agg = await prisma.order.aggregate({
      where: { customerId: c.id, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { total: true },
      _count: { _all: true },
      _max: { createdAt: true },
    });

    await prisma.customer.update({
      where: { id: c.id },
      data: {
        documentNormalized,
        phoneNormalized,
        instagramHandle,
        totalSpent: agg._sum.total ?? 0,
        ordersCount: agg._count._all,
        lastPurchaseAt: agg._max.createdAt,
      },
    });
    updated++;
  }

  console.log(`Backfill concluído: ${updated} cliente(s) normalizados e com métricas recalculadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
