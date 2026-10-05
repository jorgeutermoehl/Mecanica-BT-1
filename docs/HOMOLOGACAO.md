# Ambiente de homologação (validação pelo cliente)

Homologação é uma **cópia do site com banco separado e marcada como teste**:
- faixa amarela "Ambiente de teste" em todas as páginas;
- fora do Google (`noindex` + `robots.txt` bloqueando tudo);
- mensagens de WhatsApp e e-mails saem com **[TESTE]**.

O cliente pode cadastrar peças, fazer pedidos e mudar status à vontade: nada disso afeta a loja real.

## Arquitetura recomendada (custo zero nos planos gratuitos)
- **Vercel:** cada push na branch vira um *Preview Deployment* com URL própria. A homologação é o Preview; a produção é a branch principal.
- **Supabase:** um projeto **só para homologação**, separado do de produção. Assim o banco e as fotos de teste nunca se misturam com os reais.

## Configuração (uma vez, ~20 min)
1. **Supabase (homologação):** crie o projeto `fullboost-homolog` e o bucket público `media`. Os passos são os mesmos do [`DEPLOY.md`](DEPLOY.md#1-supabase-banco--fotos).
2. **Vercel:** importe o repositório. Em *Settings → Environment Variables*, cadastre no escopo **Preview**:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_APP_ENV` | `staging` |
| `DATABASE_URL` / `DIRECT_URL` | do Supabase **de homologação** |
| `AUTH_SECRET` | `openssl rand -base64 48` (diferente do de produção) |
| `NEXT_PUBLIC_SITE_URL` | a URL do preview (ex.: `https://mecanica-bt-1-git-<branch>-<time>.vercel.app`) |
| `NEXT_PUBLIC_WHATSAPP` | o número que vai receber os pedidos de teste |
| `STORAGE_DRIVER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | do Supabase de homologação |

   > Em *Settings → Deployment Protection* dá para exigir senha ou login Vercel para abrir o preview. Recomendado enquanto o cliente testa.

3. **Dados de demonstração** (do seu computador, apontando para o banco de **homologação**):
   ```bash
   export DATABASE_URL="<pooler homologação>" DIRECT_URL="<direta homologação>"
   npx prisma generate --schema prisma/postgres/schema.prisma
   npx prisma migrate deploy --schema prisma/postgres/schema.prisma
   SEED_ALLOW_WIPE=1 SEED_ADMIN_PASSWORD='<senha-forte-de-homolog>' npx tsx prisma/seed.ts
   ```
   - O seed cria os 3 produtos com as fotos dos anúncios, 1 pedido, 1 cupom (`BEMVINDO10`) e os usuários `admin@fullboost.com.br` e `vendedor@fullboost.com.br`, com a senha definida em `SEED_ADMIN_PASSWORD`.
   - **Nunca use `fullboost123` num endereço público:** essa senha está no repositório.
4. Faça um push (ou *Redeploy* do preview) e mande ao cliente o link e o acesso do painel.

## Recomeçar do zero
Para limpar o que o cliente testou e voltar aos dados de demonstração, rode de novo o comando do passo 3. Ele **apaga** o banco de homologação e recria tudo. Nunca aponte esse comando para o banco de produção.

## Roteiro de validação do cliente
O roteiro passo a passo (o que testar e o que conferir em cada etapa) foi entregue separadamente, como documento compartilhável com comentários. O cliente marca cada item e deixa os ajustes como comentário.
