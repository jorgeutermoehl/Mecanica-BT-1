import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { CheckoutInput, ManualSaleInput, OrderStatus, SaleChannel } from "@/lib/validations";
import { logAudit } from "@/server/audit";
import { recalcCustomerStats, resolveCustomer, upsertCustomerAddress } from "@/server/customers";
import { dateKey, recomputeSalesDaily } from "@/server/reports/aggregation";

/** Janela da reserva de estoque para pedidos aguardando pagamento (boleto demo). */
const RESERVATION_HOURS = 72;

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
  // Idempotência (double-click/retry de rede): mesma chave → mesmo pedido.
  const externalReference = input.externalReference?.trim() || randomUUID();
  const existing = await prisma.order.findUnique({ where: { externalReference } });
  if (existing) {
    return { orderNumber: existing.number, total: Number(existing.total), status: existing.status as OrderStatus };
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Produtos reais do banco (preço/estoque do servidor).
    const ids = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: ids }, deletedAt: null, status: { not: "INACTIVE" } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Disponível = físico − reservas ATIVAS não expiradas (dentro da transação).
    const reserved = await tx.stockReservation.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, status: "ACTIVE", expiresAt: { gt: new Date() } },
      _sum: { quantity: true },
    });
    const reservedBy = new Map(reserved.map((r) => [r.productId, r._sum.quantity ?? 0]));

    const lines = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error("Um dos produtos do carrinho não está mais disponível.");
      const available = product.stockQuantity - (reservedBy.get(product.id) ?? 0);
      if (item.quantity > available) {
        throw new Error(`Estoque insuficiente para "${product.name}" (disponível: ${Math.max(0, available)} un).`);
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

    // 3. Cliente: identity resolution por documento/e-mail/telefone normalizados.
    const email = input.customer.email.toLowerCase().trim();
    const resolved = await resolveCustomer(tx, {
      name: input.customer.name,
      document: input.customer.document || null,
      email,
      phone: input.customer.phone,
      acquisitionChannel: "SITE",
    });
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: resolved.id } });

    // 3b. Origem da visita (UTM/referrer) — SÓ com consentimento de marketing (LGPD).
    const sessionId = input.sessionId?.trim() || null;
    if (sessionId && !customer.firstUtmSource) {
      const consent = await tx.cookieConsent.findFirst({
        where: { sessionId, marketing: true },
        orderBy: { createdAt: "desc" },
      });
      if (consent) {
        const referrer = consent.userAgent?.match(/ref=([^|]+)/)?.[1]?.trim() ?? null;
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            firstUtmSource: consent.utmSource,
            firstUtmMedium: consent.utmMedium,
            firstUtmCampaign: consent.utmCampaign,
            referrer,
          },
        });
      }
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
        sessionId,
        vehicleLabel: input.myCarLabel?.trim() || null,
        externalReference,
        paymentProvider: "MANUAL",
        paidAt: isPaid ? now : null,
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

    // 5. Estoque: pagamento aprovado baixa direto (SALE); aguardando pagamento
    //    RESERVA (não é movimento — o ledger só recebe SALE quando aprovar).
    if (isPaid) {
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
    } else {
      const expiresAt = new Date(now.getTime() + RESERVATION_HOURS * 3_600_000);
      for (const l of lines) {
        await tx.stockReservation.create({
          data: {
            productId: l.product.id,
            orderId: order.id,
            quantity: l.quantity,
            status: "ACTIVE",
            expiresAt,
          },
        });
      }
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

    // 8. Endereço do checkout vira Address reutilizável (snapshot ship* preservado).
    await upsertCustomerAddress(tx, customer.id, input.shipping);

    // 8b. "Meu Carro" identificado no checkout entra na garagem do cliente.
    const myCarVersionId = input.myCarVersionId?.trim();
    if (myCarVersionId) {
      const version = await tx.vehicleVersion.findUnique({ where: { id: myCarVersionId } });
      if (version) {
        const inGarage = await tx.customerVehicle.findFirst({
          where: { customerId: customer.id, vehicleVersionId: myCarVersionId },
        });
        if (!inGarage) {
          const garageCount = await tx.customerVehicle.count({ where: { customerId: customer.id } });
          await tx.customerVehicle.create({
            data: {
              customerId: customer.id,
              vehicleVersionId: myCarVersionId,
              isDefault: garageCount === 0,
            },
          });
        }
      }
    }

    // 9. Métricas do cliente pelo escritor único (idempotente).
    await recalcCustomerStats(tx, customer.id);

    await logAudit(tx, {
      userId: null,
      action: "ORDER_CREATE",
      entity: "Order",
      entityId: order.id,
      description: `Pedido ${number} criado pela loja (${lines.length} itens, total R$ ${total.toFixed(2)})`,
    });

    return { orderNumber: number, total, status: orderStatus };
  });

  // Pós-commit (fora da transação crítica): snapshot diário idempotente.
  await recomputeSalesDaily(dateKey(new Date()));
  return result;
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

    // Cliente: preferir o selecionado pela lupa; senão, cadastro rápido
    // "cliente Instagram" (nome + @ + WhatsApp) com identity resolution.
    let customer =
      input.customerId && input.customerId !== ""
        ? await tx.customer.findFirst({ where: { id: input.customerId, deletedAt: null } })
        : null;
    if (input.customerId && !customer) {
      throw new Error("Cliente selecionado não encontrado — atualize a página.");
    }
    if (!customer) {
      const customerName = input.customerName?.trim() || "Cliente balcão";
      const resolved = await resolveCustomer(tx, {
        name: customerName,
        instagramHandle: input.customerInstagram || null,
        whatsapp: input.customerWhatsapp || null,
        phone: input.customerWhatsapp || null,
        acquisitionChannel: input.channel,
      });
      customer = await tx.customer.findUniqueOrThrow({ where: { id: resolved.id } });
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
    await recalcCustomerStats(tx, customer.id);
    await logAudit(tx, {
      userId,
      action: "ORDER_CREATE",
      entity: "Order",
      entityId: order.id,
      description: `Venda manual ${number} via ${input.channel} (${input.quantity}x ${product.sku}, R$ ${total.toFixed(2)})`,
    });

    return { orderNumber: number, total };
  }).then(async (r) => {
    // Pós-commit: snapshot diário idempotente.
    await recomputeSalesDaily(dateKey(new Date()));
    return r;
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
  let orderDay: string | null = null;
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new Error("Pedido não encontrado.");
    orderDay = dateKey(order.createdAt);

    const allowed = ALLOWED_NEXT[order.status] ?? [];
    if (!allowed.includes(next)) {
      throw new Error(`Transição inválida: ${order.status} → ${next}.`);
    }

    // Pedido aguardando pagamento nunca baixou estoque — tem RESERVAS, não SALE.
    const wasAwaiting = order.status === "AWAITING_PAYMENT";

    const restock = (next === "CANCELLED" || next === "RETURNED") && !wasAwaiting;
    if (next === "CANCELLED" && wasAwaiting) {
      // Libera as reservas (disponível volta sem tocar no ledger).
      await tx.stockReservation.updateMany({
        where: { orderId: order.id, status: "ACTIVE" },
        data: { status: "RELEASED" },
      });
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      await tx.accountReceivable.updateMany({
        where: { orderId: order.id },
        data: { status: "CANCELLED" },
      });
    }
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

      // Consome as reservas e SÓ ENTÃO gera os movimentos SALE (append-only).
      const reservations = await tx.stockReservation.findMany({
        where: { orderId: order.id, status: "ACTIVE" },
      });
      await tx.stockReservation.updateMany({
        where: { orderId: order.id, status: "ACTIVE" },
        data: { status: "CONSUMED" },
      });
      for (const item of order.items) {
        if (!item.productId) continue;
        const hasReservation = reservations.some((r) => r.productId === item.productId);
        if (!hasReservation) continue; // pedido antigo (fluxo sem reserva) já baixou
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const before = product.stockQuantity;
        if (item.quantity > before) {
          throw new Error(`Estoque físico insuficiente para ${product.sku} — confira o inventário.`);
        }
        const after = before - item.quantity;
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: "SALE",
            direction: "OUT",
            quantity: item.quantity,
            unitCost: item.unitCostAtSale,
            balanceBefore: before,
            balanceAfter: after,
            reason: `Venda ${order.number} (pagamento confirmado)`,
            orderId: order.id,
            userId,
          },
        });
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: after,
            status:
              product.status === "INACTIVE"
                ? "INACTIVE"
                : after <= 0
                  ? "OUT_OF_STOCK"
                  : product.promoPrice !== null
                    ? "PROMOTION"
                    : "ACTIVE",
          },
        });
      }

      await tx.order.update({ where: { id: order.id }, data: { paidAt: now } });
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
    if (order.customerId) {
      await recalcCustomerStats(tx, order.customerId);
    }
    await logAudit(tx, {
      userId,
      action: next === "CANCELLED" ? "ORDER_CANCEL" : "ORDER_STATUS_CHANGE",
      entity: "Order",
      entityId: id,
      description: `Pedido ${order.number}: ${order.status} → ${next}`,
      before: { status: order.status },
      after: { status: next },
    });
  });

  // Pós-commit: snapshot do DIA DO PEDIDO (cancelamento muda números passados).
  if (orderDay) await recomputeSalesDaily(orderDay);
}
