import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyProviderStatus, createTransaction, fetchRemoteStatus } from "@/server/payments";

/**
 * Webhook do Mercado Pago (ESPEC-V2, Onda 3 item 3) — idempotente e endurecido:
 *  1. valida x-signature (HMAC-SHA256 + anti-replay de ±5min) — inválida
 *     responde 401 SEM side-effects além do registro IGNORED;
 *  2. INSERT do WebhookEvent — duplicado (unique provider+eventId) responde
 *     200 e encerra;
 *  3. processa consultando o status na API DO PROVEDOR (nunca confia no
 *     payload do webhook, mesmo com assinatura válida) e aplica a máquina
 *     monotônica; erro → evento ERROR + attempts, resposta 200 (reprocessável
 *     pela tela de transações).
 *
 * Modo scaffolding: sem MP_WEBHOOK_SECRET no ambiente, registra IGNORED e
 * responde 202 — nenhuma validação fingida, nenhum side-effect financeiro.
 */

export const dynamic = "force-dynamic";

const PROVIDER = "MERCADO_PAGO" as const;
const TIMESTAMP_TOLERANCE_MS = 5 * 60_000;

/** Comparação em tempo constante (digest fixo evita vazar tamanho). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Valida o header x-signature do Mercado Pago: formato "ts=...,v1=...";
 * manifest oficial `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * (data.id alfanumérico em minúsculas), HMAC-SHA256 com o secret do webhook.
 */
function validateSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
  secret: string;
}): { valid: boolean; reason: string } {
  const { signatureHeader, requestId, dataId, secret } = input;
  if (!signatureHeader) return { valid: false, reason: "header x-signature ausente" };

  const parts = new Map<string, string>();
  for (const chunk of signatureHeader.split(",")) {
    const [key, ...rest] = chunk.split("=");
    if (key && rest.length > 0) parts.set(key.trim(), rest.join("=").trim());
  }
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return { valid: false, reason: "x-signature sem ts/v1" };

  // Anti-replay: timestamp (ms) fora da janela de ±5 minutos é rejeitado.
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { valid: false, reason: "ts inválido" };
  const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum; // tolera segundos ou ms
  if (Math.abs(Date.now() - tsMs) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, reason: "timestamp fora da janela de 5 minutos (anti-replay)" };
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  if (!safeEqual(expected, v1.toLowerCase())) {
    return { valid: false, reason: "assinatura HMAC não confere" };
  }
  return { valid: true, reason: "" };
}

/**
 * Registra o evento como IGNORED sem quebrar em duplicidade (P2002) — usado
 * nos caminhos sem processamento (assinatura inválida / modo scaffolding).
 */
async function recordIgnored(input: {
  eventId: string;
  topic: string | null;
  resourceId: string | null;
  payloadRaw: string;
  signatureValid: boolean;
  message: string;
}) {
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: PROVIDER,
        eventId: input.eventId,
        topic: input.topic,
        providerResourceId: input.resourceId,
        payloadRaw: input.payloadRaw,
        signatureValid: input.signatureValid,
        status: "IGNORED",
        errorMessage: input.message,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
    throw e;
  }
}

