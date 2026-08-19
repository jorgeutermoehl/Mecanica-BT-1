"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog";
import { requireStaff } from "@/lib/auth";
import {
  productSchema,
  stockAdjustSchema,
  stockEntrySchema,
  stockOutSchema,
  manualSaleSchema,
  couponSchema,
  promoPriceSchema,
  customerFormSchema,
  ORDER_STATUS,
  type OrderStatus,
} from "@/lib/validations";
import { createProduct, setProductStatus, updateProduct } from "@/server/products";
import { adjustStock, correctMovement, registerEntry, registerOut, reverseMovement } from "@/server/inventory";
import { registerManualSale, updateOrderStatus } from "@/server/orders";
import { createCoupon, setCouponActive, setPromoPrice, clearPromoPrice } from "@/server/promotions";
import { createCustomer, findPossibleDuplicates } from "@/server/customers";
import {
  addAllModelVersions,
  addProductApplication,
  copyProductApplications,
  createVehicleMake,
  createVehicleModel,
  createVehicleVersion,
  deactivateVehicleVersion,
  getVehicleOptions,
  removeProductApplication,
} from "@/server/vehicles";
import {
  vehicleMakeSchema,
  vehicleModelSchema,
  vehicleVersionSchema,
  productApplicationSchema,
} from "@/lib/validations";

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
  // Loja pública lê do cache com tag — invalidar a tag publica na hora.
  revalidateTag(CATALOG_TAG, "max");
  for (const path of ["/", "/produtos", "/promocoes", "/admin", "/admin/produtos", "/admin/estoque", "/admin/pedidos"]) {
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

/** "Excluir" movimentação = estorno (lançamento reverso, append-only). */
export async function reverseMovementAction(movementId: string): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    if (!movementId) return { ok: false, error: "Movimentação inválida." };
    await reverseMovement(movementId, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** "Editar" movimentação = estorno + relançamento com os novos valores. */
export async function correctMovementAction(
  movementId: string,
  input: { quantity: number; unitCost?: number; reason?: string },
): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    if (!movementId) return { ok: false, error: "Movimentação inválida." };
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, error: "Quantidade deve ser maior que zero." };
    }
    await correctMovement(
      movementId,
      {
        quantity,
        unitCost: input.unitCost !== undefined ? Number(input.unitCost) : undefined,
        reason: input.reason,
      },
      user.id,
    );
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Venda manual (Instagram/WhatsApp/loja) — pedido + baixa + financeiro. */
export async function manualSaleAction(input: unknown): Promise<AdminActionResult & { orderNumber?: string }> {
  try {
    const user = await requireStaff();
    const parsed = manualSaleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    const result = await registerManualSale(parsed.data, user.id);
    revalidateStore();
    return { ok: true, orderNumber: result.orderNumber };
  } catch (e) {
    return fail(e);
  }
}

export async function createCouponAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = couponSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await createCoupon(parsed.data, user.id);
    revalidatePath("/admin/promocoes");
    revalidatePath("/promocoes");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setCouponActiveAction(id: string, active: boolean): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    await setCouponActive(id, active, user.id);
    revalidatePath("/admin/promocoes");
    revalidatePath("/promocoes");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setPromoPriceAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = promoPriceSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await setPromoPrice(parsed.data, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function clearPromoPriceAction(productId: string): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    await clearPromoPrice(productId, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createCustomerAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = customerFormSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await createCustomer(parsed.data, user.id);
    revalidatePath("/admin/clientes");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Possíveis duplicados — SÓ sob demanda (botão), sobre colunas normalizadas indexadas. */
export async function findDuplicatesAction(
  customerId: string,
): Promise<AdminActionResult & { duplicates?: Awaited<ReturnType<typeof findPossibleDuplicates>> }> {
  try {
    await requireStaff();
    if (!customerId) return { ok: false, error: "Cliente inválido." };
    const duplicates = await findPossibleDuplicates(customerId);
    return { ok: true, duplicates };
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

// ===========================================================================
// Catálogo de veículos + fitment (Onda 2)
// ===========================================================================

export async function createVehicleMakeAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = vehicleMakeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await createVehicleMake(parsed.data, user.id);
    revalidateStore();
    revalidatePath("/admin/veiculos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createVehicleModelAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = vehicleModelSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await createVehicleModel(parsed.data, user.id);
    revalidateStore();
    revalidatePath("/admin/veiculos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createVehicleVersionAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = vehicleVersionSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await createVehicleVersion(parsed.data, user.id);
    revalidateStore();
    revalidatePath("/admin/veiculos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deactivateVehicleVersionAction(id: string): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    if (!id) return { ok: false, error: "Versão inválida." };
    await deactivateVehicleVersion(id, user.id);
    revalidateStore();
    revalidatePath("/admin/veiculos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Opções em cascata (Marca→Modelo→Versão) para comboboxes do painel. */
export async function getVehicleOptionsAction(
  level: "makes" | "models" | "versions",
  parentId?: string,
): Promise<AdminActionResult & { options?: { id: string; label: string }[] }> {
  try {
    await requireStaff();
    if (level !== "makes" && !parentId) return { ok: false, error: "Seleção incompleta." };
    const options =
      level === "makes"
        ? await getVehicleOptions("makes")
        : level === "models"
          ? await getVehicleOptions("models", parentId!)
          : await getVehicleOptions("versions", parentId!);
    return { ok: true, options };
  } catch (e) {
    return fail(e);
  }
}

export async function addProductApplicationAction(input: unknown): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    const parsed = productApplicationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await addProductApplication(parsed.data, user.id);
    revalidateStore();
    revalidatePath(`/admin/produtos/${parsed.data.productId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeProductApplicationAction(applicationId: string): Promise<AdminActionResult> {
  try {
    const user = await requireStaff();
    if (!applicationId) return { ok: false, error: "Aplicação inválida." };
    await removeProductApplication(applicationId, user.id);
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function copyProductApplicationsAction(
  fromProductId: string,
  toProductId: string,
): Promise<AdminActionResult & { copied?: number }> {
  try {
    const user = await requireStaff();
    if (!fromProductId || !toProductId) return { ok: false, error: "Selecione o produto de origem." };
    if (fromProductId === toProductId) return { ok: false, error: "Origem e destino são o mesmo produto." };
    const r = await copyProductApplications(fromProductId, toProductId, user.id);
    revalidateStore();
    revalidatePath(`/admin/produtos/${toProductId}`);
    return { ok: true, copied: r.copied };
  } catch (e) {
    return fail(e);
  }
}

export async function addAllModelVersionsAction(
  productId: string,
  modelId: string,
): Promise<AdminActionResult & { added?: number }> {
  try {
    const user = await requireStaff();
    if (!productId || !modelId) return { ok: false, error: "Selecione o modelo." };
    const r = await addAllModelVersions(productId, modelId, user.id);
    revalidateStore();
    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true, added: r.added };
  } catch (e) {
    return fail(e);
  }
}
