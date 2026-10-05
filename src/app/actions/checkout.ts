"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog";
import { emailOrderReceived, placeOrder } from "@/server/orders";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";

export type CheckoutResult =
  | { ok: true; orderNumber: string; total: number; status: string }
  | { ok: false; error: string };

/** Finaliza a compra (preços/estoque revalidados no servidor). */
export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const result = await placeOrder(parsed.data);
    // Estoque mudou → vitrine (cache com tag) e painel precisam refletir.
    revalidateTag(CATALOG_TAG, "max");
    revalidatePath("/admin");
    if (result.created) {
      // Best-effort: e-mail nunca derruba a venda (no-op sem RESEND_API_KEY).
      await emailOrderReceived(result.orderNumber).catch(() => undefined);
    }
    return { ok: true, orderNumber: result.orderNumber, total: result.total, status: result.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível concluir o pedido." };
  }
}