async function markEvent(
  id: string,
  status: "PROCESSED" | "IGNORED" | "ERROR",
  errorMessage?: string,
) {
  await prisma.webhookEvent.update({
    where: { id },
    data: {
      status,
      errorMessage: errorMessage?.slice(0, 500) ?? null,
      processedAt: status === "PROCESSED" ? new Date() : null,
      attempts: { increment: 1 },
    },
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let body: { id?: unknown; type?: string; topic?: string; data?: { id?: unknown } } = {};
  try {
    body = JSON.parse(rawBody);
  } catch {
    // corpo não-JSON: segue com defaults — o evento fica registrado como IGNORED
  }

  const url = new URL(req.url);
  // O manifest da assinatura usa o data.id da QUERY (documentação do MP).
  const dataId = url.searchParams.get("data.id") ?? String(body.data?.id ?? "");
  const topic = url.searchParams.get("type") ?? body.type ?? body.topic ?? null;
  const eventId = body.id != null ? String(body.id) : `${topic ?? "unknown"}:${dataId}`;

  // (1) Assinatura — sem secret no ambiente é modo scaffolding (202, IGNORED).
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    await recordIgnored({
      eventId,
      topic,
      resourceId: dataId || null,
      payloadRaw: rawBody,
      signatureValid: false,
      message: "Modo scaffolding: MP_WEBHOOK_SECRET ausente — evento registrado sem processar.",
    });
    return NextResponse.json({ received: true, mode: "scaffolding" }, { status: 202 });
  }

  const signature = validateSignature({
    signatureHeader: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
    secret,
  });
  if (!signature.valid) {
    await recordIgnored({
      eventId: `invalid:${eventId}:${Date.now()}`,
      topic,
      resourceId: dataId || null,
      payloadRaw: rawBody,
      signatureValid: false,
      message: `Assinatura rejeitada: ${signature.reason}`,
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // (2) Registro idempotente — duplicado responde 200 e encerra.
  let event: { id: string };
  try {
    event = await prisma.webhookEvent.create({
      data: {
        provider: PROVIDER,
        eventId,
        topic,
        providerResourceId: dataId || null,
        payloadRaw: rawBody,
        signatureValid: true,
        status: "RECEIVED",
      },
      select: { id: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    throw e;
  }

  // (3) Processamento — status SEMPRE da API do provedor, nunca do payload.
  try {
    if (topic && topic !== "payment") {
      await markEvent(event.id, "IGNORED", `Tópico não tratado: ${topic}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    if (!dataId) {
      await markEvent(event.id, "IGNORED", "Evento sem data.id — nada a consultar.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const remote = await fetchRemoteStatus(PROVIDER, dataId);
    if (!remote) {
      await markEvent(
        event.id,
        "IGNORED",
        "Modo scaffolding: MP_ACCESS_TOKEN ausente — sem consulta remota.",
      );
      return NextResponse.json({ received: true, mode: "scaffolding" }, { status: 202 });
    }

    // Acha a transação pelo id do provedor; sem ela, resolve o pedido pelo
    // external_reference retornado pela API (nunca pelo payload do webhook).
    let transaction = await prisma.paymentTransaction.findUnique({
      where: {
        provider_providerTransactionId: { provider: PROVIDER, providerTransactionId: dataId },
      },
      select: { id: true },
    });
    if (!transaction) {
      if (!remote.externalReference) {
        await markEvent(event.id, "IGNORED", "Pagamento sem external_reference — sem pedido para conciliar.");
        return NextResponse.json({ received: true }, { status: 200 });
      }
      const order = await prisma.order.findUnique({
        where: { externalReference: remote.externalReference },
        select: { id: true, total: true },
      });
      if (!order) {
        await markEvent(
          event.id,
          "IGNORED",
          `Nenhum pedido com external_reference ${remote.externalReference}.`,
        );
        return NextResponse.json({ received: true }, { status: 200 });
      }
      transaction = await createTransaction({
        orderId: order.id,
        provider: PROVIDER,
        providerTransactionId: dataId,
        method: remote.method ?? "PIX",
        amount: remote.amount ?? Number(order.total),
        installments: remote.installments,
        expiresAt: remote.expiresAt,
      });
    }

    await applyProviderStatus(transaction.id, {
      status: remote.status,
      feeAmount: remote.feeAmount,
      approvedAt: remote.approvedAt,
      rawPayload: remote.rawPayload,
    });
    await markEvent(event.id, "PROCESSED");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado no processamento.";
    await markEvent(event.id, "ERROR", message);
    // 200 mesmo em erro: o evento fica reprocessável pela tela de transações
    // (requireRole admin) sem depender da política de retry do provedor.
    return NextResponse.json({ received: true, error: true }, { status: 200 });
  }
}
