/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function img(sku: string) {
  return `https://placehold.co/600x600/0a0a0a/e11d48/png?text=${encodeURIComponent(sku)}`;
}

/** Permissões do sistema. */
const PERMISSIONS: { key: string; description: string }[] = [
  { key: "dashboard.view", description: "Ver dashboard" },
  { key: "products.view", description: "Ver produtos" },
  { key: "products.manage", description: "Gerenciar produtos" },
  { key: "inventory.view", description: "Ver estoque" },
  { key: "inventory.manage", description: "Movimentar estoque" },
  { key: "orders.view", description: "Ver pedidos" },
  { key: "orders.manage", description: "Gerenciar pedidos" },
  { key: "customers.view", description: "Ver clientes" },
  { key: "customers.manage", description: "Gerenciar clientes" },
  { key: "suppliers.view", description: "Ver fornecedores" },
  { key: "suppliers.manage", description: "Gerenciar fornecedores" },
  { key: "promotions.manage", description: "Gerenciar promoções e cupons" },
  { key: "finance.view", description: "Ver financeiro e DRE" },
  { key: "finance.manage", description: "Gerenciar financeiro" },
  { key: "reports.view", description: "Ver relatórios" },
  { key: "users.manage", description: "Gerenciar usuários e permissões" },
  { key: "audit.view", description: "Ver auditoria" },
];

const ALL = PERMISSIONS.map((p) => p.key);
const ROLES: { name: string; slug: string; description: string; perms: string[] }[] = [
  { name: "Administrador", slug: "admin", description: "Acesso total", perms: ALL },
  {
    name: "Gerente",
    slug: "gerente",
    description: "Estoque, vendas e financeiro",
    perms: ALL.filter((k) => !["users.manage", "audit.view"].includes(k)),
  },
  {
    name: "Vendedor",
    slug: "vendedor",
    description: "Pedidos, clientes e produtos",
    perms: ["dashboard.view", "products.view", "orders.view", "orders.manage", "customers.view", "customers.manage"],
  },
  {
    name: "Estoquista",
    slug: "estoquista",
    description: "Entradas, saídas e inventário",
    perms: ["dashboard.view", "products.view", "inventory.view", "inventory.manage"],
  },
  {
    name: "Financeiro",
    slug: "financeiro",
    description: "Contas, fluxo de caixa e DRE",
    perms: ["dashboard.view", "finance.view", "finance.manage", "reports.view"],
  },
  { name: "Cliente", slug: "cliente", description: "Área de compra e seus pedidos", perms: [] },
];

const CATEGORIES = [
  { name: "Motor", slug: "motor" },
  { name: "Freios", slug: "freios" },
  { name: "Suspensão", slug: "suspensao" },
  { name: "Filtros", slug: "filtros" },
  { name: "Elétrica", slug: "eletrica" },
  { name: "Óleos e Fluidos", slug: "oleos" },
  { name: "Bateria", slug: "bateria" },
  { name: "Acessórios", slug: "acessorios" },
];

const BRANDS = ["Bosch", "NGK", "Cofap", "SKF", "Mahle", "Fram", "Varta"];

type ProductSeed = {
  sku: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  cost: number;
  sale: number;
  promo?: number;
  stock: number;
  min: number;
  status?: "ACTIVE" | "PROMOTION";
  originalCode?: string;
  app: { brand: string; model: string; yearStart?: number; yearEnd?: number };
};

