import { prisma } from "@/lib/prisma";
import type { StockAdjustInput, StockEntryInput, StockOutInput } from "@/lib/validations";

/**
 * Serviço de estoque. Invariantes:
 *  - inventory_movements é APPEND-ONLY (correção = novo lançamento de ajuste);
 *  - todo movimento registra saldo anterior/posterior e usuário responsável;
 *  - entrada recalcula custo médio ponderado do produto.
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Status derivado do saldo (não sobrescreve INACTIVE). */
function statusForStock(currentStatus: string, stock: number, hasPromo: boolean): string {
  if (currentStatus === "INACTIVE") return "INACTIVE";
  if (stock <= 0) return "OUT_OF_STOCK";
  return hasPromo ? "PROMOTION" : "ACTIVE";
}

/** Entrada de mercadoria: StockEntry + movimento ENTRY + custo médio. */
export async function registerEntry(input: StockEntryInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product || product.deletedAt) throw new Error("Produto não encontrado.");

    let supplierId: string | null = null;
    const supplierName = input.supplierName?.trim();
    if (supplierName) {
      const existing = await tx.supplier.findFirst({
        where: { deletedAt: null, OR: [{ legalName: supplierName }, { tradeName: supplierName }] },
      });
      supplierId = existing
        ? existing.id
        : (await tx.supplier.create({ data: { legalName: supplierName, tradeName: supplierName } })).id;
    }

    const totalCost = input.quantity * input.unitCost;
    const entry = await tx.stockEntry.create({
      data: {
        supplierId,
        invoiceNumber: input.invoiceNumber || null,
        itemsTotal: totalCost,
        total: totalCost,
        paymentMethod: input.registerExpense ? input.paymentMethod : null,
        financialStatus: input.registerExpense ? (input.paid ? "PAID" : "OPEN") : "OPEN",
        notes: input.notes || null,
        userId,
        items: {
          create: [
            {
              productId: product.id,
              quantity: input.quantity,
              unitCost: input.unitCost,
              totalCost,
            },
          ],
        },
      },
    });

    // Financeiro da compra: despesa lançada junto com a movimentação.
    if (input.registerExpense && totalCost > 0) {
      const now = new Date();
      await tx.accountPayable.create({
        data: {
          supplierId,
          stockEntryId: entry.id,
          description: `Compra de estoque — ${input.quantity}x ${product.sku}${input.invoiceNumber ? ` (NF ${input.invoiceNumber})` : ""}`,
          category: "Compras de estoque",
          amount: totalCost,
          paidAmount: input.paid ? totalCost : 0,
          dueDate: input.paid ? now : new Date(now.getTime() + 28 * 86_400_000),
          paidAt: input.paid ? now : null,
          status: input.paid ? "PAID" : "OPEN",
          paymentMethod: input.paymentMethod,
        },
      });
      if (input.paid) {
        await tx.cashFlowEntry.create({
          data: {
            type: "OUTFLOW",
            category: "Compras de estoque",
            description: `Compra ${input.quantity}x ${product.sku}${input.invoiceNumber ? ` (NF ${input.invoiceNumber})` : ""}`,
            amount: totalCost,
            userId,
          },
        });
      }
    }

    const before = product.stockQuantity;
    const after = before + input.quantity;

    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "ENTRY",
        direction: "IN",
        quantity: input.quantity,
        unitCost: input.unitCost,
        balanceBefore: before,
        balanceAfter: after,
        reason: input.invoiceNumber ? `Entrada por compra (NF ${input.invoiceNumber})` : "Entrada de mercadoria",
        userId,
        stockEntryId: entry.id,
      },
    });

    // Custo médio ponderado.
    const oldCost = Number(product.costPrice);
    const newAvg = after > 0 ? (before * oldCost + input.quantity * input.unitCost) / after : input.unitCost;

    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: after,
        costPrice: Math.round(newAvg * 100) / 100,
        status: statusForStock(product.status, after, product.promoPrice !== null),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_ENTRY",
        entity: "StockEntry",
        entityId: entry.id,
        description: `Entrada de ${input.quantity}x ${product.sku} (saldo ${before} → ${after})`,
      },
    });

    return { entryId: entry.id, balanceAfter: after };
  });
}

/** Saída manual / perda / devolução a fornecedor. */
export async function registerOut(input: StockOutInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product || product.deletedAt) throw new Error("Produto não encontrado.");

    const before = product.stockQuantity;
    if (input.quantity > before) {
      throw new Error(`Estoque insuficiente: saldo atual é ${before} un.`);
    }
    const after = before - input.quantity;

    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: input.type,
        direction: "OUT",
        quantity: input.quantity,
        unitCost: product.costPrice,
        balanceBefore: before,
        balanceAfter: after,
        reason: input.reason,
        userId,
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: after,
        status: statusForStock(product.status, after, product.promoPrice !== null),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_OUT",
        entity: "Product",
        entityId: product.id,
        description: `Saída (${input.type}) de ${input.quantity}x ${product.sku}: ${input.reason} (saldo ${before} → ${after})`,
      },
    });

    return { balanceAfter: after };
  });
}

/** Ajuste de inventário para uma quantidade absoluta. */
export async function adjustStock(input: StockAdjustInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product || product.deletedAt) throw new Error("Produto não encontrado.");

    const before = product.stockQuantity;
    const after = input.newQuantity;
    if (before === after) throw new Error("A quantidade informada é igual ao saldo atual.");

    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "ADJUSTMENT",
        direction: after > before ? "IN" : "OUT",
        quantity: Math.abs(after - before),
        unitCost: product.costPrice,
        balanceBefore: before,
        balanceAfter: after,
        reason: input.reason,
        userId,
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: after,
        status: statusForStock(product.status, after, product.promoPrice !== null),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_ADJUSTMENT",
        entity: "Product",
        entityId: product.id,
        description: `Ajuste de inventário ${product.sku}: ${before} → ${after} (${input.reason})`,
      },
    });

    return { balanceAfter: after };
  });
}

/** Histórico de movimentações (mais recentes primeiro). */
export async function listMovements(opts?: { productId?: string; take?: number }) {
  const movements = await prisma.inventoryMovement.findMany({
    where: opts?.productId ? { productId: opts.productId } : undefined,
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
      order: { select: { number: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 200,
  });
  return movements.map((m) => ({
    id: m.id,
    productName: m.product.name,
    sku: m.product.sku,
    type: m.type,
    direction: m.direction as "IN" | "OUT",
    quantity: m.quantity,
    unitCost: Number(m.unitCost),
    balanceBefore: m.balanceBefore,
    balanceAfter: m.balanceAfter,
    reason: m.reason,
    userName: m.user?.name ?? "Sistema",
    orderNumber: m.order?.number ?? null,
    createdAt: m.createdAt.toISOString(),
  }));
}

export type MovementRow = Awaited<ReturnType<typeof listMovements>>[number];

/** Produtos para selects do painel de estoque. */
export async function listProductOptions() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, stockQuantity: true, costPrice: true },
  });
  return products.map((p) => ({
    id: p.id,
    label: `${p.name} (${p.sku})`,
    stock: p.stockQuantity,
    costPrice: Number(p.costPrice),
  }));
}
