import { prisma } from "@/lib/prisma";
import type { CheckoutInput, ManualSaleInput, OrderStatus, SaleChannel } from "@/lib/validations";

/**
 * Serviço de vendas. Invariantes:
 *  - venda exige estoque suficiente (validado na transação);
 *  - toda venda congela o custo (unit_cost_at_sale) e registra saída SALE;
 *  - cancelamento reverte estoque via movimento CUSTOMER_RETURN (append-only);
 *  - preços SEMPRE recalculados no servidor (nunca confiar no client).
 */

export const FREE_SHIPPING_THRESHOLD = 599;
export const FLAT_SHIPPING = 34.9;

function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

/** Finaliza a compra da loja. Retorna o número do pedido criado. */
export async function placeOrder(input: CheckoutInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Produtos reais do banco (preço/estoque do servidor).
    const ids = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: ids }, deletedAt: null, status: { not: "INACTIVE" } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error("Um dos produtos do carrinho não está mais disponível.");
      if (item.quantity > product.stockQuantity) {
        throw new Error(`Estoque insuficiente para "${product.name}" (disponível: ${product.stockQuantity} un).`);
      }
      const unitPrice = Number(product.promoPrice ?? product.salePrice);
      return { product, quantity: item.quantity, unitPrice, total: unitPrice * item.quantity };
    });

    const subtotal = lines.reduce((s, l) => s + l.total, 0);

    // 2. Cupom (opcional).
    let discount = 0;
    let coupon: { id: string; code: string } | null = null;
    const code = input.couponCode?.trim().toUpperCase();
    if (code) {
      const now = new Date();
      const found = await tx.coupon.findUnique({ where: { code } });
      const valid =
        found &&
        found.isActive &&
        (!found.startsAt || found.startsAt <= now) &&
        (!found.endsAt || found.endsAt >= now) &&
        (found.usageLimit === null || found.usageCount < found.usageLimit);
      if (!valid) throw new Error("Cupom inválido ou expirado.");
      if (found.minOrderValue && subtotal < Number(found.minOrderValue)) {
        throw new Error(`Cupom válido para pedidos a partir de R$ ${Number(found.minOrderValue).toFixed(2)}.`);
      }
      discount =
        found.type === "PERCENT"
          ? Math.round(subtotal * Number(found.value)) / 100
          : Math.min(Number(found.value), subtotal);
      coupon = { id: found.id, code: found.code };
    }

    const shippingCost = shippingFor(subtotal);
    const total = Math.max(0, subtotal - discount) + shippingCost;

    // 3. Cliente (upsert por e-mail).
    const email = input.customer.email.toLowerCase().trim();
    let customer = await tx.customer.findFirst({ where: { email, deletedAt: null } });
    if (!customer) {
      customer = await tx.customer.create({
        data: {
          name: input.customer.name.trim(),
          email,
          phone: input.customer.phone,
          document: input.customer.document || null,
        },
      });
    }

    // 4. Pedido (demo: Pix/cartão aprovam na hora; boleto fica aguardando).
    const isPaid = input.paymentMethod !== "BOLETO";
    const orderStatus: OrderStatus = isPaid ? "PAID" : "AWAITING_PAYMENT";
    const count = await tx.order.count();
    const number = `PED-${String(count + 1).padStart(4, "0")}`;
    const now = new Date();

    const order = await tx.order.create({
      data: {
        number,
        customerId: customer.id,
        customerName: customer.name,
        customerDocument: customer.document,
        customerEmail: email,
        customerPhone: input.customer.phone,
        status: orderStatus,
        channel: "SITE",
        subtotal,
        discount,
        shippingCost,
        total,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
        paymentMethod: input.paymentMethod,
        shipZipCode: input.shipping.zipCode,
        shipStreet: input.shipping.street,
        shipNumber: input.shipping.number,
        shipComplement: input.shipping.complement || null,
        shipDistrict: input.shipping.district || null,
        shipCity: input.shipping.city,
        shipState: input.shipping.state.toUpperCase(),
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            productName: l.product.name,
            sku: l.product.sku,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            unitCostAtSale: l.product.costPrice, // CUSTO CONGELADO
            total: l.total,
          })),
        },
        statusHistory: {
          create: [{ status: orderStatus, note: "Pedido realizado pela loja" }],
        },
      },
    });

    // 5. Baixa de estoque (movimento SALE por item, saldo antes/depois).
    for (const l of lines) {
      const before = l.product.stockQuantity;
      const after = before - l.quantity;
      await tx.inventoryMovement.create({
        data: {
          productId: l.product.id,
          type: "SALE",
          direction: "OUT",
          quantity: l.quantity,
          unitCost: l.product.costPrice,
          balanceBefore: before,
          balanceAfter: after,
          reason: `Venda ${number}`,
          orderId: order.id,
        },
      });
      await tx.product.update({
        where: { id: l.product.id },
        data: {
          stockQuantity: after,
          status:
            after <= 0 ? "OUT_OF_STOCK" : l.product.promoPrice !== null ? "PROMOTION" : "ACTIVE",
        },
      });
    }

    // 6. Financeiro: pagamento, recebível e fluxo de caixa.
    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: total,
        method: input.paymentMethod,
        status: isPaid ? "PAID" : "PENDING",
        paidAt: isPaid ? now : null,
        dueDate: isPaid ? null : new Date(now.getTime() + 3 * 86_400_000),
      },
    });
    await tx.accountReceivable.create({
      data: {
        customerId: customer.id,
        orderId: order.id,
        description: `Recebimento ${number}`,
        amount: total,
        receivedAmount: isPaid ? total : 0,
        dueDate: isPaid ? now : new Date(now.getTime() + 3 * 86_400_000),
        receivedAt: isPaid ? now : null,
        status: isPaid ? "PAID" : "OPEN",
        paymentMethod: input.paymentMethod,
      },
    });
    if (isPaid) {
      await tx.cashFlowEntry.create({
        data: {
          type: "INFLOW",
          category: "Vendas",
          description: `Recebimento ${number}`,
          amount: total,
          orderId: order.id,
        },
      });
    }

    // 7. Cupom: consumo + resgate.
    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
      await tx.couponRedemption.create({
        data: { couponId: coupon.id, orderId: order.id, customerId: customer.id },
      });
    }

    // 8. Cliente: total comprado / última compra.
    await tx.customer.update({
      where: { id: customer.id },
      data: { totalSpent: { increment: total }, lastPurchaseAt: now },
    });

    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Order",
        entityId: order.id,
        description: `Pedido ${number} criado pela loja (${lines.length} itens, total R$ ${total.toFixed(2)})`,
      },
    });

    return { orderNumber: number, total, status: orderStatus };
  });
}

