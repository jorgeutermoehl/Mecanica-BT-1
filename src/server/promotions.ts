import { prisma } from "@/lib/prisma";
import type { CouponInput, PromoPriceInput } from "@/lib/validations";
import { logAudit } from "@/server/audit";

/**
 * Promoções e cupons do painel.
 * - Promoção de produto = promoPrice no próprio produto (é o que a vitrine usa).
 * - Cupons são validados no checkout (placeOrder) — mesmas regras daqui.
 */

// ===========================================================================
// Cupons
// ===========================================================================

export async function listCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type as "PERCENT" | "FIXED",
    value: Number(c.value),
    minOrderValue: c.minOrderValue !== null ? Number(c.minOrderValue) : null,
    usageLimit: c.usageLimit,
    usageCount: c.usageCount,
    redemptions: c._count.redemptions,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));
}

export type CouponRow = Awaited<ReturnType<typeof listCoupons>>[number];

export async function createCoupon(input: CouponInput, userId: string) {
  const code = input.code.toUpperCase().trim();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw new Error("Já existe um cupom com esse código.");

  return prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.create({
      data: {
        code,
        type: input.type,
        value: input.value,
        minOrderValue: input.minOrderValue ?? null,
        usageLimit: input.usageLimit ?? null,
        isActive: true,
      },
    });
    await logAudit(tx, {
      userId,
      action: "COUPON_CREATE",
      entity: "Coupon",
      entityId: coupon.id,
      description: `Cupom ${code} criado (${input.type === "PERCENT" ? `${input.value}%` : `R$ ${input.value}`})`,
    });
    return { id: coupon.id };
  });
}

export async function setCouponActive(id: string, active: boolean, userId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new Error("Cupom não encontrado.");
  await prisma.$transaction(async (tx) => {
    await tx.coupon.update({ where: { id }, data: { isActive: active } });
    await logAudit(tx, {
      userId,
      action: active ? "COUPON_UPDATE" : "COUPON_DEACTIVATE",
      entity: "Coupon",
      entityId: id,
      description: `Cupom ${coupon.code} ${active ? "ativado" : "desativado"}`,
      before: { isActive: coupon.isActive },
      after: { isActive: active },
    });
  });
}

// ===========================================================================
// Promoções de produto (promoPrice)
// ===========================================================================

export async function listPromotionProducts() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: { not: "INACTIVE" } },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category.name,
    salePrice: Number(p.salePrice),
    promoPrice: p.promoPrice !== null ? Number(p.promoPrice) : null,
    stock: p.stockQuantity,
  }));
}

export type PromotionProductRow = Awaited<ReturnType<typeof listPromotionProducts>>[number];

export async function setPromoPrice(input: PromoPriceInput, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || product.deletedAt) throw new Error("Produto não encontrado.");
  if (input.promoPrice >= Number(product.salePrice)) {
    throw new Error("Preço promocional deve ser menor que o preço de venda.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        promoPrice: input.promoPrice,
        status: product.stockQuantity > 0 ? "PROMOTION" : "OUT_OF_STOCK",
      },
    });
    await logAudit(tx, {
      userId,
      action: "PRICE_CHANGE",
      entity: "Product",
      entityId: product.id,
      description: `Promoção aplicada em ${product.sku}: R$ ${input.promoPrice.toFixed(2)}`,
      before: { promoPrice: product.promoPrice !== null ? Number(product.promoPrice) : null },
      after: { promoPrice: input.promoPrice },
    });
  });
}

export async function clearPromoPrice(productId: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.deletedAt) throw new Error("Produto não encontrado.");
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        promoPrice: null,
        status: product.status === "INACTIVE" ? "INACTIVE" : product.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      },
    });
    await logAudit(tx, {
      userId,
      action: "PRICE_CHANGE",
      entity: "Product",
      entityId: productId,
      description: `Promoção removida de ${product.sku}`,
      before: { promoPrice: product.promoPrice !== null ? Number(product.promoPrice) : null },
      after: { promoPrice: null },
    });
  });
}
