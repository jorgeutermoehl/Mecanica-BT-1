import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireStalePayments } from "@/server/payments";
import { logAudit } from "@/server/audit";

/**
 * Cron único de expiração (ESPEC-V2, Onda 3 item 6): transações CREATED/PENDING
 * vencidas → EXPIRED, reservas ACTIVE vencidas → EXPIRED e pedidos
 * AWAITING_PAYMENT dessas transações → CANCELLED (note "PAYMENT_EXPIRED").
 *
 * Autenticação: Authorization: Bearer <CRON_SECRET> comparado em tempo
 * constante. Secret ausente no ambiente OU token errado → 404 (nunca 401),
 * para não confirmar a existência da rota. Idempotente — re-rodável.
 */

export const dynamic = "force-dynamic";

/** Comparação em tempo constante (digest fixo evita vazar tamanho). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

  if (!secret || !token || !safeEqual(token, secret)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const counts = await expireStalePayments();

  // Trilha da execução (fora de transação: expireStalePayments já commitou e o
  // cancelamento de pedidos audita individualmente via updateOrderStatus).
  await logAudit(prisma, {
    userId: null,
    action: "PAYMENT_REGISTER",
    entity: "PaymentTransaction",
    description: `Cron expire-payments: ${counts.expiredTransactions} transações, ${counts.expiredReservations} reservas, ${counts.cancelledOrders} pedidos`,
  });

  return NextResponse.json(counts, { status: 200 });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