const PRODUCTS: ProductSeed[] = [
  { sku: "PF-BOS-001", name: "Pastilha de Freio Dianteira", slug: "pastilha-de-freio-dianteira-bosch", category: "freios", brand: "Bosch", cost: 45, sale: 89.9, stock: 40, min: 10, originalCode: "BB1234", app: { brand: "Volkswagen", model: "Gol", yearStart: 2008, yearEnd: 2020 } },
  { sku: "DF-COF-002", name: "Disco de Freio Ventilado", slug: "disco-de-freio-ventilado-cofap", category: "freios", brand: "Cofap", cost: 90, sale: 179.9, stock: 18, min: 6, app: { brand: "Chevrolet", model: "Onix", yearStart: 2012, yearEnd: 2023 } },
  { sku: "FO-MAH-003", name: "Filtro de Óleo", slug: "filtro-de-oleo-mahle", category: "filtros", brand: "Mahle", cost: 12, sale: 29.9, stock: 120, min: 30, app: { brand: "Fiat", model: "Palio", yearStart: 2005, yearEnd: 2017 } },
  { sku: "FA-FRA-004", name: "Filtro de Ar do Motor", slug: "filtro-de-ar-do-motor-fram", category: "filtros", brand: "Fram", cost: 18, sale: 39.9, stock: 80, min: 20, app: { brand: "Volkswagen", model: "Polo", yearStart: 2018 } },
  { sku: "VI-NGK-005", name: "Vela de Ignição Iridium", slug: "vela-de-ignicao-iridium-ngk", category: "eletrica", brand: "NGK", cost: 15, sale: 34.9, promo: 27.9, stock: 200, min: 50, status: "PROMOTION", app: { brand: "Honda", model: "Civic", yearStart: 2012, yearEnd: 2022 } },
  { sku: "AM-COF-006", name: "Amortecedor Dianteiro", slug: "amortecedor-dianteiro-cofap", category: "suspensao", brand: "Cofap", cost: 130, sale: 259.9, stock: 12, min: 4, app: { brand: "Hyundai", model: "HB20", yearStart: 2013, yearEnd: 2023 } },
  { sku: "OL-MAH-007", name: "Óleo Motor 5W30 Sintético 1L", slug: "oleo-motor-5w30-sintetico-1l", category: "oleos", brand: "Mahle", cost: 22, sale: 44.9, stock: 150, min: 40, app: { brand: "Universal", model: "Flex" } },
  { sku: "BT-VAR-008", name: "Bateria 60Ah", slug: "bateria-60ah-varta", category: "bateria", brand: "Varta", cost: 280, sale: 459.9, stock: 8, min: 4, app: { brand: "Universal", model: "12V" } },
  { sku: "CD-BOS-009", name: "Correia Dentada", slug: "correia-dentada-bosch", category: "motor", brand: "Bosch", cost: 55, sale: 119.9, stock: 25, min: 8, app: { brand: "Ford", model: "Ka", yearStart: 2014, yearEnd: 2021 } },
  { sku: "BI-BOS-010", name: "Bobina de Ignição", slug: "bobina-de-ignicao-bosch", category: "eletrica", brand: "Bosch", cost: 95, sale: 189.9, stock: 6, min: 8, app: { brand: "Renault", model: "Sandero", yearStart: 2015, yearEnd: 2022 } },
];

