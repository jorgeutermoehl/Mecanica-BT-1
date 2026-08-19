import { prisma } from "@/lib/prisma";
import type { StockAdjustInput, StockEntryInput, StockOutInput } from "@/lib/validations";
import { logAudit } from "@/server/audit";

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

    await logAudit(tx, {
      userId,
      action: "STOCK_ENTRY",
      entity: "StockEntry",
      entityId: entry.id,
      description: `Entrada de ${input.quantity}x ${product.sku} (saldo ${before} → ${after})`,
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

    await logAudit(tx, {
      userId,
      action: "STOCK_OUT",
      entity: "Product",
      entityId: product.id,
      description: `Saída (${input.type}) de ${input.quantity}x ${product.sku}: ${input.reason} (saldo ${before} → ${after})`,
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

    await logAudit(tx, {
      userId,
      action: "STOCK_ADJUSTMENT",
      entity: "Product",
      entityId: product.id,
      description: `Ajuste de inventário ${product.sku}: ${before} → ${after} (${input.reason})`,
      before: { stockQuantity: before },
      after: { stockQuantity: after },
    });

    return { balanceAfter: after };
  });
}

/** Histórico de movimentações (mais recentes primeiro). */
export async function listMovements(opts?: { productId?: string; take?: number }) {
  const movements = await prisma.inventoryMovement.findMany({
    where: opts?.productId ? { productId: opts.productId } : undefined,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { name: true } },
      order: { select: { number: true } },
      stockEntry: { select: { invoiceNumber: true } },
      reversedBy: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 200,
  });
  return movements.map((m) => ({
    id: m.id,
    productId: m.product.id,
    productName: m.product.name,
    sku: m.product.sku,
    type: m.type,
    direction: m.direction as "IN" | "OUT",
    quantity: m.quantity,
    unitCost: Number(m.unitCost),
    balanceBefore: m.balanceBefore,
    balanceAfter: m.balanceAfter,
    reason: m.reason,
    invoiceNumber: m.stockEntry?.invoiceNumber ?? null,
    userName: m.user?.name ?? "Sistema",
    orderNumber: m.order?.number ?? null,
    createdAt: m.createdAt.toISOString(),
    /** Este lançamento é um estorno de outro. */
    isReversal: m.reversalOfId !== null,
    /** Este lançamento já foi estornado. */
    isReversed: m.reversedBy !== null,
    /** Pode ser estornado/corrigido (não é de pedido, não é estorno, não foi estornado). */
    canModify:
      m.orderId === null && m.reversalOfId === null && m.reversedBy === null && m.type !== "CUSTOMER_RETURN",
  }));
}

export type MovementRow = Awaited<ReturnType<typeof listMovements>>[number];

// ===========================================================================
// Estorno e correção (append-only: nada é apagado — cria-se o reverso)
// ===========================================================================

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Aplica o estorno de um movimento dentro da transação: valida, cria o
 * lançamento reverso, ajusta saldo do produto e reverte o financeiro de
 * compras vinculado. Retorna o produto já com o saldo pós-estorno.
 */
async function applyReversal(tx: Tx, movementId: string, userId: string) {
  const movement = await tx.inventoryMovement.findUnique({
    where: { id: movementId },
    include: { product: true, reversedBy: { select: { id: true } }, stockEntry: true },
  });
  if (!movement) throw new Error("Movimentação não encontrada.");
  if (movement.orderId) throw new Error("Movimentação vinculada a pedido — cancele o pedido para repor o estoque.");
  if (movement.reversalOfId) throw new Error("Este lançamento já é um estorno.");
  if (movement.reversedBy) throw new Error("Esta movimentação já foi estornada.");

  const product = movement.product;
  const before = product.stockQuantity;
  const delta = movement.direction === "IN" ? -movement.quantity : movement.quantity;
  const after = before + delta;
  if (after < 0) {
    throw new Error(
      `Estorno deixaria o estoque negativo (saldo atual ${before}, estorno de ${movement.quantity} un). ` +
        "Provavelmente parte dessas peças já foi vendida.",
    );
  }

  await tx.inventoryMovement.create({
    data: {
      productId: product.id,
      type: movement.type,
      direction: movement.direction === "IN" ? "OUT" : "IN",
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      balanceBefore: before,
      balanceAfter: after,
      reason: `Estorno${movement.reason ? ` — ${movement.reason}` : ""}`,
      userId,
      reversalOfId: movement.id,
    },
  });

  const updated = await tx.product.update({
    where: { id: product.id },
    data: {
      stockQuantity: after,
      status: statusForStock(product.status, after, product.promoPrice !== null),
    },
  });

  // Financeiro: se a entrada gerou conta a pagar/caixa, reverte.
  if (movement.stockEntryId) {
    const payable = await tx.accountPayable.findFirst({
      where: { stockEntryId: movement.stockEntryId, status: { not: "CANCELLED" } },
    });
    if (payable) {
      await tx.accountPayable.update({ where: { id: payable.id }, data: { status: "CANCELLED" } });
      if (payable.status === "PAID") {
        await tx.cashFlowEntry.create({
          data: {
            type: "INFLOW",
            category: "Estornos",
            description: `Estorno de compra — ${payable.description}`,
            amount: payable.amount,
            userId,
          },
        });
      }
    }
    await tx.stockEntry.update({
      where: { id: movement.stockEntryId },
      data: { financialStatus: "CANCELLED", notes: "Estornada pelo painel" },
    });
  }

  await logAudit(tx, {
    userId,
    action: "STOCK_REVERSAL",
    entity: "InventoryMovement",
    entityId: movement.id,
    description: `Estorno de ${MOVEMENT_LABEL[movement.type] ?? movement.type} de ${movement.quantity}x ${product.sku} (saldo ${before} → ${after})`,
  });

  return { movement, product: updated };
}

