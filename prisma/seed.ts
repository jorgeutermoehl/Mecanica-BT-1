import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Credenciais demo do painel (documentadas no README). */
const ADMIN_EMAIL = "admin@fullboost.com.br";
const ADMIN_PASSWORD = "fullboost123";

const img = (id: string) => `https://images.unsplash.com/${id}?q=80&w=900&auto=format&fit=crop`;

// ===========================================================================
// Dados
// ===========================================================================

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
  image: string;
  fitment: string;
  originalCode?: string;
  description: string;
  specs: string;
  app: { brand: string; model: string; yearStart?: number; yearEnd?: number; engine?: string };
};

const PRODUCTS: ProductSeed[] = [
  // ------ RODAS (destaque da loja) ------
  { sku: "ROD-FBW-1770", name: "Roda Esportiva Aro 17 5x100 Preto Fosco", slug: "roda-esportiva-aro-17-5x100", category: "rodas", brand: "FB Wheels", cost: 480, sale: 899, promo: 799, stock: 24, min: 8, image: img("photo-1542377281-73d08e3a10aa"), fitment: "5x100 · ET38 · Aro 17x7", description: "Roda esportiva em liga leve com acabamento preto fosco e design multi-spoke. Leveza e resistência para uso em rua e track day.", specs: "Aro: 17x7\" | Furação: 5x100 | ET: 38 | CB: 57,1mm | Peso: 8,4kg | Liga de alumínio A356", app: { brand: "Volkswagen", model: "Golf", yearStart: 2008, yearEnd: 2020 } },
  { sku: "ROD-ENK-1885", name: "Roda Forjada Aro 18 5x112 Gunmetal", slug: "roda-forjada-aro-18-5x112", category: "rodas", brand: "Enkei", cost: 1150, sale: 2190, stock: 16, min: 4, image: img("photo-1611633235555-45e252fe48c8"), fitment: "5x112 · ET42 · Aro 18x8", description: "Roda forjada ultraleve com acabamento gunmetal. Processo de forjamento MAT reduz peso não suspenso e melhora resposta da direção.", specs: "Aro: 18x8\" | Furação: 5x112 | ET: 42 | CB: 66,6mm | Peso: 7,9kg | Forjada", app: { brand: "Audi", model: "A3 / S3", yearStart: 2013, yearEnd: 2024 } },
  { sku: "ROD-BBS-2090", name: "Roda Aro 20 5x114 Gloss Black Machined", slug: "roda-aro-20-5x114-gloss-black", category: "rodas", brand: "BBS", cost: 1650, sale: 3290, promo: 2890, stock: 8, min: 4, image: img("photo-1594500067480-fedcbb960b73"), fitment: "5x114,3 · ET45 · Aro 20x8,5", description: "Roda aro 20 com face diamantada e verniz de alta resistência. Presença de show car com engenharia de pista.", specs: "Aro: 20x8,5\" | Furação: 5x114,3 | ET: 45 | CB: 73,1mm | Peso: 11,2kg", app: { brand: "Honda", model: "Civic / Accord", yearStart: 2016 } },
  { sku: "ROD-VLC-1554", name: "Roda Aro 15 4x100 Tala Larga Prata", slug: "roda-aro-15-4x100-tala-larga", category: "rodas", brand: "Volcano", cost: 340, sale: 649, stock: 32, min: 8, image: img("photo-1623564493214-6137dff043ad"), fitment: "4x100 · ET25 · Aro 15x7", description: "Tala larga clássica para projetos old school e hot hatches. Acabamento prata com borda polida.", specs: "Aro: 15x7\" | Furação: 4x100 | ET: 25 | CB: 60,1mm", app: { brand: "Volkswagen", model: "Gol / Saveiro", yearStart: 1995, yearEnd: 2022 } },
  { sku: "ROD-FBW-1795", name: "Jogo de Rodas Aro 17 5x108 com Bicos", slug: "jogo-rodas-aro-17-5x108", category: "rodas", brand: "FB Wheels", cost: 1750, sale: 3390, promo: 2990, stock: 6, min: 2, image: img("photo-1611633859589-7990d2fbb56b"), fitment: "5x108 · ET40 · Jogo com 4", description: "Jogo completo com 4 rodas aro 17, bicos e porcas inclusos. Pronto para instalar e acelerar.", specs: "Aro: 17x7,5\" | Furação: 5x108 | ET: 40 | CB: 63,4mm | Jogo com 4 rodas + bicos", app: { brand: "Ford", model: "Focus", yearStart: 2014, yearEnd: 2019 } },
  { sku: "ROD-KRM-1860", name: "Roda Réplica Aro 18 5x120 Grafite", slug: "roda-replica-aro-18-5x120-grafite", category: "rodas", brand: "Krmai", cost: 620, sale: 1190, stock: 20, min: 6, image: img("photo-1668639235092-301730d1b72e"), fitment: "5x120 · ET35 · Aro 18x8", description: "Réplica premium com acabamento grafite fosco, balanceamento de fábrica e certificação Inmetro.", specs: "Aro: 18x8\" | Furação: 5x120 | ET: 35 | CB: 72,6mm | Certificada Inmetro", app: { brand: "BMW", model: "Série 3", yearStart: 2012, yearEnd: 2021 } },

  // ------ TURBO ------
  { sku: "TRB-GRT-045", name: "Turbina Billet .50 Anti-lag", slug: "turbina-billet-050-antilag", category: "turbo", brand: "Garrett", cost: 2280, sale: 3890, promo: 3490, stock: 6, min: 2, image: img("photo-1591879742348-13012c2963bf"), fitment: "Universal · até 450cv", originalCode: "GT2860RS", description: "Turbina com rotor billet usinado em CNC, mancal duplo de esferas e resposta agressiva. Suporta até 450cv com confiabilidade.", specs: "Rotor: billet .50 | Mancal: dual ball bearing | Pressão máx.: 1,8 bar | Refrigeração: água + óleo", app: { brand: "Universal", model: "até 450cv" } },
  { sku: "TRB-GRT-600", name: "Intercooler Frontal Race 600x300x76", slug: "intercooler-frontal-race-600x300", category: "turbo", brand: "Garrett", cost: 720, sale: 1290, stock: 14, min: 4, image: img("photo-1661303685671-65771329fc63"), fitment: "Universal · núcleo 76mm", description: "Intercooler frontal bar-and-plate de alta eficiência térmica para carros turbo de rua e pista.", specs: "Núcleo: 600x300x76mm | Bocais: 3\" | Construção: bar-and-plate | Queda de pressão < 0,2 psi", app: { brand: "Universal", model: "Projetos turbo" } },
  { sku: "TRB-WST-044", name: "Wastegate Externa 44mm V-band", slug: "wastegate-externa-44mm", category: "turbo", brand: "Garrett", cost: 520, sale: 890, stock: 11, min: 4, image: img("photo-1694160027547-b0696cf1ad45"), fitment: "Universal · V-band 44mm", description: "Wastegate externa 44mm com diafragma de silicone e molas intercambiáveis para controle preciso de boost.", specs: "Diâmetro: 44mm | Fixação: V-band | Molas: 0,5 / 0,8 / 1,0 bar inclusas", app: { brand: "Universal", model: "Projetos turbo" } },

  // ------ MOTOR ------
  { sku: "MOT-MAH-820", name: "Kit Pistões Forjados 82mm CR 8.5:1", slug: "kit-pistoes-forjados-82mm", category: "motor", brand: "Mahle", cost: 1480, sale: 2590, stock: 7, min: 2, image: img("photo-1608834951273-eac269926962"), fitment: "1.8T / 2.0 · jogo com 4", description: "Pistões forjados em liga 4032 com coating anti-fricção. Preparados para alta pressão de turbo.", specs: "Diâmetro: 82mm | CR: 8.5:1 | Liga: 4032 | Jogo com 4 pistões + anéis + pinos", app: { brand: "Volkswagen", model: "1.8T / 2.0 TSI", engine: "EA113/EA888" } },
  { sku: "MOT-SCH-410", name: "Kit Embreagem Reforçada Cerâmica", slug: "kit-embreagem-reforcada-ceramica", category: "motor", brand: "Sachs", cost: 980, sale: 1780, promo: 1590, stock: 8, min: 3, image: img("photo-1725289339928-06ee31684df5"), fitment: "1.8T / 2.0 TSI", description: "Embreagem cerâmica de 6 pastilhas com platô reforçado. Segura até 500Nm sem patinar.", specs: "Disco: cerâmico 6 pastilhas | Torque máx.: 500Nm | Inclui rolamento", app: { brand: "Volkswagen", model: "Golf GTI / Jetta", yearStart: 2008 } },
  { sku: "MOT-BSH-550", name: "Bico Injetor Alta Vazão 550cc (jogo c/ 4)", slug: "bico-injetor-alta-vazao-550cc", category: "motor", brand: "Bosch", cost: 190, sale: 320, stock: 40, min: 12, image: img("photo-1527383418406-f85a3b146499"), fitment: "Jogo com 4 · EV14", originalCode: "0280158117", description: "Bicos injetores de alta vazão 550cc/min padrão EV14, ideais para remap com etanol.", specs: "Vazão: 550cc/min @ 3 bar | Conector: EV14 | Impedância: alta (12Ω)", app: { brand: "Universal", model: "Multiaplicação" } },

  // ------ ESCAPE ------
  { sku: "ESC-INX-300", name: "Escape Esportivo Inox 3\" Cat-back", slug: "escape-esportivo-inox-3-catback", category: "escape", brand: "Cofap", cost: 1180, sale: 2150, promo: 1899, stock: 9, min: 3, image: img("photo-1556783151-c6d5e7d296bb"), fitment: "Golf GTI Mk7", description: "Sistema cat-back completo em inox 304 com abafador esportivo. Ronco encorpado sem drone na rodovia.", specs: "Diâmetro: 3\" | Material: inox 304 | Inclui abafador + ponteiras duplas", app: { brand: "Volkswagen", model: "Golf GTI Mk7", yearStart: 2014, yearEnd: 2020 } },
  { sku: "ESC-INX-102", name: "Ponteira Dupla Inox Corte Diagonal", slug: "ponteira-dupla-inox-corte-diagonal", category: "escape", brand: "Cofap", cost: 95, sale: 189, stock: 35, min: 10, image: img("photo-1619255566224-fca5ef4ca1be"), fitment: "Encaixe 2\" a 2,5\"", description: "Ponteira dupla em inox polido com corte diagonal. Instalação por abraçadeira, sem solda.", specs: "Entrada: 2\"-2,5\" | Saída: dupla 89mm | Material: inox 304 polido", app: { brand: "Universal", model: "Multiaplicação" } },

  // ------ FREIOS ------
  { sku: "FRE-BRB-201", name: "Kit Big Brake 4 Pistões Aro 17+", slug: "kit-big-brake-4-pistoes", category: "freios", brand: "Brembo", cost: 3980, sale: 6890, stock: 3, min: 2, image: img("photo-1613214150384-14921ff659b2"), fitment: "Universal · aro 17+", description: "Kit big brake com pinças de 4 pistões, discos ventilados de 330mm e pastilhas de alta temperatura.", specs: "Pinças: 4 pistões | Discos: 330x28mm ventilados | Pastilhas high-temp | Flexíveis aeroquip", app: { brand: "Universal", model: "Aro 17 ou maior" } },
  { sku: "FRE-CFP-330", name: "Disco de Freio Ventilado 330mm (par)", slug: "disco-freio-ventilado-330mm", category: "freios", brand: "Cofap", cost: 320, sale: 589, stock: 18, min: 6, image: img("photo-1609682932589-5ef2bd85980d"), fitment: "Civic Si / Type R", description: "Par de discos ventilados 330mm balanceados, com tratamento anticorrosivo.", specs: "Diâmetro: 330mm | Espessura: 28mm | Ventilados | Par", app: { brand: "Honda", model: "Civic Si", yearStart: 2017 } },

  // ------ SUSPENSÃO ------
  { sku: "SUS-SCH-334", name: "Kit Coilover Rosca Regulável", slug: "kit-coilover-rosca-regulavel", category: "suspensao", brand: "Sachs", cost: 2450, sale: 4200, stock: 5, min: 2, image: img("photo-1669136048337-5daa3adef7b2"), fitment: "Civic Si / Type R", description: "Coilover com regulagem de altura e carga, 32 níveis de amortecimento. Acerto para rua e track day.", specs: "Regulagem: altura + 32 cliques | Molas: 8k/6k | Camber plate incluso", app: { brand: "Honda", model: "Civic Si / Type R", yearStart: 2016 } },
  { sku: "SUS-CFP-118", name: "Par Amortecedores Esportivos Pressurizados", slug: "par-amortecedores-esportivos", category: "suspensao", brand: "Cofap", cost: 380, sale: 690, stock: 12, min: 4, image: img("photo-1640021042525-5610f9f75444"), fitment: "HB20 / Onix", description: "Amortecedores esportivos pressurizados com válvulas recalibradas para menos rolagem.", specs: "Tipo: pressurizado | Dianteiro | Par", app: { brand: "Hyundai", model: "HB20", yearStart: 2013 } },

  // ------ FILTROS ------
  { sku: "ADM-KN-076", name: "Filtro de Ar Esportivo Cônico 76mm", slug: "filtro-ar-esportivo-conico", category: "filtros", brand: "K&N", cost: 145, sale: 249, stock: 64, min: 20, image: img("photo-1588294020274-1e23a4815b72"), fitment: "Entrada 76mm", description: "Filtro cônico lavável de fluxo duplo. Mais ar, mais ronco de admissão, filtragem garantida.", specs: "Entrada: 76mm | Lavável e reutilizável | Fluxo duplo", app: { brand: "Universal", model: "Entrada 76mm" } },
  { sku: "ADM-MAH-210", name: "Filtro de Ar Inbox Esportivo", slug: "filtro-ar-inbox-esportivo", category: "filtros", brand: "Mahle", cost: 85, sale: 159, promo: 129, stock: 48, min: 15, image: img("photo-1522598140461-ec9911e01c53"), fitment: "Golf / Polo / Virtus", description: "Elemento esportivo que substitui o filtro original na caixa. Ganho de fluxo sem alterar a admissão.", specs: "Encaixe: caixa original | Lavável | Ganho de fluxo ~15%", app: { brand: "Volkswagen", model: "Polo / Virtus", yearStart: 2018 } },

  // ------ ELÉTRICA ------
  { sku: "IGN-NGK-777", name: "Vela de Ignição Iridium Racing (unidade)", slug: "vela-ignicao-iridium-racing", category: "eletrica", brand: "NGK", cost: 38, sale: 79.9, promo: 59.9, stock: 120, min: 40, image: img("photo-1710130168142-d2ec07ed8434"), fitment: "Multiaplicação · grau 8", originalCode: "R7437-8", description: "Vela iridium racing grau 8 para motores turbo de alta carga. Centro de irídio de 0,6mm.", specs: "Eletrodo: irídio 0,6mm | Grau térmico: 8 | Rosca: M14x1.25", app: { brand: "Universal", model: "Motores turbo" } },
  { sku: "BAT-VAR-060", name: "Bateria Performance 60Ah Selada", slug: "bateria-performance-60ah", category: "eletrica", brand: "Varta", cost: 310, sale: 559.9, stock: 9, min: 4, image: img("photo-1592318348310-f31b61a931c8"), fitment: "Universal 12V", description: "Bateria selada livre de manutenção com alta corrente de partida (CCA 540A).", specs: "Capacidade: 60Ah | CCA: 540A | Polaridade: direita | Selada", app: { brand: "Universal", model: "12V" } },

  // ------ ÓLEOS ------
  { sku: "OIL-MTL-540", name: "Óleo Sintético 5W40 Racing 1L", slug: "oleo-sintetico-5w40-racing-1l", category: "oleos", brand: "Motul", cost: 32, sale: 64.9, promo: 49.9, stock: 200, min: 60, image: img("photo-1590227763209-821c686b932f"), fitment: "Alta performance", description: "Lubrificante 100% sintético com ésteres para motores de alta performance aspirados e turbo.", specs: "Viscosidade: 5W40 | Base: éster 100% sintético | API SN/CF", app: { brand: "Universal", model: "Alta performance" } },
  { sku: "OIL-MTL-1060", name: "Óleo 10W60 Competição 1L", slug: "oleo-10w60-competicao-1l", category: "oleos", brand: "Motul", cost: 48, sale: 89.9, stock: 90, min: 30, image: img("photo-1567016958860-87d898933af1"), fitment: "Track day / competição", description: "Óleo de competição 10W60 para uso severo em pista, proteção extrema em alta temperatura.", specs: "Viscosidade: 10W60 | Uso: competição | Proteção térmica extrema", app: { brand: "Universal", model: "Competição" } },
];

