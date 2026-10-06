/* eslint-disable @typescript-eslint/no-unused-expressions -- asserções no formato `cond ? ok() : fail()` */
/**
 * Testes de erros de usuário (uso: npx tsx scripts/edge-tests.ts)
 * Bombardeia os serviços com entradas inválidas e confere que cada guarda
 * responde com erro amigável — e que os caminhos felizes funcionam.
 * Ao final, o banco deve ser re-seedado (o script mexe no estoque).
 */
import { prisma } from "../src/lib/prisma";
import { placeOrder, registerManualSale, updateOrderStatus } from "../src/server/orders";
import { expireStalePayments } from "../src/server/payments";
import { createProduct } from "../src/server/products";
import {
  adjustStock,
  correctMovement,
  registerOut,
  reverseMovement,
} from "../src/server/inventory";
import { setPromoPrice } from "../src/server/promotions";
import { authenticate } from "../src/lib/auth";
import { checkoutSchema, productSchema } from "../src/lib/validations";

let passed = 0;
let failed = 0;

function ok(name: string) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function fail(name: string, detail: string) {
  failed++;
  console.log(`  ✗ ${name} — ${detail}`);
}

/** Espera que a promise REJEITE com mensagem contendo o trecho. */
async function expectError(name: string, fn: () => Promise<unknown>, contains: string) {
  try {
    await fn();
    fail(name, "deveria ter sido rejeitado, mas passou");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes(contains.toLowerCase())) ok(`${name} → "${msg.slice(0, 70)}"`);
    else fail(name, `erro inesperado: "${msg}"`);
  }
}