const MOVEMENT_LABEL: Record<string, string> = {
  ENTRY: "entrada",
  MANUAL_OUT: "saída manual",
  ADJUSTMENT: "ajuste",
  SUPPLIER_RETURN: "devolução a fornecedor",
  LOSS: "perda/avaria",
  INVENTORY: "inventário",
};

/** "Excluir" da interface: estorna o movimento (lançamento reverso). */
export async function reverseMovement(movementId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const { product } = await applyReversal(tx, movementId, userId);
    return { balanceAfter: product.stockQuantity };
  });
}

/**
 * "Editar" da interface: estorna o movimento original e relança com os novos
 * valores, na MESMA transação. Suportado para ENTRY e saídas manuais.
 */
export async function correctMovement(
  movementId: string,
  data: { quantity: number; unitCost?: number; reason?: string },
  userId: string,
) {
  if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
    throw new Error("Quantidade deve ser um número inteiro maior que zero.");
  }
  return prisma.$transaction(async (tx) => {
    const { movement } = await applyReversal(tx, movementId, userId);

    const product = await tx.product.findUniqueOrThrow({ where: { id: movement.productId } });
    const before = product.stockQuantity;
    const isIn = movement.direction === "IN";
    const unitCost = data.unitCost ?? Number(movement.unitCost);

    if (!isIn && data.quantity > before) {
      throw new Error(`Estoque insuficiente para a correção: saldo atual é ${before} un.`);
    }
    const after = isIn ? before + data.quantity : before - data.quantity;

    // Relança a entrada com espelho financeiro equivalente ao original.
    let stockEntryId: string | null = null;
    if (movement.type === "ENTRY") {
      const totalCost = data.quantity * unitCost;
      const originalEntry = movement.stockEntryId
        ? await tx.stockEntry.findUnique({
            where: { id: movement.stockEntryId },
            include: { payables: { where: { status: "CANCELLED" }, take: 1 } },
          })
        : null;
      const entry = await tx.stockEntry.create({
        data: {
          supplierId: originalEntry?.supplierId ?? null,
          invoiceNumber: originalEntry?.invoiceNumber ?? null,
          itemsTotal: totalCost,
          total: totalCost,
          paymentMethod: originalEntry?.paymentMethod ?? null,
          financialStatus: originalEntry ? (originalEntry.payables[0]?.paidAt ? "PAID" : "OPEN") : "OPEN",
          notes: `Correção do lançamento ${movementId}`,
          userId,
          items: {
            create: [{ productId: product.id, quantity: data.quantity, unitCost, totalCost }],
          },
        },
      });
      stockEntryId = entry.id;

      const originalPayable = originalEntry?.payables[0];
      if (originalPayable) {
        const wasPaid = originalPayable.paidAt !== null;
        const now = new Date();
        await tx.accountPayable.create({
          data: {
            supplierId: originalEntry?.supplierId ?? null,
            stockEntryId: entry.id,
            description: `Compra de estoque (corrigida) — ${data.quantity}x ${product.sku}`,
            category: "Compras de estoque",
            amount: totalCost,
            paidAmount: wasPaid ? totalCost : 0,
            dueDate: wasPaid ? now : new Date(now.getTime() + 28 * 86_400_000),
            paidAt: wasPaid ? now : null,
            status: wasPaid ? "PAID" : "OPEN",
            paymentMethod: originalPayable.paymentMethod,
          },
        });
        if (wasPaid) {
          await tx.cashFlowEntry.create({
            data: {
              type: "OUTFLOW",
              category: "Compras de estoque",
              description: `Compra (corrigida) ${data.quantity}x ${product.sku}`,
              amount: totalCost,
              userId,
            },
          });
        }
      }
    }

    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: movement.type,
        direction: movement.direction,
        quantity: data.quantity,
        unitCost,
        balanceBefore: before,
        balanceAfter: after,
        reason: data.reason?.trim() || `Correção${movement.reason ? ` — ${movement.reason}` : ""}`,
        userId,
        stockEntryId,
      },
    });

    // Recalcula custo médio para entradas corrigidas.
    const costUpdate =
      movement.type === "ENTRY" && after > 0
        ? { costPrice: Math.round(((before * Number(product.costPrice) + data.quantity * unitCost) / after) * 100) / 100 }
        : {};

    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: after,
        status: statusForStock(product.status, after, product.promoPrice !== null),
        ...costUpdate,
      },
    });

    await logAudit(tx, {
      userId,
      action: "STOCK_CORRECTION",
      entity: "InventoryMovement",
      entityId: movementId,
      description: `Correção de ${MOVEMENT_LABEL[movement.type] ?? movement.type} de ${product.sku}: agora ${data.quantity} un (saldo ${before} → ${after})`,
    });

    return { balanceAfter: after };
  });
}

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

// ===========================================================================
// Disponibilidade com reservas (ESPEC-V2, Onda 3 item 5)
// ===========================================================================

/**
 * Disponível = físico − reservas ATIVAS não expiradas. Função ÚNICA de
 * disponibilidade: groupBy sobre os IDs pedidos (nunca N+1) e SEM escrever
 * nada — reserva vencida é ignorada logicamente; quem marca EXPIRED é o cron.
 */
export async function getAvailable(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const [products, reserved] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stockQuantity: true },
    }),
    prisma.stockReservation.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, status: "ACTIVE", expiresAt: { gt: new Date() } },
      _sum: { quantity: true },
    }),
  ]);
  const reservedBy = new Map(reserved.map((r) => [r.productId, r._sum.quantity ?? 0]));
  return new Map(products.map((p) => [p.id, p.stockQuantity - (reservedBy.get(p.id) ?? 0)]));
}