/**
 * Venda manual (Instagram, WhatsApp, loja física): cria pedido com canal,
 * congela o custo, baixa o estoque via SALE e lança o financeiro — a mesma
 * regra da loja, registrada pelo operador do painel.
 */
export async function registerManualSale(input: ManualSaleInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product || product.deletedAt) throw new Error("Produto não encontrado.");
    if (input.quantity > product.stockQuantity) {
      throw new Error(`Estoque insuficiente: saldo atual é ${product.stockQuantity} un.`);
    }

    const total = input.unitPrice * input.quantity;
    const now = new Date();

    // Cliente: preferir o selecionado pela lupa; senão, cadastro rápido pelo nome.
    let customer =
      input.customerId && input.customerId !== ""
        ? await tx.customer.findFirst({ where: { id: input.customerId, deletedAt: null } })
        : null;
    if (input.customerId && !customer) {
      throw new Error("Cliente selecionado não encontrado — atualize a página.");
    }
    if (!customer) {
      const customerName = input.customerName?.trim() || "Cliente balcão";
      customer = await tx.customer.findFirst({ where: { name: customerName, deletedAt: null } });
      if (!customer) {
        customer = await tx.customer.create({ data: { name: customerName } });
      }
    }

    const count = await tx.order.count();
    const number = `PED-${String(count + 1).padStart(4, "0")}`;

    const order = await tx.order.create({
      data: {
        number,
        customerId: customer.id,
        customerName: customer.name,
        status: "PAID",
        channel: input.channel,
        subtotal: total,
        total,
        paymentMethod: input.paymentMethod,
        userId,
        notes: `Venda manual registrada pelo painel (${input.channel})`,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity: input.quantity,
              unitPrice: input.unitPrice,
              unitCostAtSale: product.costPrice, // CUSTO CONGELADO
              total,
            },
          ],
        },
        statusHistory: { create: [{ status: "PAID", note: "Venda manual (painel)", userId }] },
      },
    });

    // Baixa no ledger.
    const before = product.stockQuantity;
    const after = before - input.quantity;
    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "SALE",
        direction: "OUT",
        quantity: input.quantity,
        unitCost: product.costPrice,
        balanceBefore: before,
        balanceAfter: after,
        reason: `Venda ${number} (${input.channel})`,
        orderId: order.id,
        userId,
      },
    });
    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: after,
        status: after <= 0 ? "OUT_OF_STOCK" : product.promoPrice !== null ? "PROMOTION" : "ACTIVE",
      },
    });

    // Financeiro: pagamento, recebível quitado e entrada no caixa.
    await tx.payment.create({
      data: { orderId: order.id, amount: total, method: input.paymentMethod, status: "PAID", paidAt: now },
    });
    await tx.accountReceivable.create({
      data: {
        customerId: customer.id,
        orderId: order.id,
        description: `Recebimento ${number} (venda manual)`,
        amount: total,
        receivedAmount: total,
        dueDate: now,
        receivedAt: now,
        status: "PAID",
        paymentMethod: input.paymentMethod,
      },
    });
    await tx.cashFlowEntry.create({
      data: {
        type: "INFLOW",
        category: "Vendas",
        description: `Recebimento ${number} (${input.channel})`,
        amount: total,
        orderId: order.id,
        userId,
      },
    });
    await tx.customer.update({
      where: { id: customer.id },
      data: { totalSpent: { increment: total }, lastPurchaseAt: now },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "Order",
        entityId: order.id,
        description: `Venda manual ${number} via ${input.channel} (${input.quantity}x ${product.sku}, R$ ${total.toFixed(2)})`,
      },
    });

    return { orderNumber: number, total };
  });
}

