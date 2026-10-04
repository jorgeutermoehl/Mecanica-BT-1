# Deploy em nuvem — Vercel + Supabase

Arquitetura: **Vercel** (Next.js, frontend + server actions + API) · **Supabase** (PostgreSQL + Storage privado de mídia) · **Vercel Cron** (expiração de pagamentos).

## 1. Supabase
1. Crie o projeto (região `sa-east-1`/São Paulo).
2. *Project Settings → Database → Connection string*: copie
   - **Transaction pooler** (6543) → `DATABASE_URL` (acrescente `?pgbouncer=true&connection_limit=1`)
   - **Direct/Session** (5432) → `DIRECT_URL`
3. *Storage → New bucket* `media`, **privado**. *Settings → API*: copie `SUPABASE_URL` e a `service_role` key.

## 2. Vercel
Importe o repositório e defina as variáveis (Production):

| Variável | Valor |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | do passo 1 |
| `AUTH_SECRET` | `openssl rand -base64 48` (o app não sobe sem ele em produção) |
| `NEXT_PUBLIC_SITE_URL` | URL final (https) |
| `NEXT_PUBLIC_WHATSAPP` | só dígitos, ex. `5547999999999` |
| `STORAGE_DRIVER` | `supabase` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | do passo 1 |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | Mercado Pago (ver `docs/PAGAMENTOS-SETUP.md`) |

O `vercel.json` já define build (`prisma generate && prisma migrate deploy && next build`), região `gru1` e o cron `*/10 * * * *` (plano Hobby só permite cron diário — ajuste ou use Pro).

## 3. Primeiro deploy
```bash
# uma vez, da sua máquina, apontando para o banco de produção:
DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
DATABASE_URL=... DIRECT_URL=... npm run db:seed   # ⚠️ APAGA os dados e cria o admin demo
```
> ⚠️ O seed **limpa as tabelas** e cria `admin@fullboost.com.br / fullboost123`. Rode **só em banco vazio** e troque a senha do admin imediatamente (ou crie o admin real e remova o demo).

## 4. Checklist de go-live
- [ ] `AUTH_SECRET` e `CRON_SECRET` únicos e fortes
- [ ] Senha do admin demo trocada
- [ ] Domínio + HTTPS; `NEXT_PUBLIC_SITE_URL` atualizado
- [ ] Webhook do Mercado Pago apontando para `/api/webhooks/mercadopago`
- [ ] Backups do Supabase (PITR no plano Pro) ativos
- [ ] Teste: cadastrar peça com foto → aparece na loja → compra → baixa de estoque

## Desenvolvimento local
`docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=fullboost postgres:16`, copie `.env.example` para `.env`, depois `npx prisma migrate dev && npm run db:seed && npm run dev`.
