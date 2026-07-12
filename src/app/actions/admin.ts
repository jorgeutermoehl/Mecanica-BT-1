"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import {
  productSchema,
  stockAdjustSchema,
  stockEntrySchema,
  stockOutSchema,
  ORDER_STATUS,
  type OrderStatus,
} from "@/lib/validations";
import { createProduct, setProductStatus, updateProduct } from "@/server/products";
import { adjustStock, registerEntry, registerOut } from "@/server/inventory";
import { updateOrderStatus } from "@/server/orders";

export type AdminActionResult = { ok: boolean; error?: string };

function fail(e: unknown): AdminActionResult {
  if (e instanceof Error) {
    if (e.message === "NOT_AUTHENTICATED" || e.message === "NOT_AUTHORIZED") {
      return { ok: false, error: "Sessão expirada — faça login novamente." };
    }
    return { ok: false, error: e.message };
  }
  return { ok: false, error: "Erro inesperado." };
}

/** Revalida as rotas afetadas por mudanças de catálogo/estoque. */
function revalidateStore() {
  for (const path of ["/", "/produtos", "/promocoes", "/categorias", "/admin", "/admin/produtos", "/admin/estoque", "/admin/pedidos"]) {
    revalidatePath(path);
  }
}

export async function createProductAction(input: unknown): Promise<AdminActionResult & { slug?: string }> {
  try {
    const user = await requireStaff();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    const result = await createProduct(parsed.data, user.id);
    revalidateStore();
    return { ok: true, slug: result.slug };
  } catch (e) {
    return fail(e);
  }
}

export async function updateProductAction(id: string, input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await updateProduct(id, parsed.data, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setProductStatusAction(id: string, active: boolean): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    await setProductStatus(id, active, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function stockEntryAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = stockEntrySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await registerEntry(parsed.data, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function stockOutAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = stockOutSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await registerOut(parsed.data, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function stockAdjustAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = stockAdjustSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await adjustStock(parsed.data, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateOrderStatusAction(orderId: string, status: string, note?: string): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    if (!ORDER_STATUS.includes(status as OrderStatus)) {
      return { ok: false, error: "Status inválido." };
    }
    await updateOrderStatus(orderId, status as OrderStatus, user.id, note);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
