# Pagamentos — guia de ativação

Passo a passo para ligar o gateway de pagamento. O código já está pronto
(Onda 3): **sem as variáveis de ambiente abaixo nada toca a rede** — webhooks
são registrados como ignorados e o painel funciona normalmente.

## 0. Pré-requisito OBRIGATÓRIO: Postgres

Antes de aceitar pagamento real, migre a produção de SQLite para
**PostgreSQL/Supabase** (ESPEC-V2, Onda 3 item 1). Webhook e checkout rodam em
transações concorrentes — no SQLite elas disputam o lock do banco inteiro.
Sequência: Postgres primeiro, gateway depois. Não inverta.

## 1. Criar a aplicação no Mercado Pago

1. Acesse <https://www.mercadopago.com.br/developers> e entre com a conta da loja.
2. **Suas integrações → Criar aplicação** (tipo: pagamentos online, Checkout Pro
   ou Checkout API/Transparente).
3. Em **Credenciais de produção**, copie o **Access Token** (`APP_USR-...`).
4. Em **Webhooks → Configurar notificações**, cadastre a URL:

   ```
   https://SEU-DOMINIO.com.br/api/webhooks/mercadopago
   ```

   Marque o evento **Pagamentos** e copie a **assinatura secreta** exibida na
   tela de configuração do webhook.

## 2. Variáveis de ambiente

Adicione ao `.env` de produção (nunca commitar):

```bash
MP_ACCESS_TOKEN="APP_USR-..."        # Access Token de produção (passo 1.3)
MP_WEBHOOK_SECRET="..."              # assinatura secreta do webhook (passo 1.4)
CRON_SECRET="uma-chave-longa-aleatoria"  # ex.: openssl rand -hex 32
```

Comportamento por variável:

| Variável ausente    | Efeito                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `MP_WEBHOOK_SECRET` | Webhook responde 202 e registra o evento como IGNORED (sem validar) |
| `MP_ACCESS_TOKEN`   | Nenhuma consulta à API do MP; eventos ficam IGNORED               |
| `CRON_SECRET`       | Rota do cron responde 404 para qualquer chamada                   |

## 3. Agendar o cron de expiração

Chame a cada 10–15 minutos (Vercel Cron, GitHub Actions ou crontab):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://SEU-DOMINIO.com.br/api/cron/expire-payments
```

Ele expira transações e reservas vencidas e cancela pedidos aguardando
pagamento (motivo `PAYMENT_EXPIRED`). É idempotente — pode rodar em dobro.

## 4. Conferir no painel

- **Admin → Transações** (`/admin/financeiro/transacoes`): conciliação com
  bruto/taxa/líquido, filtros por status e provedor e botão **Reprocessar**
  (apenas administradores) para webhooks com erro.
- Taxas do gateway entram no caixa como saída `TAXA_GATEWAY` — o DRE passa a
  ler a despesa por canal automaticamente.

## 5. Pix Cresol

Não há API pública autoatendida: **peça na agência** a habilitação da API Pix
(recebimentos com webhook de confirmação). Com as credenciais em mãos, o
provedor `PIX_CRESOL` já existe no schema/serviço — falta apenas implementar o
`fetchRemoteStatus` específico quando a Cresol liberar a documentação.

## Teste rápido (homologação)

1. Use as credenciais de **teste** do MP nas mesmas variáveis.
2. Faça um checkout com boleto (pedido fica `AWAITING_PAYMENT`).
3. Pague com o cartão/PIX de teste do MP e confirme: pedido vira `PAID`,
   estoque baixa via `SALE` e a transação aparece aprovada na tela.
