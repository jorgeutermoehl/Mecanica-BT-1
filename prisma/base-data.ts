/**
 * Dados estruturais da loja (papéis, permissões e categorias) — compartilhados
 * pelo seed de demonstração e pelo bootstrap de produção (sem wipe).
 */

export const PERMISSIONS = [
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

export const ROLES = [
  { name: "Administrador", slug: "admin", description: "Acesso total", perms: PERMISSIONS.map((p) => p.key) },
  { name: "Gerente", slug: "gerente", description: "Estoque, vendas e financeiro", perms: ["dashboard.view", "products.manage", "inventory.manage", "orders.manage", "customers.manage", "suppliers.manage", "promotions.manage", "finance.manage", "reports.view"] },
  { name: "Vendedor", slug: "vendedor", description: "Pedidos, clientes e produtos", perms: ["dashboard.view", "orders.manage", "customers.manage"] },
  { name: "Estoquista", slug: "estoquista", description: "Entradas, saídas e inventário", perms: ["dashboard.view", "inventory.manage"] },
  { name: "Financeiro", slug: "financeiro", description: "Contas, caixa e DRE", perms: ["dashboard.view", "finance.manage", "reports.view"] },
  { name: "Cliente", slug: "cliente", description: "Área de compra", perms: [] as string[] },
];

/**
 * Categorias estruturais. A loja só EXIBE as que têm produto publicado
 * (getStoreCategories) — as linhas que ainda não anunciamos ficam cadastradas
 * e "desbloqueiam" sozinhas no 1º anúncio. Foco atual: transmissão, motor, gaiolas.
 */
export type CategorySeed = {
  name: string;
  slug: string;
  icon: string;
  featured: boolean;
  position: number;
  description: string;
  /** true = categoria desativada (soft-delete): some da loja e do painel. */
  disabled?: boolean;
};

export const CATEGORIES: CategorySeed[] = [
  { name: "Transmissão", slug: "transmissao", icon: "transmissao", featured: true, position: 0, description: "Coroa e pinhão, relações curtas e longas e componentes de câmbio para rua, arrancada e pista." },
  { name: "Motor", slug: "motor", icon: "motor", featured: false, position: 1, description: "Virabrequins, internos e componentes de motor — da linha a ar ao AP." },
  { name: "Gaiolas & Segurança", slug: "gaiolas", icon: "gaiolas", featured: false, position: 2, description: "Gaiolas de proteção (rollcage) sob medida para carros de rua ou pista, com ou sem bancos traseiros." },
  // Linhas ainda não anunciadas — ocultas na loja até o primeiro produto.
  { name: "Turbo & Boost", slug: "turbo", icon: "turbo", featured: false, position: 10, description: "Turbinas, wastegates, intercoolers e tudo para pressão de verdade." },
  { name: "Escape", slug: "escape", icon: "escape", featured: false, position: 11, description: "Sistemas cat-back, downpipes e ponteiras em inox." },
  { name: "Freios", slug: "freios", icon: "freios", featured: false, position: 12, description: "Kits big brake, discos e pastilhas de alta performance." },
  { name: "Suspensão", slug: "suspensao", icon: "suspensao", featured: false, position: 13, description: "Coilovers, amortecedores e acerto de altura com segurança." },
  // Desativada por decisão da loja (não vende rodas/pneus): fica fora da loja
  // e do cadastro do painel mesmo que um produto antigo aponte para ela.
  { name: "Rodas & Pneus", slug: "rodas", icon: "rodas", featured: false, position: 14, description: "Rodas esportivas, forjadas e réplicas nos principais furações e aros.", disabled: true },
  { name: "Admissão & Filtros", slug: "filtros", icon: "filtros", featured: false, position: 15, description: "Filtros esportivos e kits de admissão para respirar melhor." },
  { name: "Elétrica & Ignição", slug: "eletrica", icon: "eletrica", featured: false, position: 16, description: "Velas, bobinas e baterias para ignição sem falhas." },
  { name: "Óleos & Fluidos", slug: "oleos", icon: "oleos", featured: false, position: 17, description: "Lubrificantes sintéticos e fluidos racing." },
];
