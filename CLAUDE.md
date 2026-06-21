# Diógenes Auto Peças — guia do projeto

E-commerce de peças mecânicas **+ ERP de gestão** (estoque rastreável, vendas, compras, financeiro, DRE). Especificação completa em [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · PostgreSQL (Supabase) · Supabase Auth + Storage · Zod · Playwright. Gerenciador: **npm**.

## Convenções
- **Tema:** loja pública = tema **escuro** (grupo `(public)` envolto em `.dark`); admin = tema **claro** com sidebar preta. Vermelho (`--primary`/`brand`) = ações/promoções/alertas. Use tokens (`bg-primary`, `text-muted-foreground`, `bg-success`…), nunca cores fixas como `bg-red-600`.
- **Estrutura:**
  - `src/app/(public)` — loja · `src/app/(admin)/admin` — painel · `src/app/api` — route handlers
  - `src/components/{ui,public,admin,shared}` — UI (ui = shadcn)
  - `src/server` — **regra de negócio** (estoque, vendas, financeiro, DRE). Nunca espalhar regra nos componentes.
  - `src/lib` — `prisma`, `supabase`, `validations` (Zod), `utils`, `constants`
- **Validação dupla:** Zod no client e no server.
- **Idioma:** UI e textos em **pt-BR**; código/identificadores em inglês.

## Regras de negócio (invariantes — não quebrar)
- Custo congelado: `order_items.unit_cost_at_sale` guarda o custo no momento da venda → DRE/CMV corretos.
- `inventory_movements` e `audit_logs` são **append-only**; correção = novo lançamento de ajuste.
- Venda exige estoque (ou regra de pré-venda); cancelamento/devolução reverte estoque.
- **Soft-delete** em dados críticos (status inativo/cancelado), nunca exclusão física.
- Estoque mínimo → alerta no dashboard.

## Comandos
```bash
npm run dev      # desenvolvimento (Turbopack)
npm run build    # build de produção (typecheck + lint)
npm run lint     # ESLint
# Prisma (após configurar DATABASE_URL):
npx prisma migrate dev
npx prisma studio
npm run db:seed
```

## Ambiente
Variáveis em `.env` (modelo em `.env.example`). Banco = Supabase (Postgres + Auth + Storage).
```
