import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedVehicles } from "./seed-vehicles";

const prisma = new PrismaClient();

/**
 * SEED MÍNIMO — um cadastro de cada modalidade, para o dono praticar:
 *  1 produto (com imagem real) · 1 entrada de estoque com despesa no
 *  financeiro · 1 cliente · 1 pedido pago (custo congelado + baixa no
 *  ledger + caixa) · 1 cupom · 1 fornecedor · 1 mensagem de contato.
 * Estruturais: papéis/permissões, usuários do painel e todas as categorias.
 * Cronologia coerente: abertura de estoque ANTES da venda.
 */

const ADMIN_EMAIL = "admin@fullboost.com.br";
const ADMIN_PASSWORD = "fullboost123";

const daysAgo = (n: number, hourOffset = 0) =>
  new Date(Date.now() - n * 86_400_000 + hourOffset * 3_600_000);

const PERMISSIONS = [
  { key: "dashboard.view", description: "Ver dashboard" },
  { key: "products.manage", description: "Gerenciar produtos" },
  { key: "inventory.manage", description: "Movimentar estoque" },
  { key: "orders.manage", description: "Gerenciar pedidos" },
  { key: "customers.manage", description: "Gerenciar clientes" },
  { key: "suppliers.manage", description: "Gerenciar fornecedores" },
  { key: "promotions.manage", description: "Gerenciar promoções e cupons" },
  { key: "finance.manage", description: "Gerenciar financeiro e DRE" },
  { key: "reports.view", description: "Ver relatórios" },
  { key: "users.manage", description: "Gerenciar usuários" },
  { key: "audit.view", description: "Ver auditoria" },
];

const ROLES = [
  { name: "Administrador", slug: "admin", description: "Acesso total", perms: PERMISSIONS.map((p) => p.key) },
  { name: "Gerente", slug: "gerente", description: "Estoque, vendas e financeiro", perms: ["dashboard.view", "products.manage", "inventory.manage", "orders.manage", "customers.manage", "suppliers.manage", "promotions.manage", "finance.manage", "reports.view"] },
  { name: "Vendedor", slug: "vendedor", description: "Pedidos, clientes e produtos", perms: ["dashboard.view", "orders.manage", "customers.manage"] },
  { name: "Estoquista", slug: "estoquista", description: "Entradas, saídas e inventário", perms: ["dashboard.view", "inventory.manage"] },
  { name: "Financeiro", slug: "financeiro", description: "Contas, caixa e DRE", perms: ["dashboard.view", "finance.manage", "reports.view"] },
  { name: "Cliente", slug: "cliente", description: "Área de compra", perms: [] as string[] },
];

const CATEGORIES = [
  { name: "Rodas", slug: "rodas", icon: "rodas", featured: true, position: 0, description: "Rodas esportivas, forjadas e réplicas nos principais furações e aros." },
  { name: "Turbo & Boost", slug: "turbo", icon: "turbo", featured: false, position: 1, description: "Turbinas, wastegates, intercoolers e tudo para pressão de verdade." },
  { name: "Motor", slug: "motor", icon: "motor", featured: false, position: 2, description: "Internos forjados, embreagens e componentes para alta potência." },
  { name: "Escape", slug: "escape", icon: "escape", featured: false, position: 3, description: "Sistemas cat-back, downpipes e ponteiras em inox." },
  { name: "Freios", slug: "freios", icon: "freios", featured: false, position: 4, description: "Kits big brake, discos e pastilhas de alta performance." },
  { name: "Suspensão", slug: "suspensao", icon: "suspensao", featured: false, position: 5, description: "Coilovers, amortecedores e acerto de altura com segurança." },
  { name: "Admissão & Filtros", slug: "filtros", icon: "filtros", featured: false, position: 6, description: "Filtros esportivos e kits de admissão para respirar melhor." },
  { name: "Elétrica & Ignição", slug: "eletrica", icon: "eletrica", featured: false, position: 7, description: "Velas, bobinas e baterias para ignição sem falhas." },
  { name: "Óleos & Fluidos", slug: "oleos", icon: "oleos", featured: false, position: 8, description: "Lubrificantes sintéticos e fluidos racing." },
];

