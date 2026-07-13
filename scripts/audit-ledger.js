/**
 * Auditoria de consistência do banco (uso: node scripts/audit-ledger.js)
 * 1. Ledger: cadeia balanceBefore→balanceAfter por produto + saldo final = stockQuantity
 * 2. Pedidos: subtotal = soma dos itens; total = subtotal − desconto + frete
 * 3. Pagamentos/recebíveis/caixa consistentes com pedidos pagos
 * 4. Cupons: usageCount = resgates
 * 5. Clientes: totalSpent = soma dos pedidos válidos
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const issues = [];
const ok = (msg) => console.log("  ✓", msg);
const bad = (msg) => {
  issues.push(msg);
  console.log("  ✗", msg);
};
const money = (n) => Math.round(Number(n) * 100) / 100;

async function main() {
  console.log("== 1. LEDGER (cadeia de saldos por produto) ==");
  const products = await p.product.findMany({
    include: { movements: { orderBy: { createdAt: "asc" } } },
  });
  let chainErrors = 0;
  for (const prod of products) {
    let expected = 0;
    for (const m of prod.movements) {
      if (m.balanceBefore !== expected) {
        bad(`${prod.sku}: movimento ${m.id.slice(-6)} (${m.type}) balanceBefore=${m.balanceBefore}, esperado ${expected}`);
        chainErrors++;
      }
      const delta = m.direction === "IN" ? m.quantity : -m.quantity;
      if (m.balanceAfter !== m.balanceBefore + delta) {
        bad(`${prod.sku}: movimento ${m.id.slice(-6)} balanceAfter=${m.balanceAfter}, esperado ${m.balanceBefore + delta}`);
        chainErrors++;
      }
      expected = m.balanceAfter;
    }
    if (expected !== prod.stockQuantity) {
      bad(`${prod.sku}: saldo final do ledger=${expected}, product.stockQuantity=${prod.stockQuantity}`);
      chainErrors++;
    }
  }
  if (chainErrors === 0) ok(`${products.length} produtos: cadeias íntegras e saldos batem com o ledger`);

  console.log("== 2. PEDIDOS (totais) ==");
  const orders = await p.order.findMany({ include: { items: true, payments: true } });
  let orderErrors = 0;
  for (const o of orders) {
    const itemsSum = money(o.items.reduce((s, i) => s + Number(i.total), 0));
    const itemsCalc = money(o.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0));
    if (itemsSum !== itemsCalc) {
      bad(`${o.number}: soma de itens ${itemsSum} != unitPrice×qtd ${itemsCalc}`);
      orderErrors++;
    }
    if (money(o.subtotal) !== itemsSum) {
      bad(`${o.number}: subtotal=${money(o.subtotal)} != itens ${itemsSum}`);
      orderErrors++;
    }
    const expectedTotal = money(Number(o.subtotal) - Number(o.discount) + Number(o.shippingCost));
    if (money(o.total) !== expectedTotal) {
      bad(`${o.number}: total=${money(o.total)} != subtotal−desconto+frete ${expectedTotal}`);
      orderErrors++;
    }
    const paid = o.payments.filter((x) => x.status === "PAID");
    if (["PAID", "SEPARATING", "SHIPPED", "DELIVERED"].includes(o.status) && paid.length === 0) {
      bad(`${o.number}: status ${o.status} sem pagamento PAID`);
      orderErrors++;
    }
  }
  if (orderErrors === 0) ok(`${orders.length} pedidos: subtotais, descontos, fretes e pagamentos consistentes`);

  console.log("== 3. VENDAS × LEDGER ==");
  let saleErrors = 0;
  for (const o of orders) {
    if (["CANCELLED", "RETURNED"].includes(o.status)) continue;
    const saleMovs = await p.inventoryMovement.findMany({ where: { orderId: o.id, type: "SALE" } });
    const movQty = saleMovs.reduce((s, m) => s + m.quantity, 0);
    const itemQty = o.items.reduce((s, i) => s + i.quantity, 0);
    if (movQty !== itemQty) {
      bad(`${o.number}: itens=${itemQty} un, movimentos SALE=${movQty} un`);
      saleErrors++;
    }
  }
  if (saleErrors === 0) ok("toda venda tem baixa SALE equivalente no ledger");

  console.log("== 4. CAIXA × PEDIDOS PAGOS ==");
  let cashErrors = 0;
  for (const o of orders) {
    const paidPayment = o.payments.find((x) => x.status === "PAID");
    if (paidPayment) {
      const inflow = await p.cashFlowEntry.findFirst({ where: { orderId: o.id, type: "INFLOW" } });
      if (!inflow) {
        bad(`${o.number}: pago mas sem entrada no caixa`);
        cashErrors++;
      } else if (money(inflow.amount) !== money(o.total)) {
        bad(`${o.number}: caixa=${money(inflow.amount)} != total ${money(o.total)}`);
        cashErrors++;
      }
    }
  }
  if (cashErrors === 0) ok("todo pedido pago tem entrada no caixa com o valor exato");

  console.log("== 5. CUPONS ==");
  const coupons = await p.coupon.findMany({ include: { _count: { select: { redemptions: true } } } });
  let couponErrors = 0;
  for (const c of coupons) {
    if (c.usageCount !== c._count.redemptions) {
      bad(`${c.code}: usageCount=${c.usageCount} != resgates ${c._count.redemptions}`);
      couponErrors++;
    }
  }
  if (couponErrors === 0) ok(`${coupons.length} cupons: contadores de uso batem com os resgates`);

  console.log("== 6. CLIENTES (totalSpent) ==");
  const customers = await p.customer.findMany({ include: { orders: true } });
  let custErrors = 0;
  for (const c of customers) {
    const spent = money(
      c.orders
        .filter((o) => !["CANCELLED", "RETURNED"].includes(o.status))
        .reduce((s, o) => s + Number(o.total), 0),
    );
    if (money(c.totalSpent) !== spent) {
      bad(`${c.name}: totalSpent=${money(c.totalSpent)} != soma dos pedidos ${spent}`);
      custErrors++;
    }
  }
  if (custErrors === 0) ok(`${customers.length} clientes: total comprado confere`);

  console.log(issues.length === 0 ? "\n✅ AUDITORIA LIMPA — tudo consistente." : `\n⚠️  ${issues.length} inconsistência(s).`);
  process.exit(issues.length === 0 ? 0 : 2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
