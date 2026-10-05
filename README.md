# FullBoost Race Parts

E-commerce de **peças de tuning** (coroa e pinhão, virabrequins, gaiolas/rollcage — outras linhas aparecem quando forem anunciadas) com **painel administrativo real**: cadastro de peças publicado direto na loja, controle de estoque com movimentações rastreáveis (append-only), pedidos com baixa automática e custo congelado para lucro/DRE corretos.

![stack](https://img.shields.io/badge/Next.js%2016-black) ![stack](https://img.shields.io/badge/Prisma%20%2B%20SQLite%20%2F%20Postgres-2D3748) ![stack](https://img.shields.io/badge/Tailwind%20v4-38BDF8)

## 🚀 Rodando o projeto (zero configuração de nuvem)

```bash
# 1. Instalar dependências
npm install

# 2. Criar o banco local (SQLite) com a base mínima de demonstração
#    (1 exemplo de cada cadastro: produto, entrada, pedido, cliente, cupom...)
cp .env.example .env
npx prisma migrate dev
npm run db:seed

# 3. Rodar
npm run dev            # http://localhost:3000
```

> O banco é um arquivo SQLite local (`prisma/dev.db`) — quem clonar o repositório roda os comandos acima e tem a loja completa funcionando, sem contas externas. **Produção** roda em Postgres/Supabase com o schema gerado em `prisma/postgres/` — passo a passo em [`docs/DEPLOY.md`](docs/DEPLOY.md).

## 🔑 Painel administrativo (demo)

| | |
|---|---|
| URL | `http://localhost:3000/admin/login` |
| E-mail | `admin@fullboost.com.br` |
| Senha | `fullboost123` |

**Fluxo completo suportado:** cadastrar peça com fotos no painel → anúncio publicado na loja → cliente finaliza o pedido (peças **reservadas por 72h**) → pagamento combinado no **WhatsApp** (Pix ou link da maquininha) → painel marca **Pago** (baixa de estoque com movimento `SALE` e **custo congelado**) → separação/envio (cancelar/devolver **repõe o estoque**).

> ⚠️ Credenciais e dados são de demonstração (seed). Em produção o 1º admin é criado por `npm run db:bootstrap` e o servidor não sobe com `AUTH_SECRET`/WhatsApp de exemplo.

## 🧭 Mapa do sistema

**Loja** — `/` · `/produtos` (catálogo com filtros) · `/produtos/[slug]` · `/promocoes` (cupons ativos lidos do banco) · `/carrinho` · `/checkout` · `/pedido-confirmado` · `/sobre` · `/contato` (grava no painel) · `/privacidade` · `/termos` · `/sitemap.xml` · `/robots.txt`

**Painel** — `/admin` (dashboard com KPIs e alertas de estoque mínimo) · `/admin/produtos` (cadastro com fotos, publicado na loja) · `/admin/estoque` (entradas, saídas, ajustes e histórico) · `/admin/pedidos` (status, cancelamento com reposição de estoque) · `/admin/mensagens` (contatos do site) · `/admin/usuarios` (admin) · `/admin/conta` (trocar senha)

## 🧱 Stack e arquitetura

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 + shadcn/ui · Prisma (SQLite em dev; alvo Postgres/Supabase) · Zod (validação dupla client + server) · Auth de sessão própria (JWT httpOnly + bcrypt).

```
src/
├─ app/(public)/    loja (tema escuro/claro com toggle)
├─ app/admin/       painel (login + (panel) protegido por sessão)
├─ app/actions/     server actions (auth, admin, checkout)
├─ server/          REGRA DE NEGÓCIO (catalog, products, inventory, orders, dashboard)
├─ components/      ui (shadcn) · public · admin · cart · shared
└─ lib/             prisma · auth · validations (zod) · utils · constants
prisma/             schema · migrations · seed (catálogo FullBoost com imagens reais)
```

### Invariantes de negócio (não quebrar)
- `inventory_movements` é **append-only**: correção = novo lançamento de ajuste; todo movimento grava saldo anterior/posterior e usuário.
- `order_items.unit_cost_at_sale` **congela o custo** no momento da venda → CMV/lucro/DRE corretos.
- Venda exige estoque (validado em transação); cancelamento/devolução **repõe** via movimento.
- **Soft-delete** em dados críticos (produto inativo continua no histórico).
- Estoque ≤ mínimo → alerta no dashboard.

## 📸 Screenshots

| Loja | Painel |
|---|---|
| ![Home](docs/screenshots/01-home-dark.jpeg) | ![Dashboard](docs/screenshots/08-admin-dashboard.jpeg) |
| ![Catálogo](docs/screenshots/02-produtos-dark.jpeg) | ![Estoque](docs/screenshots/11-admin-estoque.jpeg) |

Mais em [`docs/screenshots/`](docs/screenshots/).

## 🖼️ Marca

A logo oficial deve ficar em `public/logo-fullboost.png` — o header a exibe automaticamente no canto superior esquerdo (com fallback para o wordmark tipográfico). Imagens de produtos do seed são hotlinks do Unsplash (licença livre).

## Roadmap
✅ Loja completa + painel (produtos/estoque/pedidos) · 🔜 Financeiro completo (contas a pagar/receber, fluxo de caixa, tela de DRE) · 🔜 Clientes/fornecedores no painel · 🔜 Auth de clientes na loja · 🔜 Testes Playwright automatizados · 🔜 Migração Supabase/Postgres para produção.
