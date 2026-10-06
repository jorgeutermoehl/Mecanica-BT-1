import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, PERMISSIONS, ROLES } from "./base-data";

const prisma = new PrismaClient();

/**
 * SEED MÍNIMO — um cadastro de cada modalidade, para o dono praticar:
 *  3 produtos reais já anunciados (coroa e pinhão, virabrequim, gaiola —
 *  fotos dos anúncios em public/produtos) · 1 entrada de estoque com despesa no
 *  financeiro · 1 cliente · 1 pedido pago (custo congelado + baixa no
 *  ledger + caixa) · 1 cupom · 1 fornecedor · 1 mensagem de contato.
 * Estruturais: papéis/permissões, usuários do painel e todas as categorias.
 * Cronologia coerente: abertura de estoque ANTES da venda.
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@fullboost.com.br";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "fullboost123";

// O seed APAGA o banco inteiro antes de popular. Nunca em produção: lá se usa
// `npm run db:bootstrap` (prisma/bootstrap.ts), que só cria o que falta.
const isLocalSqlite = (process.env.DATABASE_URL ?? "").startsWith("file:");
if ((process.env.NODE_ENV === "production" || !isLocalSqlite) && process.env.SEED_ALLOW_WIPE !== "1") {
  console.error(
    "⛔ Seed de demonstração bloqueado: ele apaga TODOS os dados.\n" +
      "   Em produção use `npm run db:bootstrap`. Para um banco de teste descartável,\n" +
      "   rode com SEED_ALLOW_WIPE=1.",
  );
  process.exit(1);
}

const daysAgo = (n: number, hourOffset = 0) =>
  new Date(Date.now() - n * 86_400_000 + hourOffset * 3_600_000);



const GAIOLA_VEICULOS =
  "Veículos atendidos: Astra 1994–1996 (sem painel) · Celta (sem painel) · Chevette (sem painel e por fora do painel) · " +
  "Corsa (sem painel) · Fusca (por fora do painel) · Kadett (sem painel, furando painel) · Gol G1 (sem painel, furando painel, " +
  "por fora do painel) · Gol G2, G3 e G4 (furando painel, por fora do painel) · Vectra 1997–2005 (sem painel) · Opala (por fora do painel). " +
  "Saveiro usa o kit do Gol: na maioria, com acrílico, os tubos passam pela janela traseira e ligam a gaiola às caixas de roda traseiras.";

const GAIOLA_COMO_PEDIR =
  "A maioria dos veículos tem kit com portas curvas ou retas; alguns têm opção de furar o painel ou passar por fora dele sem furar, " +
  "e alguns podem ser feitos sem usar o painel. Informe o veículo e as opções nas observações do pedido ou pelo WhatsApp.";

const GAIOLA_SPECS =
  "Pontos de fixação: 6 | Fabricação: sob medida para o veículo | Painel: furando, por fora ou sem painel (conforme o veículo) | " +
  "Portas: retas ou curvas (conforme o veículo)";

/**
 * Anúncios da loja (preços/custos/estoque de exemplo onde não informados —
 * ajuste no painel). Imagens: fotos e tabelas enviadas pela loja.
 * Foco do momento (featured): coroa e pinhão, virabrequim e gaiolas.
 * "Sob consulta" (priceOnRequest): anúncios de modelos variados.
 */