async function wipe() {
  // Ordem reversa de dependência (seed re-executável).
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

  console.log("🔐 Permissões e papéis...");
  for (const p of PERMISSIONS) {
    await prisma.permission.create({ data: p });
  }
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

  console.log("👤 Usuário administrador...");
  await prisma.user.create({
    data: {
      email: "admin@diogenesautopecas.com.br",
      name: "Administrador",
      phone: "(47) 99999-0000",
      roleId: roleBySlug["admin"],
    },
  });

  console.log("🗂️  Categorias, marcas e fabricantes...");
  const catBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    catBySlug[c.slug] = cat.id;
  }
  const brandByName: Record<string, string> = {};
  for (const name of BRANDS) {
    const b = await prisma.brand.create({
      data: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
    brandByName[name] = b.id;
  }
  for (const name of ["Bosch", "NGK", "Cofap", "Mahle"]) {
    await prisma.manufacturer.create({
      data: { name, slug: `fab-${name.toLowerCase()}` },
    });
  }

  console.log("🔩 Produtos...");
  const productBySku: Record<string, { id: string; cost: number; sale: number }> = {};
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        originalCode: p.originalCode,
        categoryId: catBySlug[p.category],
        brandId: brandByName[p.brand],
        description: `${p.name} — peça de reposição com qualidade e garantia.`,
        technicalSpecs: "Especificações técnicas conforme fabricante.",
        costPrice: p.cost,
        salePrice: p.sale,
        promoPrice: p.promo ?? null,
        desiredMargin: 50,
        stockQuantity: p.stock,
        minStock: p.min,
        location: `Corredor ${p.category.slice(0, 1).toUpperCase()} / Prateleira ${Math.ceil(Math.random() * 9)}`,
        warranty: "3 meses contra defeitos de fabricação",
        status: (p.status ?? "ACTIVE") as any,
        images: {
          create: [{ url: img(p.sku), alt: p.name, isPrimary: true, position: 0 }],
        },
        applications: {
          create: [
            {
              vehicleBrand: p.app.brand,
              vehicleModel: p.app.model,
              yearStart: p.app.yearStart ?? null,
              yearEnd: p.app.yearEnd ?? null,
            },
          ],
        },
      },
    });
    productBySku[p.sku] = { id: product.id, cost: p.cost, sale: p.sale };
  }

  console.log("🏭 Fornecedores e clientes...");
  const supplier = await prisma.supplier.create({
    data: {
      legalName: "Auto Distribuidora Sul Ltda",
      tradeName: "AutoSul Peças",
      document: "12.345.678/0001-90",
      email: "compras@autosul.com.br",
      phone: "(47) 3333-1000",
      city: "Joinville",
      state: "SC",
      paymentTerms: "28/35/42 dias",
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      name: "João da Silva",
      document: "123.456.789-09",
      personType: "INDIVIDUAL",
      email: "joao.silva@email.com",
      phone: "(47) 98888-1234",
      addresses: {
        create: [
          {
            label: "Casa",
            zipCode: "89200-000",
            street: "Rua das Palmeiras",
            number: "123",
            district: "Centro",
            city: "Joinville",
            state: "SC",
            isDefault: true,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Oficina do Pedro ME",
      document: "98.765.432/0001-10",
      personType: "COMPANY",
      email: "contato@oficinadopedro.com.br",
      phone: "(47) 97777-4321",
    },
  });

  console.log("📦 Entrada de estoque + financeiro...");
  const entryItems = [
    { sku: "PF-BOS-001", qty: 30, cost: 45 },
    { sku: "FO-MAH-003", qty: 100, cost: 12 },
  ];
  const itemsTotal = entryItems.reduce((s, i) => s + i.qty * i.cost, 0);
  const freight = 80;
  const entry = await prisma.stockEntry.create({
    data: {
      supplierId: supplier.id,
      invoiceNumber: "NF-000123",
      purchaseDate: new Date(Date.now() - 7 * 864e5),
      entryDate: new Date(Date.now() - 6 * 864e5),
      freight,
      taxes: 0,
      itemsTotal,
      total: itemsTotal + freight,
      paymentMethod: "BOLETO",
      installments: 3,
      financialStatus: "OPEN",
      items: {
        create: entryItems.map((i) => ({
          productId: productBySku[i.sku].id,
          quantity: i.qty,
          unitCost: i.cost,
          totalCost: i.qty * i.cost,
        })),
      },
    },
  });

  for (const i of entryItems) {
    await prisma.inventoryMovement.create({
      data: {
        productId: productBySku[i.sku].id,
        type: "ENTRY",
        direction: "IN",
        quantity: i.qty,
        unitCost: i.cost,
        balanceBefore: 0,
        balanceAfter: i.qty,
        reason: "Entrada por compra (NF-000123)",
        stockEntryId: entry.id,
      },
    });
  }

  await prisma.accountPayable.create({
    data: {
      supplierId: supplier.id,
      stockEntryId: entry.id,
      description: "Compra de mercadorias — NF-000123",
      category: "Mercadorias",
      amount: itemsTotal + freight,
      dueDate: new Date(Date.now() + 22 * 864e5),
      status: "OPEN",
      paymentMethod: "BOLETO",
    },
  });

  console.log("🛒 Pedidos (com custo congelado)...");
  await createOrder({
    number: "PED-0001",
    customer: customer1,
    status: "PAID",
    method: "PIX",
    lines: [
      { sku: "PF-BOS-001", qty: 2 },
      { sku: "FO-MAH-003", qty: 1 },
    ],
    productBySku,
    daysAgo: 3,
    paid: true,
  });

  await createOrder({
    number: "PED-0002",
    customer: customer2,
    status: "DELIVERED",
    method: "CREDIT_CARD",
    lines: [{ sku: "BT-VAR-008", qty: 1 }],
    productBySku,
    daysAgo: 1,
    paid: true,
  });

  console.log("🏷️  Promoções e cupons...");
  await prisma.promotion.create({
    data: {
      name: "Vela de Ignição em oferta",
      scope: "PRODUCT",
      productId: productBySku["VI-NGK-005"].id,
      discountType: "FIXED",
      discountValue: 7,
      startsAt: new Date(Date.now() - 2 * 864e5),
      endsAt: new Date(Date.now() + 12 * 864e5),
      isActive: true,
    },
  });
  await prisma.coupon.create({
    data: {
      code: "BEMVINDO10",
      type: "PERCENT",
      value: 10,
      minOrderValue: 100,
      usageLimit: 100,
      isActive: true,
      startsAt: new Date(Date.now() - 5 * 864e5),
      endsAt: new Date(Date.now() + 30 * 864e5),
    },
  });

  console.log("✉️  Mensagem de contato + DRE exemplo...");
  await prisma.contactMessage.create({
    data: {
      name: "Carlos Mendes",
      email: "carlos@email.com",
      phone: "(47) 96666-0000",
      subject: "Disponibilidade de peça",
      message: "Vocês têm pastilha de freio para Corolla 2019?",
      status: "NEW",
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  await prisma.financialResult.create({
    data: {
      periodType: "MONTH",
      periodStart: monthStart,
      periodEnd: monthEnd,
      grossRevenue: 1500,
      discounts: 50,
      returns: 0,
      netRevenue: 1450,
      cogs: 460,
      grossProfit: 990,
      operatingExpenses: 200,
      adminExpenses: 150,
      salesExpenses: 80,
      financialExpenses: 30,
      operatingResult: 530,
      taxes: 120,
      netProfit: 410,
    },
  });

  console.log("✅ Seed concluído.");
}

type OrderArgs = {
  number: string;
  customer: { id: string; name: string; document: string | null };
  status: "PAID" | "DELIVERED";
  method: "PIX" | "CREDIT_CARD";
  lines: { sku: string; qty: number }[];
  productBySku: Record<string, { id: string; cost: number; sale: number }>;
  daysAgo: number;
  paid: boolean;
};

async function createOrder(a: OrderArgs) {
  const items = a.lines.map((l) => {
    const p = a.productBySku[l.sku];
    return {
      productId: p.id,
      sku: l.sku,
      qty: l.qty,
      unitPrice: p.sale,
      unitCost: p.cost, // CONGELADO no momento da venda
      total: p.sale * l.qty,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = subtotal;
  const createdAt = new Date(Date.now() - a.daysAgo * 864e5);

  const order = await prisma.order.create({
    data: {
      number: a.number,
      customerId: a.customer.id,
      customerName: a.customer.name,
      customerDocument: a.customer.document,
      status: a.status,
      subtotal,
      total,
      paymentMethod: a.method,
      createdAt,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          productName: PRODUCTS.find((p) => p.sku === i.sku)?.name ?? i.sku,
          sku: i.sku,
          quantity: i.qty,
          unitPrice: i.unitPrice,
          unitCostAtSale: i.unitCost,
          total: i.total,
        })),
      },
      statusHistory: {
        create: [{ status: a.status, note: "Pedido criado pelo seed" }],
      },
    },
  });

  // Saída de estoque (SALE) por item
  for (const i of items) {
    await prisma.inventoryMovement.create({
      data: {
        productId: i.productId,
        type: "SALE",
        direction: "OUT",
        quantity: i.qty,
        unitCost: i.unitCost,
        balanceBefore: 0,
        balanceAfter: 0,
        reason: `Venda ${a.number}`,
        orderId: order.id,
      },
    });
  }

  // Pagamento + recebível + fluxo de caixa
  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: total,
      method: a.method,
      status: a.paid ? "PAID" : "PENDING",
      paidAt: a.paid ? createdAt : null,
    },
  });
  await prisma.accountReceivable.create({
    data: {
      customerId: a.customer.id,
      orderId: order.id,
      description: `Recebimento ${a.number}`,
      amount: total,
      receivedAmount: a.paid ? total : 0,
      dueDate: createdAt,
      receivedAt: a.paid ? createdAt : null,
      status: a.paid ? "PAID" : "OPEN",
      paymentMethod: a.method,
    },
  });
  if (a.paid) {
    await prisma.cashFlowEntry.create({
      data: {
        type: "INFLOW",
        category: "Vendas",
        description: `Recebimento ${a.number}`,
        amount: total,
        date: createdAt,
        orderId: order.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