const CHECKOUT_BASE = {
  customer: { name: "Teste Erros", email: "erros@teste.com", phone: "(47) 90000-0000", document: "" },
  shipping: { zipCode: "89200-000", street: "Rua X", number: "1", complement: "", district: "", city: "Joinville", state: "SC" },
  paymentMethod: "PIX" as const,
  couponCode: "",
};

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: { slug: "admin" } } });
  const product = await prisma.product.findUniqueOrThrow({ where: { sku: "TRA-CP-831-GBX" } });
  console.log(`Base: ${product.sku} com ${product.stockQuantity} un em estoque\n`);

  console.log("== CHECKOUT (loja) ==");
  await expectError(
    "comprar mais que o estoque (100 un)",
    () => placeOrder({ ...CHECKOUT_BASE, items: [{ productId: product.id, quantity: 100 }] }),
    "Estoque insuficiente",
  );
  await expectError(
    "cupom inexistente",
    () => placeOrder({ ...CHECKOUT_BASE, couponCode: "NAOEXISTE", items: [{ productId: product.id, quantity: 1 }] }),
    "Cupom inválido",
  );
  await prisma.coupon.update({ where: { code: "BEMVINDO10" }, data: { minOrderValue: 5000 } });
  await expectError(
    "cupom abaixo do pedido mínimo",
    () => placeOrder({ ...CHECKOUT_BASE, couponCode: "BEMVINDO10", items: [{ productId: product.id, quantity: 1 }] }),
    "a partir de",
  );
  await prisma.coupon.update({ where: { code: "BEMVINDO10" }, data: { minOrderValue: 100 } });
  await prisma.coupon.update({ where: { code: "BEMVINDO10" }, data: { isActive: false } });
  await expectError(
    "cupom desativado",
    () => placeOrder({ ...CHECKOUT_BASE, couponCode: "BEMVINDO10", items: [{ productId: product.id, quantity: 1 }] }),
    "Cupom inválido",
  );
  await prisma.coupon.update({ where: { code: "BEMVINDO10" }, data: { isActive: true } });
  {
    const parsed = checkoutSchema.safeParse({
      ...CHECKOUT_BASE,
      customer: { ...CHECKOUT_BASE.customer, email: "nao-e-email" },
      items: [{ productId: product.id, quantity: 1 }],
    });
    parsed.success ? fail("e-mail inválido no checkout", "zod aceitou") : ok("e-mail inválido barrado pela validação");
  }
  {
    const parsed = checkoutSchema.safeParse({ ...CHECKOUT_BASE, items: [] });
    parsed.success ? fail("carrinho vazio no checkout", "zod aceitou") : ok("carrinho vazio barrado pela validação");
  }

  {
    const onRequest = await prisma.product.findFirstOrThrow({ where: { priceOnRequest: true } });
    await expectError(
      "pedido com anúncio 'sob consulta' (sem preço)",
      () => placeOrder({ ...CHECKOUT_BASE, items: [{ productId: onRequest.id, quantity: 1 }] }),
      "não está mais disponível",
    );
  }

  console.log("== PRODUTOS ==");
  await expectError(
    "SKU duplicado",
    () =>
      createProduct(
        { name: "Coroa duplicada", sku: "TRA-CP-831-GBX", categoryId: product.categoryId, brandName: "", originalCode: "", description: "", technicalSpecs: "", fitment: "", warranty: "", location: "", imageUrl: "", costPrice: 1, salePrice: 2, promoPrice: undefined, initialStock: 0, minStock: 0, condition: "NEW", featured: false, priceOnRequest: false },
        admin.id,
      ),
    "Já existe um produto com esse SKU",
  );
  {
    const base = { name: "Coroa teste", sku: "TST-1", categoryId: product.categoryId, costPrice: 1, initialStock: 0, minStock: 0 };
    productSchema.safeParse({ ...base, salePrice: 10, imageUrl: "/api/media/product-image/x/detail.webp" }).success
      ? ok("edição aceita foto enviada pelo painel (caminho /api/media/…)")
      : fail("foto enviada na edição", "zod recusou o caminho relativo");
    productSchema.safeParse({ ...base, salePrice: 10, imageUrl: "javascript:alert(1)" }).success
      ? fail("URL de imagem maliciosa", "zod aceitou")
      : ok("URL de imagem fora de http(s)/caminho local barrada");
    productSchema.safeParse({ ...base, salePrice: 0 }).success
      ? fail("preço zero sem 'sob consulta'", "zod aceitou")
      : ok("preço zero barrado quando não é 'sob consulta'");
    productSchema.safeParse({ ...base, salePrice: 0, priceOnRequest: true }).success
      ? ok("preço zero aceito em anúncio 'sob consulta'")
      : fail("anúncio sob consulta", "zod recusou");
  }
  await expectError(
    "promoção maior que o preço de venda",
    () => setPromoPrice({ productId: product.id, promoPrice: 899 }, admin.id),
    "menor que o preço",
  );

  console.log("== ESTOQUE ==");
  await expectError(
    "saída maior que o saldo",
    () => registerOut({ productId: product.id, quantity: 999, type: "MANUAL_OUT", reason: "teste" }, admin.id),
    "Estoque insuficiente",
  );
  await expectError(
    "ajuste para a mesma quantidade",
    () => adjustStock({ productId: product.id, newQuantity: product.stockQuantity, reason: "teste" }, admin.id),
    "igual ao saldo atual",
  );
  await expectError(
    "venda manual acima do saldo",
    () =>
      registerManualSale(
        { productId: product.id, quantity: 999, unitPrice: 899, channel: "INSTAGRAM", customerName: "", paymentMethod: "PIX" },
        admin.id,
      ),
    "Estoque insuficiente",
  );

  console.log("== ESTORNO / CORREÇÃO (append-only) ==");
  const saleMovement = await prisma.inventoryMovement.findFirstOrThrow({ where: { type: "SALE" } });
  await expectError(
    "estornar movimento de pedido",
    () => reverseMovement(saleMovement.id, admin.id),
    "vinculada a pedido",
  );
  const entryMovement = await prisma.inventoryMovement.findFirstOrThrow({ where: { type: "ENTRY" } });
  await expectError(
    "estornar entrada já consumida (deixaria negativo: 9 − 10)",
    () => reverseMovement(entryMovement.id, admin.id),
    "negativo",
  );

  // Caminho feliz: saída manual → corrigir → estornar (máquina completa)
  console.log("== FLUXO FELIZ: saída → correção → estorno ==");
  const out = await registerOut({ productId: product.id, quantity: 2, type: "MANUAL_OUT", reason: "uso interno" }, admin.id);
  out.balanceAfter === 7 ? ok(`saída manual de 2 (9 → ${out.balanceAfter})`) : fail("saída manual", `saldo ${out.balanceAfter}`);

  const outMov = await prisma.inventoryMovement.findFirstOrThrow({
    where: { type: "MANUAL_OUT" },
    orderBy: { createdAt: "desc" },
  });
  const corrected = await correctMovement(outMov.id, { quantity: 1, reason: "era só 1 peça" }, admin.id);
  corrected.balanceAfter === 8
    ? ok(`correção 2→1 (estorna p/ 9, relança 1: saldo ${corrected.balanceAfter})`)
    : fail("correção", `saldo ${corrected.balanceAfter}`);

  await expectError(
    "corrigir o mesmo movimento de novo (já estornado)",
    () => correctMovement(outMov.id, { quantity: 1 }, admin.id),
    "já foi estornada",
  );

  const newOut = await prisma.inventoryMovement.findFirstOrThrow({
    where: { type: "MANUAL_OUT", reversalOfId: null, reversedBy: null },
    orderBy: { createdAt: "desc" },
  });
  const reversed = await reverseMovement(newOut.id, admin.id);
  reversed.balanceAfter === 9 ? ok(`estorno da saída corrigida (saldo volta a ${reversed.balanceAfter})`) : fail("estorno", `saldo ${reversed.balanceAfter}`);

  console.log("== PEDIDOS SIMULTÂNEOS (número único) ==");
  {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        placeOrder({ ...CHECKOUT_BASE, items: [{ productId: product.id, quantity: 1 }] }),
      ),
    );
    const numbers = results.flatMap((r) => (r.status === "fulfilled" ? [r.value.orderNumber] : []));
    const failures = results.filter((r) => r.status === "rejected");
    failures.length === 0 && new Set(numbers).size === 5
      ? ok(`5 checkouts ao mesmo tempo → números distintos (${numbers.join(", ")})`)
      : fail(
          "checkouts simultâneos",
          `${failures.length} falharam (${failures
            .map((f) => (f.status === "rejected" ? String(f.reason).split("\n").slice(-2).join(" ").slice(0, 160) : ""))
            .join(" | ")}) · números: ${numbers.join(", ")}`,
        );
    // Libera as reservas para os próximos testes.
    for (const n of numbers) {
      const o = await prisma.order.findUniqueOrThrow({ where: { number: n } });
      await updateOrderStatus(o.id, "CANCELLED", admin.id, "teste");
    }
  }

  console.log("== PAGAMENTO DEPOIS DAS 72h (reserva expirada) ==");
  {
    const before = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stockQuantity;
    const r = await placeOrder({ ...CHECKOUT_BASE, items: [{ productId: product.id, quantity: 2 }] });
    const order = await prisma.order.findUniqueOrThrow({ where: { number: r.orderNumber } });
    // Simula o 4º dia: reserva vencida + cron de expiração rodando.
    await prisma.stockReservation.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 3_600_000) },
    });
    await expireStalePayments();
    const expired = await prisma.stockReservation.findFirstOrThrow({ where: { orderId: order.id } });
    expired.status === "EXPIRED"
      ? ok("cron marcou a reserva como EXPIRED")
      : fail("cron de expiração", `status ${expired.status}`);
    await updateOrderStatus(order.id, "PAID", admin.id, "pago no WhatsApp após 72h");
    const after = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stockQuantity;
    const sale = await prisma.inventoryMovement.count({ where: { orderId: order.id, type: "SALE" } });
    after === before - 2 && sale === 1
      ? ok(`pago após expirar baixa o estoque (${before} → ${after}) com movimento SALE`)
      : fail("pago após expirar", `estoque ${before} → ${after}, SALEs: ${sale}`);
  }

  console.log("== LOGIN ==");
  (await authenticate("admin@fullboost.com.br", "senha-errada")) === null
    ? ok("senha errada rejeitada")
    : fail("senha errada", "autenticou!");
  (await authenticate("naoexiste@fullboost.com.br", "fullboost123")) === null
    ? ok("e-mail inexistente rejeitado")
    : fail("e-mail inexistente", "autenticou!");
  (await authenticate("admin@fullboost.com.br", "fullboost123")) !== null
    ? ok("login correto funciona")
    : fail("login correto", "não autenticou");

  console.log(`\n${failed === 0 ? "✅" : "⚠️"} ${passed} passaram · ${failed} falharam`);
  process.exit(failed === 0 ? 0 : 2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
