# FullBoost Race Parts — guia do projeto

E-commerce de peças de performance **+ painel de gestão** (produtos, estoque rastreável, vendas; financeiro/DRE no roadmap). Especificação em [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · **SQLite em dev/demo** (alvo de produção: PostgreSQL/Supabase — schema usa String no lugar de enums por compatibilidade SQLite; valores validados por Zod em `src/lib/validations.ts`) · Auth de sessão própria (JWT httpOnly + bcrypt, `src/lib/auth.ts`) · Zod · Playwright. Gerenciador: **npm**.

## Banco / demo
- `npx prisma migrate dev` + `npm run db:seed` criam tudo (arquivo `prisma/dev.db`, gitignored; `DATABASE_URL="file:./dev.db?connection_limit=1"`). O seed **apaga o banco** e só roda em SQLite local (ou com `SEED_ALLOW_WIPE=1`).
- Painel: `/admin/login` → `admin@fullboost.com.br` / `fullboost123` (seed de demo; a tela NÃO exibe credenciais). Usuários e troca de senha: `/admin/usuarios` (admin) e `/admin/conta`.
- **Produção = Postgres/Supabase** via `prisma/postgres/schema.prisma`, GERADO de `prisma/schema.prisma` (`npm run db:pg:schema`; nunca editar à mão) com migrations próprias em `prisma/postgres/migrations`. Deploy e 1º admin: [`docs/DEPLOY.md`](docs/DEPLOY.md) (`npm run db:bootstrap`). SQL cru: identificadores sempre entre aspas (`"Product"."stockQuantity"`) para valer nos dois bancos.
- **Configuração da loja por env** (`src/lib/constants.ts`): contatos/identificação do vendedor opcionais (vazio = some do site, nunca placeholder); regras comerciais em `COMMERCE` (frete grátis, frete fixo, parcelas) — texto do site e cálculo do servidor usam a MESMA fonte. `src/lib/env.ts` derruba o boot de produção com config de exemplo.
- **Homologação** (`NEXT_PUBLIC_APP_ENV=staging`, `IS_STAGING` em constants): faixa de teste, noindex, `[TESTE]` em WhatsApp/e-mail; banco Supabase separado. Ver [`docs/HOMOLOGACAO.md`](docs/HOMOLOGACAO.md).
- Imagens de produto: upload pelo painel (cadastro e galeria) → `MediaFile` + `ProductImage`, arquivos em `uploads/` (gitignored). Formato e regras: [`docs/IMAGENS-PRODUTO.md`](docs/IMAGENS-PRODUTO.md). O seed usa fotos dos anúncios em `public/produtos/`.
- **Anúncios:** `Product.condition` (NEW/USED/REMAN → selo Novo/Usado/Revisado), `featured` (seção "Foco do momento" na home + topo do catálogo) e `priceOnRequest` ("Sob consulta": sem carrinho, só WhatsApp — o checkout recusa no servidor). Gaiolas: 3 kits com preço da tabela da loja; veículo/opções vão nas **observações do pedido** (`Order.notes`). Categoria **Rodas & Pneus desativada** (`disabled` em `prisma/base-data.ts` → `deletedAt`; seus produtos somem da loja).
- **Sem catálogo de veículos** (removido): loja de peças de tuning; aplicação da peça é texto livre em `Product.fitment`.
- **Venda pelo WhatsApp (fase atual):** checkout cria o pedido como `AWAITING_PAYMENT` com estoque reservado (72h); o cliente finaliza Pix/cartão (link da maquininha) no WhatsApp e a loja marca **Pago** no painel, o que converte a reserva em `SALE`. Nenhum método aprova sozinho até o gateway entrar.
- **Foco do catálogo:** transmissão (coroa e pinhão), motor (virabrequim) e gaiolas (rollcage). As demais categorias ficam cadastradas mas **ocultas na loja** até receberem o 1º produto (`getStoreCategories` filtra `count > 0`) — anunciar = desbloquear. Não fazer marketing fixo (hero, rodapé, textos) de linhas sem produto.
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

## Testes
- `npm run test:rules` — regras de negócio direto nos serviços (estoque, cupons, pedidos simultâneos, reserva vencida).
- `npm run test:e2e` — Playwright: cadastro com fotos → venda → painel; contato; usuários/senha. Exige `npm run build` + banco recém-seedado.
- CI (`.github/workflows/ci.yml`) roda tudo contra Postgres 16.

## Comandos
```bash
npm run dev        # desenvolvimento (Turbopack)
npm run build      # build de produção (typecheck + lint)
npx prisma migrate dev · npm run db:seed · npm run db:studio
```
