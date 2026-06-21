# Diógenes Auto Peças

Sistema completo de **e-commerce de peças mecânicas + ERP de gestão**: loja online (catálogo, carrinho, checkout) e painel administrativo com estoque rastreável, vendas, compras, financeiro e **DRE gerencial**.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · PostgreSQL (Supabase) · Supabase Auth + Storage · Zod · Playwright.

## Começando

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env   # preencha com as chaves do Supabase

# 3. Banco de dados (após configurar DATABASE_URL)
npx prisma migrate dev
npm run db:seed

# 4. Rodar em desenvolvimento
npm run dev            # http://localhost:3000
```

## Estrutura

```
src/
├─ app/
│  ├─ (public)/   loja pública (tema escuro)
│  ├─ (admin)/    painel administrativo (tema claro)
│  └─ api/        route handlers
├─ components/    ui (shadcn) · public · admin · shared
├─ server/        regra de negócio (estoque, vendas, financeiro, dre)
└─ lib/           prisma · supabase · validations (zod) · utils · constants
prisma/           schema · migrations · seed
tests/            Playwright (e2e)
docs/             ESPECIFICACAO.md (fonte da verdade)
```

## Roadmap
F0 Fundação ✅ · F1 Banco · F2 Auth/permissões · F3 Loja pública · F4 Admin core · F5 Estoque · F6 Vendas · F7 Financeiro/DRE · F8 Promoções/Relatórios · F9 Testes.

Veja [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md) para o detalhamento completo.
