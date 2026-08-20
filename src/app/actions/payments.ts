"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  applyProviderStatus,
  fetchRemoteStatus,
  PAYMENT_PROVIDERS,
} from "@/server/payments";

/**
 * Actions de pagamento do painel. Reprocessamento é ação DESTRUTIVA-adjacente
 * (pode aprovar pedido e mexer no caixa) — requireRole("admin"), nunca só
 * requireStaff() (ESPEC-V2, Onda 3 item 17).
 */

export type PaymentActionResult = { ok: boolean; error?: string };

const eventIdSchema = z.string().min(1, "Evento inválido");

/**
 * Reprocessa um evento de webhook em ERRO: consulta o status ATUAL na API do
 * provedor (nunca o payload gravado) e aplica a máquina monotônica.
 */
export async function reprocessWebhookEventAction(eventId: unknown): Promise<PaymentActionResult> {
  let parsedId: string | null = null;
  try {
    await requireRole("admin");
    parsedId = eventIdSchema.parse(eventId);

    const event = await prisma.webhookEvent.findUnique({ where: { id: parsedId } });
    if (!event) return { ok: false, error: "Evento de webhook não encontrado." };

    const provider = z.enum(PAYMENT_PROVIDERS).parse(event.provider);
    if (!event.providerResourceId) {
      return { ok: false, error: "Evento sem identificador de recurso no provedor." };
    }

    const remote = await fetchRemoteStatus(provider, event.providerResourceId);
    if (!remote) {
      return {
        ok: false,
        error:
          "Sem credenciais do provedor (MP_ACCESS_TOKEN) — configure o ambiente para reprocessar.",
      };
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: {
        provider_providerTransactionId: {
          provider,
          providerTransactionId: event.providerResourceId,
        },
      },
      select: { id: true },
    });
    if (!transaction) {
      return { ok: false, error: "Transação correspondente ao evento não encontrada." };
    }

    await applyProviderStatus(transaction.id, {
      status: remote.status,
      feeAmount: remote.feeAmount,
      approvedAt: remote.approvedAt,
      rawPayload: remote.rawPayload,
    });
    await prisma.webhookEvent.update({
      where: { id: parsedId },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        errorMessage: null,
        attempts: { increment: 1 },
      },
    });

    revalidatePath("/admin/financeiro/transacoes");
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message === "NOT_AUTHENTICATED" || e.message === "NOT_AUTHORIZED"
          ? "Apenas administradores podem reprocessar webhooks."
          : e.message
        : "Erro inesperado.";
    // Melhor esforço: registra a nova tentativa falha no próprio evento.
    if (parsedId) {
      try {
        await prisma.webhookEvent.update({
          where: { id: parsedId },
          data: { status: "ERROR", errorMessage: message.slice(0, 500), attempts: { increment: 1 } },
        });
      } catch {
        // evento pode não existir — nada a registrar
      }
    }
    return { ok: false, error: message };
  }
}