async function wipe() {
  await prisma.auditLog.deleteMany();
  await prisma.cookieConsent.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.cashFlowEntry.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockEntryItem.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.productApplication.deleteMany();
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
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
}

async function main() {
  console.log("🌱 Limpando dados...");
  await wipe();

  console.log("🚗 Catálogo de veículos (fitment)...");
  const v = await seedVehicles(prisma);
  console.log(`   ${v.makes} marcas · ${v.models} modelos · ${v.versions} versões`);

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
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    catBySlug[c.slug] = cat.id;
  }
  const brand = await prisma.brand.create({ data: { name: "FB Wheels", slug: "fb-wheels" } });
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

  console.log("🔩 1 produto de exemplo (Rodas — destaque da loja)...");
  const openedAt = daysAgo(7); // abertura ANTES da venda (cronologia coerente)
  // Fitment normalizado: liga a aplicação demo à versão do catálogo de veículos.
  const golfTsi = await prisma.vehicleVersion.findFirst({
    where: { name: "TSI 1.4", model: { slug: "golf", make: { slug: "volkswagen" } } },
  });
  const product = await prisma.product.create({
    data: {
      sku: "ROD-FBW-1770",
      name: "Roda Esportiva Aro 17 5x100 Preto Fosco",
      slug: "roda-esportiva-aro-17-5x100",
      categoryId: catBySlug["rodas"],
      brandId: brand.id,
      description:
        "Roda esportiva em liga leve com acabamento preto fosco e design multi-spoke. Leveza e resistência para uso em rua e track day.",
      technicalSpecs: 'Aro: 17x7" | Furação: 5x100 | ET: 38 | CB: 57,1mm | Peso: 8,4kg | Liga de alumínio A356',
      fitment: "5x100 · ET38 · Aro 17x7",
      costPrice: 480,
      salePrice: 899,
      stockQuantity: 10,
      minStock: 3,
      location: "Corredor R · Prateleira 1",
      warranty: "12 meses contra defeitos de fabricação",
      status: "ACTIVE",
      createdAt: openedAt,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1542377281-73d08e3a10aa?q=80&w=900&auto=format&fit=crop",
            alt: "Roda Esportiva Aro 17",
            isPrimary: true,
          },
        ],
      },
      applications: {
        create: [
          {
            vehicleBrand: "Volkswagen",
            vehicleModel: "Golf",
            yearStart: 2008,
            yearEnd: 2020,
            vehicleVersionId: golfTsi?.id ?? null,
            legacyText: "Volkswagen Golf 2008–2020",
          },
        ],
      },
    },
  });

  console.log("📦 1 entrada de estoque com despesa no financeiro...");
  const entryTotal = 10 * 480;
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
      items: { create: [{ productId: product.id, quantity: 10, unitCost: 480, totalCost: entryTotal }] },
    },
  });
  await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      type: "ENTRY",
      direction: "IN",
      quantity: 10,
      unitCost: 480,
      balanceBefore: 0,
      balanceAfter: 10,
      reason: "Entrada por compra (NF NF-0001)",
      userId: admin.id,
      stockEntryId: entry.id,
      createdAt: openedAt,
    },
  });
  await prisma.accountPayable.create({
    data: {
      supplierId: supplier.id,
      stockEntryId: entry.id,
      description: "Compra de estoque — 10x ROD-FBW-1770 (NF NF-0001)",
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
      description: "Compra 10x ROD-FBW-1770 (NF NF-0001)",
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
      instagramHandle: "joao.civic",
      whatsapp: "(47) 98888-1234",
      acquisitionChannel: "SITE",
      ordersCount: 1,
      createdAt: soldAt,
    },
  });
  const total = 899 + 0; // frete grátis (>= 599)
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
      subtotal: 899,
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
            unitPrice: 899,
            unitCostAtSale: 480, // custo congelado
            total: 899,
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
      unitCost: 480,
      balanceBefore: 10,
      balanceAfter: 9,
      reason: "Venda PED-0001",
      orderId: order.id,
      createdAt: soldAt,
    },
  });
  await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: 9 } });
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
      subject: "Compatibilidade de roda",
      message: "A roda aro 17 5x100 serve no Golf 2015?",
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