const PRODUCTS: {
  sku: string;
  name: string;
  slug: string;
  category: string;
  ownBrand?: boolean;
  condition: "NEW" | "USED" | "REMAN";
  featured: boolean;
  priceOnRequest?: boolean;
  description: string;
  technicalSpecs: string;
  fitment: string;
  costPrice: number;
  salePrice: number;
  qty: number;
  minStock: number;
  location: string;
  warranty?: string;
  images: { url: string; alt: string }[];
}[] = [
  // Referência de peça NOVA (o pedido de exemplo usa este item).
  {
    sku: "TRA-CP-831-GBX",
    name: "Coroa e Pinhão 8x31 — Gol BX",
    slug: "coroa-e-pinhao-8x31-gol-bx",
    category: "transmissao",
    condition: "NEW",
    featured: true,
    description:
      "Par coroa e pinhão relação 8x31 para câmbio do Gol BX. Peça nova, embalada individualmente. Relação longa — ideal para velocidade final em rua e pista.",
    technicalSpecs: "Relação: 8x31 | Aplicação: câmbio Gol BX | Dentes: pinhão 8 / coroa 31",
    fitment: "Câmbio Gol BX · relação 8x31",
    costPrice: 420,
    salePrice: 790,
    qty: 10,
    minStock: 2,
    location: "Corredor T · Prateleira 1",
    images: [
      { url: "/produtos/coroa-pinhao-detalhe.webp", alt: "Coroa e pinhão 8x31 — detalhe dos dentes e do pinhão" },
      { url: "/produtos/coroa-pinhao-lote.webp", alt: "Lote de coroas e pinhões 8x31 novos, embalados" },
    ],
  },
  {
    sku: "TRA-CP-MODELOS",
    name: "Coroa e Pinhão — Diversas Relações (Usado)",
    slug: "coroa-e-pinhao-diversas-relacoes-usado",
    category: "transmissao",
    condition: "USED",
    featured: true,
    priceOnRequest: true,
    description:
      "Pares de coroa e pinhão usados, em várias relações e aplicações. Cada par é vendido junto (coroa + pinhão). " +
      "Informe o carro, o câmbio e a relação desejada no WhatsApp que enviamos fotos do par disponível e o preço.",
    technicalSpecs: "Condição: usado | Relações: variadas — consulte | Venda: par (coroa + pinhão)",
    fitment: "Diversas relações — consulte",
    costPrice: 0,
    salePrice: 0,
    qty: 6,
    minStock: 1,
    location: "Bancada T",
    images: [
      { url: "/produtos/coroa-pinhao-modelos.webp", alt: "Pares de coroa e pinhão usados de relações variadas" },
      { url: "/produtos/coroa-pinhao-modelos-bancada.webp", alt: "Coroas e pinhões na bancada da oficina" },
    ],
  },
  {
    sku: "MOT-VIR-MODELOS",
    name: "Virabrequim — Modelos Diversos (Usado)",
    slug: "virabrequim-modelos-diversos-usado",
    category: "motor",
    condition: "USED",
    featured: true,
    priceOnRequest: true,
    description:
      "Virabrequins usados de modelos variados. Informe o motor do carro e a medida desejada (STD ou retificado) " +
      "no WhatsApp que confirmamos a aplicação, enviamos fotos da peça e o preço.",
    technicalSpecs: "Condição: usado | Modelos: variados — consulte | Medida: informar na consulta",
    fitment: "Modelos variados — consulte",
    costPrice: 0,
    salePrice: 0,
    qty: 2,
    minStock: 1,
    location: "Corredor M · Prateleira 1",
    images: [{ url: "/produtos/virabrequim-modelos.webp", alt: "Dois virabrequins usados lado a lado" }],
  },
  {
    sku: "MOT-VIR-FSC-STD",
    name: "Virabrequim STD Aço — Fusca",
    slug: "virabrequim-std-aco-fusca",
    category: "motor",
    condition: "NEW",
    featured: false,
    description:
      "Virabrequim medida STD em aço para motores VW a ar (Fusca e derivados) — base confiável para motor de rua ou preparação.",
    technicalSpecs: "Medida: STD | Material: aço | Motor: VW a ar 1300/1500/1600",
    fitment: "Motor VW a ar · Fusca 1300/1500/1600",
    costPrice: 750,
    salePrice: 1290,
    qty: 2,
    minStock: 1,
    location: "Corredor M · Prateleira 2",
    images: [],
  },
  {
    sku: "GAI-6P-BASICO",
    name: "Gaiola Santo Antônio 6 Pontos — Básica",
    slug: "gaiola-santo-antonio-6-pontos-basica",
    category: "gaiolas",
    ownBrand: true,
    condition: "NEW",
    featured: true,
    description:
      "Gaiola de proteção (santo antônio) de 6 pontos, fabricada sob medida para o seu carro. " +
      "Exemplo de pedido: 6 pontos básicos do Gol G1, furando painel.\n\n" + GAIOLA_COMO_PEDIR + "\n\n" + GAIOLA_VEICULOS,
    technicalSpecs: GAIOLA_SPECS,
    fitment: "Sob medida · 6 pontos básico",
    costPrice: 0,
    salePrice: 1650,
    qty: 3,
    minStock: 1,
    location: "Oficina · Área de solda",
    images: [
      { url: "/produtos/gaiola-kit-6-pontos-basico.webp", alt: "Desenho da gaiola 6 pontos básica" },
      { url: "/produtos/gaiola-desenho-6-pontos.webp", alt: "Desenho técnico de gaiola de 6 pontos" },
      { url: "/produtos/gaiola-rollcage.webp", alt: "Gaiola fabricada na oficina" },
      { url: "/produtos/gaiola-tabela-veiculos.webp", alt: "Tabela de kits e veículos atendidos" },
    ],
  },
  {
    sku: "GAI-6P-PORTAS",
    name: "Gaiola Santo Antônio 6 Pontos — Portas e Painel",
    slug: "gaiola-santo-antonio-6-pontos-portas-e-painel",
    category: "gaiolas",
    ownBrand: true,
    condition: "NEW",
    featured: true,
    description:
      "Gaiola de 6 pontos com travessa de painel e barras nas portas (retas ou curvas), fabricada sob medida. " +
      "Exemplo de pedido: 6 pontos básicos do Gol G2 por fora do painel + travessa painel + portas retas.\n\n" +
      GAIOLA_COMO_PEDIR + "\n\n" + GAIOLA_VEICULOS,
    technicalSpecs: GAIOLA_SPECS + " | Inclui: travessa de painel + barras nas portas",
    fitment: "Sob medida · 6 pontos com portas e painel",
    costPrice: 0,
    salePrice: 1850,
    qty: 3,
    minStock: 1,
    location: "Oficina · Área de solda",
    images: [
      { url: "/produtos/gaiola-kit-6-pontos-portas-painel.webp", alt: "Desenho da gaiola 6 pontos com portas e painel" },
      { url: "/produtos/gaiola-reforco-portas.webp", alt: "Detalhe das barras de reforço nas portas" },
      { url: "/produtos/gaiola-rollcage.webp", alt: "Gaiola fabricada na oficina" },
      { url: "/produtos/gaiola-tabela-veiculos.webp", alt: "Tabela de kits e veículos atendidos" },
    ],
  },
  {
    sku: "GAI-6P-COMPLETA",
    name: "Gaiola Santo Antônio 6 Pontos — Completa (Painel, Porta-malas e X nas Portas)",
    slug: "gaiola-santo-antonio-6-pontos-completa",
    category: "gaiolas",
    ownBrand: true,
    condition: "NEW",
    featured: true,
    description:
      "Gaiola de 6 pontos completa: travessa de painel, tubo no porta-malas e \"X\" nas portas, fabricada sob medida. " +
      "Exemplo de pedido: 6 pontos básicos do Opala por fora do painel, com \"X\" nas portas + travessa painel + tubo no porta-malas.\n\n" +
      GAIOLA_COMO_PEDIR + "\n\n" + GAIOLA_VEICULOS,
    technicalSpecs: GAIOLA_SPECS + " | Inclui: travessa de painel + tubo no porta-malas + X nas portas",
    fitment: "Sob medida · 6 pontos completa",
    costPrice: 0,
    salePrice: 2100,
    qty: 3,
    minStock: 1,
    location: "Oficina · Área de solda",
    images: [
      { url: "/produtos/gaiola-kit-6-pontos-completo.webp", alt: "Desenho da gaiola 6 pontos completa" },
      { url: "/produtos/gaiola-reforco-portas.webp", alt: "Detalhe das barras de reforço nas portas" },
      { url: "/produtos/gaiola-desenho-6-pontos.webp", alt: "Desenho técnico de gaiola de 6 pontos" },
      { url: "/produtos/gaiola-tabela-veiculos.webp", alt: "Tabela de kits e veículos atendidos" },
    ],
  },
];

