# FullBoost Race Parts — guia do projeto

E-commerce de peças de performance **+ painel de gestão** (produtos, estoque rastreável, vendas; financeiro/DRE no roadmap). Especificação em [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · **SQLite em dev/demo** (alvo de produção: PostgreSQL/Supabase — schema usa String no lugar de enums por compatibilidade SQLite; valores validados por Zod em `src/lib/validations.ts`) · Auth de sessão própria (JWT httpOnly + bcrypt, `src/lib/auth.ts`) · Zod · Playwright. Gerenciador: **npm**.

## Banco / demo
- `npx prisma migrate dev` + `npm run db:seed` criam tudo (arquivo `prisma/dev.db`, gitignored).
- Painel: `/admin/login` → `admin@fullboost.com.br` / `fullboost123` (seed).
- Imagens de produto: hotlinks Unsplash (`images.unsplash.com` liberado no `next.config.ts`).
- Logo oficial: `public/logo-fullboost.png` (o componente `Logo` usa com fallback para wordmark).

## Convenções
- **Tema:** claro + escuro com toggle (next-themes, default dark). Tokens da marca em `globals.css` (`--brand`, `bg-boost`/`text-boost` = gradiente, `bg-carbon`, `boost-glow`, `racing-rule`). Nunca cores fixas — sempre tokens. Títulos `font-display` (Chakra Petch), dados/preços/SKU `font-mono`.
- **Estrutura:**
  - `src/app/(public)` — loja · `src/app/admin` — painel (`admin/login` público; `admin/(panel)` com guard de sessão no layout)
  - `src/app/actions` — server actions (fronteira client→server; sempre Zod + `requireStaff()` nas de admin)
  - `src/server` — **regra de negócio** (catalog, products, inventory, orders, dashboard). Nunca espalhar regra nos componentes. Serviços retornam tipos JSON-safe (Decimal→number) de `src/types/store.ts`.
  - `src/components/{ui,public,admin,cart,shared}` — UI (ui = shadcn)
- **Páginas que leem o banco:** `export const dynamic = "force-dynamic"` (cadastro no painel aparece imediatamente na loja).
- **Validação dupla:** Zod no client e no server. **Idioma:** UI pt-BR; código em inglês.

## Regras de negócio (invariantes — não quebrar)
- `inventory_movements` é **append-only**; todo movimento grava `balanceBefore/After` e usuário; correção = novo lançamento de ajuste.
- Custo congelado: `order_items.unitCostAtSale` guarda o custo no momento da venda → CMV/lucro/DRE corretos.
- Venda exige estoque (validação dentro da transação); preços SEMPRE recalculados no servidor no checkout.
- Cancelamento/devolução repõe estoque via movimento `CUSTOMER_RETURN` + estorno no caixa.
- **Soft-delete** (status `INACTIVE`/`deletedAt`), nunca exclusão física. Estoque ≤ mínimo → alerta no dashboard.

## Comandos
```bash
npm run dev        # desenvolvimento (Turbopack)
npm run build      # build de produção (typecheck + lint)
npx prisma migrate dev · npm run db:seed · npm run db:studio
```
