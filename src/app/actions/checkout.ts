"use server";

import { revalidatePath } from "next/cache";
import { placeOrder } from "@/server/orders";
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
    // Estoque mudou → vitrine e painel precisam refletir.
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin");
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível concluir o pedido." };
  }
}