async function wipe() {
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.productSalesDaily.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.cookieConsent.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.cashFlowEntry.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockEntryItem.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.financialResult.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.manufacturer.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
}

async function main() {
  console.log("🌱 Limpando dados...");
  await wipe();

  console.log("🔐 Papéis, permissões e usuários do painel...");
  for (const perm of PERMISSIONS) await prisma.permission.create({ data: perm });
  const roleBySlug: Record<string, string> = {};
  for (const r of ROLES) {
    const role = await prisma.role.create({
      data: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        permissions: { connect: r.perms.map((key) => ({ key })) },
      },
    });
    roleBySlug[r.slug] = role.id;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: "Administrador FullBoost",
      phone: "(47) 99999-0000",
      passwordHash,
      roleId: roleBySlug["admin"],
    },
  });
  await prisma.user.create({
    data: { email: "vendedor@fullboost.com.br", name: "Carlos Vendas", passwordHash, roleId: roleBySlug["vendedor"] },
  });

  console.log("🗂️  Categorias (estruturais) + 1 marca + 1 fornecedor...");
  const catBySlug: Record<string, string> = {};
  for (const { disabled, ...c } of CATEGORIES) {
    const cat = await prisma.category.create({ data: { ...c, deletedAt: disabled ? daysAgo(30) : null } });
    catBySlug[c.slug] = cat.id;
  }
  const brand = await prisma.brand.create({ data: { name: "FullBoost", slug: "fullboost" } });
  const supplier = await prisma.supplier.create({
    data: {
      legalName: "Race Import Distribuidora Ltda",
      tradeName: "Race Import",
      document: "12.345.678/0001-90",
      email: "vendas@raceimport.com.br",
      phone: "(47) 3333-1000",
      city: "Joinville",
      state: "SC",
      paymentTerms: "28/35/42 dias",
    },
  });

  console.log(`🔩 ${PRODUCTS.length} produtos anunciados (transmissão, motor, gaiolas)...`);
  const openedAt = daysAgo(7); // abertura ANTES da venda (cronologia coerente)
  const products: { id: string; name: string; sku: string; costPrice: number; salePrice: number; qty: number }[] = [];
  for (const p of PRODUCTS) {
    const created = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        categoryId: catBySlug[p.category],
        brandId: p.ownBrand ? brand.id : null,
        description: p.description,
        technicalSpecs: p.technicalSpecs,
        fitment: p.fitment,
        condition: p.condition,
        featured: p.featured,
        priceOnRequest: p.priceOnRequest ?? false,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        stockQuantity: p.qty,
        minStock: p.minStock,
        location: p.location,
        warranty: p.warranty ?? null,
        status: "ACTIVE",
        createdAt: openedAt,
        images: {
          create: p.images.map((img, i) => ({ ...img, isPrimary: i === 0, position: i })),
        },
      },
    });
    products.push({ id: created.id, name: created.name, sku: created.sku, costPrice: p.costPrice, salePrice: p.salePrice, qty: p.qty });
  }
  const product = products[0]; // coroa e pinhão — usado no pedido de exemplo

  console.log("📦 1 entrada de estoque com despesa no financeiro...");
  const entryTotal = products.reduce((sum, p) => sum + p.qty * p.costPrice, 0);
  const entryLabel = products.map((p) => `${p.qty}x ${p.sku}`).join(", ");
  const entry = await prisma.stockEntry.create({
    data: {
      supplierId: supplier.id,
      invoiceNumber: "NF-0001",
      purchaseDate: openedAt,
      entryDate: openedAt,
      itemsTotal: entryTotal,
      total: entryTotal,
      paymentMethod: "PIX",
      financialStatus: "PAID",
      userId: admin.id,
      createdAt: openedAt,
      items: {
        create: products.map((p) => ({
          productId: p.id,
          quantity: p.qty,
          unitCost: p.costPrice,
          totalCost: p.qty * p.costPrice,
        })),
      },
    },
  });
  for (const p of products) {
    await prisma.inventoryMovement.create({
      data: {
        productId: p.id,
        type: "ENTRY",
        direction: "IN",
        quantity: p.qty,
        unitCost: p.costPrice,
        balanceBefore: 0,
        balanceAfter: p.qty,
        reason: "Entrada por compra (NF NF-0001)",
        userId: admin.id,
        stockEntryId: entry.id,
        createdAt: openedAt,
      },
    });
  }
  await prisma.accountPayable.create({
    data: {
      supplierId: supplier.id,
      stockEntryId: entry.id,
      description: `Compra de estoque — ${entryLabel} (NF NF-0001)`,
      category: "Compras de estoque",
      amount: entryTotal,
      paidAmount: entryTotal,
      dueDate: openedAt,
      paidAt: openedAt,
      status: "PAID",
      paymentMethod: "PIX",
      createdAt: openedAt,
    },
  });
  await prisma.cashFlowEntry.create({
    data: {
      type: "OUTFLOW",
      category: "Compras de estoque",
      description: `Compra ${entryLabel} (NF NF-0001)`,
      amount: entryTotal,
      date: openedAt,
      userId: admin.id,
      createdAt: openedAt,
    },
  });

  console.log("👤 1 cliente + 🛒 1 pedido pago (venda pelo site)...");
  const soldAt = daysAgo(2); // DEPOIS da abertura
  const customer = await prisma.customer.create({
    data: {
      name: "João da Silva",
      document: "123.456.789-09",
      documentNormalized: "12345678909",
      personType: "INDIVIDUAL",
      email: "joao.silva@email.com",
      phone: "(47) 98888-1234",
      phoneNormalized: "+5547988881234",
      instagramHandle: "joao.golbx",
      whatsapp: "(47) 98888-1234",
      acquisitionChannel: "SITE",
      ordersCount: 1,
      createdAt: soldAt,
    },
  });
  const total = product.salePrice + 0; // frete grátis (>= 599)
  const order = await prisma.order.create({
    data: {
      number: "PED-0001",
      customerId: customer.id,
      customerName: customer.name,
      customerDocument: customer.document,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      status: "PAID",
      channel: "SITE",
      subtotal: product.salePrice,
      shippingCost: 0,
      total,
      paymentMethod: "PIX",
      shipZipCode: "89200-000",
      shipStreet: "Rua das Palmeiras",
      shipNumber: "123",
      shipCity: "Joinville",
      shipState: "SC",
      createdAt: soldAt,
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice: product.salePrice,
            unitCostAtSale: product.costPrice, // custo congelado
            total: product.salePrice,
          },
        ],
      },
      statusHistory: { create: [{ status: "PAID", note: "Pedido de exemplo (seed)" }] },
    },
  });
  await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      type: "SALE",
      direction: "OUT",
      quantity: 1,
      unitCost: product.costPrice,
      balanceBefore: product.qty,
      balanceAfter: product.qty - 1,
      reason: "Venda PED-0001",
      orderId: order.id,
      createdAt: soldAt,
    },
  });
  await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: product.qty - 1 } });
  await prisma.payment.create({
    data: { orderId: order.id, amount: total, method: "PIX", status: "PAID", paidAt: soldAt, createdAt: soldAt },
  });
  await prisma.accountReceivable.create({
    data: {
      customerId: customer.id,
      orderId: order.id,
      description: "Recebimento PED-0001",
      amount: total,
      receivedAmount: total,
      dueDate: soldAt,
      receivedAt: soldAt,
      status: "PAID",
      paymentMethod: "PIX",
      createdAt: soldAt,
    },
  });
  await prisma.cashFlowEntry.create({
    data: {
      type: "INFLOW",
      category: "Vendas",
      description: "Recebimento PED-0001",
      amount: total,
      orderId: order.id,
      date: soldAt,
      createdAt: soldAt,
    },
  });
  await prisma.customer.update({
    where: { id: customer.id },
    data: { totalSpent: total, lastPurchaseAt: soldAt },
  });
  // Endereço reutilizável do cliente (mesmo padrão do upsert do checkout).
  await prisma.address.create({
    data: {
      customerId: customer.id,
      label: "Entrega",
      zipCode: "89200-000",
      street: "Rua das Palmeiras",
      number: "123",
      city: "Joinville",
      state: "SC",
      isDefault: true,
      createdAt: soldAt,
    },
  });

  console.log("🏷️  1 cupom + ✉️ 1 mensagem de contato...");
  await prisma.coupon.create({
    data: { code: "BEMVINDO10", type: "PERCENT", value: 10, minOrderValue: 100, usageLimit: 200, isActive: true },
  });
  await prisma.contactMessage.create({
    data: {
      name: "Carlos Mendes",
      email: "carlos@email.com",
      phone: "(47) 96666-0000",
      subject: "Gaiola sob medida",
      message: "Vocês fazem gaiola para Gol quadrado de pista, desviando o painel e com suporte de paraquedas?",
      status: "NEW",
      createdAt: daysAgo(1),
    },
  });

  console.log("✅ Seed mínimo concluído — 1 cadastro de cada modalidade.");
  console.log(`   Painel: /admin/login → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