export async function listOrders() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    customerName: o.customerName,
    status: o.status as OrderStatus,
    channel: o.channel as SaleChannel,
    paymentMethod: o.paymentMethod,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
  }));
}

export type OrderRow = Awaited<ReturnType<typeof listOrders>>[number];

export async function getOrder(id: string) {
  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!o) return null;
  return {
    id: o.id,
    number: o.number,
    status: o.status as OrderStatus,
    channel: o.channel as SaleChannel,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    customerDocument: o.customerDocument,
    paymentMethod: o.paymentMethod,
    couponCode: o.couponCode,
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shippingCost: Number(o.shippingCost),
    total: Number(o.total),
    shipping: {
      zipCode: o.shipZipCode,
      street: o.shipStreet,
      number: o.shipNumber,
      complement: o.shipComplement,
      district: o.shipDistrict,
      city: o.shipCity,
      state: o.shipState,
    },
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      unitCostAtSale: Number(i.unitCostAtSale),
      total: Number(i.total),
    })),
    history: o.statusHistory.map((h) => ({
      status: h.status as OrderStatus,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
    createdAt: o.createdAt.toISOString(),
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

/** Transições permitidas (sem ressuscitar pedidos cancelados/devolvidos). */
const ALLOWED_NEXT: Record<string, OrderStatus[]> = {
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["SEPARATING", "SHIPPED", "CANCELLED"],
  SEPARATING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

/** Atualiza status; cancelamento/devolução devolve itens ao estoque. */
export async function updateOrderStatus(id: string, next: OrderStatus, userId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new Error("Pedido não encontrado.");

    const allowed = ALLOWED_NEXT[order.status] ?? [];
    if (!allowed.includes(next)) {
      throw new Error(`Transição inválida: ${order.status} → ${next}.`);
    }

    const restock = next === "CANCELLED" || next === "RETURNED";
    if (restock) {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const before = product.stockQuantity;
        const after = before + item.quantity;
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: "CUSTOMER_RETURN",
            direction: "IN",
            quantity: item.quantity,
            unitCost: item.unitCostAtSale,
            balanceBefore: before,
            balanceAfter: after,
            reason: `${next === "CANCELLED" ? "Cancelamento" : "Devolução"} do pedido ${order.number}`,
            orderId: order.id,
            userId,
          },
        });
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: after,
            status: product.status === "INACTIVE" ? "INACTIVE" : product.promoPrice !== null ? "PROMOTION" : "ACTIVE",
          },
        });
      }
      // Estorno financeiro do que já havia entrado no caixa.
      const paid = await tx.payment.findFirst({ where: { orderId: order.id, status: "PAID" } });
      if (paid) {
        await tx.payment.update({ where: { id: paid.id }, data: { status: "REFUNDED" } });
        await tx.cashFlowEntry.create({
          data: {
            type: "OUTFLOW",
            category: "Estornos",
            description: `Estorno ${order.number}`,
            amount: order.total,
            orderId: order.id,
            userId,
          },
        });
      }
      await tx.accountReceivable.updateMany({
        where: { orderId: order.id },
        data: { status: "CANCELLED" },
      });
    }

    if (order.status === "AWAITING_PAYMENT" && next === "PAID") {
      const now = new Date();
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "PAID", paidAt: now },
      });
      await tx.accountReceivable.updateMany({
        where: { orderId: order.id, status: "OPEN" },
        data: { status: "PAID", receivedAmount: order.total, receivedAt: now },
      });
      await tx.cashFlowEntry.create({
        data: {
          type: "INFLOW",
          category: "Vendas",
          description: `Recebimento ${order.number}`,
          amount: order.total,
          orderId: order.id,
          userId,
        },
      });
    }

    await tx.order.update({ where: { id }, data: { status: next } });
    await tx.orderStatusHistory.create({
      data: { orderId: id, status: next, note: note ?? null, userId },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: id,
        description: `Pedido ${order.number}: ${order.status} → ${next}`,
      },
    });
  });
}