// ===========================================================================
// Execução
// ===========================================================================

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

  console.log("🔐 Papéis, permissões e usuários...");
  for (const p of PERMISSIONS) await prisma.permission.create({ data: p });
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
    data: {
      email: "vendedor@fullboost.com.br",
      name: "Carlos Vendas",
      passwordHash,
      roleId: roleBySlug["vendedor"],
    },
  });

  console.log("🗂️  Categorias e marcas...");
  const catBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    catBySlug[c.slug] = cat.id;
  }
  const brandNames = [...new Set(PRODUCTS.map((p) => p.brand))];
  const brandByName: Record<string, string> = {};
  for (const name of brandNames) {
    const b = await prisma.brand.create({
      data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    });
    brandByName[name] = b.id;
  }

  console.log(`🔩 ${PRODUCTS.length} produtos (com imagens reais)...`);
  const productBySku: Record<string, { id: string; cost: number; sale: number; promo?: number; stock: number; name: string }> = {};
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        originalCode: p.originalCode ?? null,
        categoryId: catBySlug[p.category],
        brandId: brandByName[p.brand],
        description: p.description,
        technicalSpecs: p.specs,
        fitment: p.fitment,
        costPrice: p.cost,
        salePrice: p.sale,
        promoPrice: p.promo ?? null,
        desiredMargin: 50,
        stockQuantity: p.stock,
        minStock: p.min,
        location: `Corredor ${p.category.slice(0, 1).toUpperCase()}`,
        warranty: "12 meses contra defeitos de fabricação",
        status: p.promo ? "PROMOTION" : "ACTIVE",
        images: { create: [{ url: p.image, alt: p.name, isPrimary: true, position: 0 }] },
        applications: {
          create: [
            {
              vehicleBrand: p.app.brand,
              vehicleModel: p.app.model,
              yearStart: p.app.yearStart ?? null,
              yearEnd: p.app.yearEnd ?? null,
              engine: p.app.engine ?? null,
            },
          ],
        },
      },
    });
    productBySku[p.sku] = { id: product.id, cost: p.cost, sale: p.sale, promo: p.promo, stock: p.stock, name: p.name };

    // Abertura de estoque no ledger (0 → saldo inicial), auditável.
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "ENTRY",
        direction: "IN",
        quantity: p.stock,
        unitCost: p.cost,
        balanceBefore: 0,
        balanceAfter: p.stock,
        reason: "Abertura de estoque (seed)",
        userId: admin.id,
      },
    });
  }

  console.log("🏭 Fornecedor e clientes...");
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
  await prisma.accountPayable.create({
    data: {
      supplierId: supplier.id,
      description: "Reposição de rodas e turbinas — NF-4411",
      category: "Mercadorias",
      amount: 18400,
      dueDate: new Date(Date.now() + 20 * 864e5),
      status: "OPEN",
      paymentMethod: "BOLETO",
    },
  });

  const joao = await prisma.customer.create({
    data: {
      name: "João da Silva",
      document: "123.456.789-09",
      personType: "INDIVIDUAL",
      email: "joao.silva@email.com",
      phone: "(47) 98888-1234",
    },
  });
  const oficina = await prisma.customer.create({
    data: {
      name: "Oficina do Pedro ME",
      document: "98.765.432/0001-10",
      personType: "COMPANY",
      email: "contato@oficinadopedro.com.br",
      phone: "(47) 97777-4321",
    },
  });

  console.log("🛒 Pedidos demo (custo congelado + baixa no ledger)...");
  // PED-0001: João — 4x vela + 1x filtro cônico (PIX, pago, entregue)
  await seedOrder({
    number: "PED-0001",
    customer: joao,
    status: "DELIVERED",
    method: "PIX",
    daysAgo: 6,
    items: [
      { sku: "IGN-NGK-777", qty: 4 },
      { sku: "ADM-KN-076", qty: 1 },
    ],
    adminId: admin.id,
    productBySku,
  });
  // PED-0002: Oficina — 4x roda forjada aro 18 (cartão, pago)
  await seedOrder({
    number: "PED-0002",
    customer: oficina,
    status: "PAID",
    method: "CREDIT_CARD",
    daysAgo: 1,
    items: [{ sku: "ROD-ENK-1885", qty: 4 }],
    adminId: admin.id,
    productBySku,
  });

  console.log("🏷️  Cupons e mensagem de contato...");
  await prisma.coupon.createMany({
    data: [
      { code: "BEMVINDO10", type: "PERCENT", value: 10, minOrderValue: 100, usageLimit: 200, isActive: true },
      { code: "TURBO15", type: "PERCENT", value: 15, minOrderValue: 500, usageLimit: 100, isActive: true },
      { code: "NITRO50", type: "FIXED", value: 50, minOrderValue: 300, usageLimit: 100, isActive: true },
    ],
  });
  await prisma.contactMessage.create({
    data: {
      name: "Carlos Mendes",
      email: "carlos@email.com",
      phone: "(47) 96666-0000",
      subject: "Compatibilidade de roda",
      message: "A roda forjada aro 18 5x112 serve no Jetta 2019?",
      status: "NEW",
    },
  });

  console.log("✅ Seed concluído.");
  console.log(`   Painel: /admin/login → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

type SeedOrderArgs = {
  number: string;
  customer: { id: string; name: string; document: string | null; email: string | null; phone: string | null };
  status: string;
  method: string;
  daysAgo: number;
  items: { sku: string; qty: number }[];
  adminId: string;
  productBySku: Record<string, { id: string; cost: number; sale: number; promo?: number; stock: number; name: string }>;
};

async function seedOrder(a: SeedOrderArgs) {
  const createdAt = new Date(Date.now() - a.daysAgo * 864e5);
  const lines = a.items.map((i) => {
    const p = a.productBySku[i.sku];
    const unitPrice = p.promo ?? p.sale;
    return { ...i, p, unitPrice, total: unitPrice * i.qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const shipping = subtotal >= 599 ? 0 : 34.9;
  const total = subtotal + shipping;

  const order = await prisma.order.create({
    data: {
      number: a.number,
      customerId: a.customer.id,
      customerName: a.customer.name,
      customerDocument: a.customer.document,
      customerEmail: a.customer.email,
      customerPhone: a.customer.phone,
      status: a.status,
      subtotal,
      shippingCost: shipping,
      total,
      paymentMethod: a.method,
      shipZipCode: "89200-000",
      shipStreet: "Rua das Palmeiras",
      shipNumber: "123",
      shipCity: "Joinville",
      shipState: "SC",
      createdAt,
      items: {
        create: lines.map((l) => ({
          productId: l.p.id,
          productName: l.p.name,
          sku: l.sku,
          quantity: l.qty,
          unitPrice: l.unitPrice,
          unitCostAtSale: l.p.cost, // custo congelado
          total: l.total,
        })),
      },
      statusHistory: { create: [{ status: a.status, note: "Pedido demo (seed)" }] },
    },
  });

  // Baixa no ledger + saldo do produto.
  for (const l of lines) {
    const before = l.p.stock;
    const after = before - l.qty;
    l.p.stock = after;
    await prisma.inventoryMovement.create({
      data: {
        productId: l.p.id,
        type: "SALE",
        direction: "OUT",
        quantity: l.qty,
        unitCost: l.p.cost,
        balanceBefore: before,
        balanceAfter: after,
        reason: `Venda ${a.number}`,
        orderId: order.id,
        createdAt,
      },
    });
    await prisma.product.update({ where: { id: l.p.id }, data: { stockQuantity: after } });
  }

  await prisma.payment.create({
    data: { orderId: order.id, amount: total, method: a.method, status: "PAID", paidAt: createdAt },
  });
  await prisma.accountReceivable.create({
    data: {
      customerId: a.customer.id,
      orderId: order.id,
      description: `Recebimento ${a.number}`,
      amount: total,
      receivedAmount: total,
      dueDate: createdAt,
      receivedAt: createdAt,
      status: "PAID",
      paymentMethod: a.method,
    },
  });
  await prisma.cashFlowEntry.create({
    data: { type: "INFLOW", category: "Vendas", description: `Recebimento ${a.number}`, amount: total, orderId: order.id, date: createdAt },
  });
  await prisma.customer.update({
    where: { id: a.customer.id },
    data: { totalSpent: { increment: total }, lastPurchaseAt: createdAt },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
