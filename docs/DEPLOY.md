# Colocando a loja no ar

Caminho recomendado: **Vercel** (site) + **Supabase** (banco Postgres e fotos) + **Resend** (e-mail, opcional).
O servidor **se recusa a subir** se faltar configuração essencial ou se ela estiver com valor de exemplo. A mensagem de erro lista o que falta.

## 1. Supabase (banco + fotos)
1. Crie um projeto em supabase.com (região São Paulo).
2. Em **Project Settings → Database → Connection string**, copie:
   - **Transaction pooler** (porta 6543) para `DATABASE_URL`, acrescentando `?pgbouncer=true&connection_limit=1`.
   - **Session/direct** (porta 5432) para `DIRECT_URL` (usado nas migrations).
3. Em **Storage**, crie um bucket **público** chamado `media`.
4. Em **Project Settings → API**, copie a `URL` (vai em `SUPABASE_URL`) e a **service_role key** (vai em `SUPABASE_SERVICE_ROLE_KEY`). Essa chave **nunca** pode ser `NEXT_PUBLIC_`.
5. **Backup:** o plano gratuito do Supabase guarda backups diários por 7 dias. Para dados de produção, considere o plano Pro, que adiciona *point-in-time recovery*.

## 2. Vercel
1. Importe o repositório. O `vercel.json` já define:
   - `buildCommand: npm run build:prod`. Esse comando confere o schema Postgres, gera o client, aplica as migrations e faz o build.
   - O **cron diário** que expira reservas vencidas (`/api/cron/expire-payments`).
2. Variáveis de ambiente (Production). Veja `.env.example`.

| Variável | Obrigatória | Observação |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | sim | do passo 1 |
| `AUTH_SECRET` | sim | `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | sim | `https://seudominio.com.br` |
| `NEXT_PUBLIC_WHATSAPP` | sim | `5547999999999` — recebe os pedidos da loja |
| `NEXT_PUBLIC_SALES_MODE` | não | vazio = venda pelo **WhatsApp** (padrão); `checkout` liga carrinho/pedidos/financeiro |
| `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | sim na Vercel | sem isso as fotos somem a cada deploy |
| `CRON_SECRET` | só no modo `checkout` | a Vercel envia o token automaticamente para o cron |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_DOCUMENT` | para vender de verdade | Decreto 7.962/2013: nome + CPF **ou** CNPJ |
| `NEXT_PUBLIC_CONTACT_*`, `NEXT_PUBLIC_ADDRESS`, `NEXT_PUBLIC_BUSINESS_HOURS` | não | vazio = não aparece no site |
| `NEXT_PUBLIC_FREE_SHIPPING_FROM`, `NEXT_PUBLIC_FLAT_SHIPPING`, `NEXT_PUBLIC_MAX_INSTALLMENTS` | só no modo `checkout` | regras anunciadas no site |
| `RESEND_API_KEY`, `EMAIL_FROM`, `STORE_NOTIFY_EMAIL` | só no modo `checkout` | e-mail de pedido recebido e de contato |

> As variáveis `NEXT_PUBLIC_*` entram no build. Depois de mudar alguma, faça **Redeploy**.

## 3. Primeiro acesso (sem o seed de demonstração)
O seed de demonstração **apaga o banco** e por isso fica bloqueado fora do SQLite local. Em produção, rode uma vez:

```bash
DATABASE_URL=... DIRECT_URL=... npx prisma generate --schema prisma/postgres/schema.prisma
DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy --schema prisma/postgres/schema.prisma
BOOTSTRAP_ADMIN_EMAIL=voce@... BOOTSTRAP_ADMIN_PASSWORD='SenhaForte123' DATABASE_URL=... npm run db:bootstrap
```

Isso cria papéis, permissões, categorias e o 1º administrador. Depois:
1. Entre em `/admin/login`.
2. Crie os demais usuários em **Usuários**.
3. Cadastre as peças com fotos.

## 4. Domínio e e-mail
- **Domínio:** em Vercel → Domains, aponte o DNS do seu domínio.
- **E-mail (opcional):** crie a conta no Resend, verifique o domínio (registros DNS) e preencha `RESEND_API_KEY` e `EMAIL_FROM`.

## Dia a dia de desenvolvimento
- **Local:** SQLite (`prisma/schema.prisma`, migrations em `prisma/migrations`).
- **Mudou o schema?**
  1. Rode `npx prisma migrate dev --name x` (SQLite).
  2. Rode `npm run db:pg:schema`.
  3. Gere a migration Postgres. Contra um Postgres de desenvolvimento:
     ```bash
     npx prisma migrate diff --from-migrations prisma/postgres/migrations \
       --to-schema-datamodel prisma/postgres/schema.prisma \
       --shadow-database-url <pg-vazio> --script > prisma/postgres/migrations/<data>_x/migration.sql
     ```
  O CI falha se qualquer um dos dois lados ficar desatualizado.
- **Testes:**
  - `npm run test:rules`: regras de negócio.
  - `npm run test:e2e`: fluxo completo; precisa de `npm run build` e do banco recém-seedado.
