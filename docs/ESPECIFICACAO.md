# Especificação — Diógenes Auto Peças

> Fonte da verdade do projeto. Sistema completo de **e-commerce de peças mecânicas + ERP de gestão** (estoque rastreável, vendas, compras, financeiro e DRE gerencial).

## Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Estilo:** Tailwind CSS v4 + shadcn/ui
- **Backend:** Next.js (Route Handlers / Server Actions) + camada de serviços em `src/server`
- **Banco:** PostgreSQL (Supabase) · **ORM:** Prisma
- **Auth:** Supabase Auth + papéis/permissões próprios no banco
- **Storage de imagens:** Supabase Storage
- **Validação:** Zod (cliente + servidor) · **Testes:** Playwright (e2e)

## Tema visual
Minimalista, moderno e premium. **Preto** como base, **vermelho** para ações/destaques/promoções/alertas, **branco/cinza** para contraste e áreas administrativas. Cards com bordas suaves, sombras leves, microinterações discretas. Loja pública em tema escuro; admin em tema claro com sidebar preta.

## Páginas públicas
1. **Home** — banner/CTA, destaques de categorias, promoções, mais vendidos, peças por marca/modelo, bloco de confiança (entrega/garantia/suporte/pagamento), botão WhatsApp.
2. **Catálogo** — listagem, filtros (categoria, marca, modelo, aplicação, preço, estoque, promoção, fabricante), busca inteligente (nome, código, SKU, compatibilidade, fabricante, descrição), ordenação, card de produto.
3. **Produto** — galeria, nome, SKU/código interno, código original/fabricante, aplicação/compatibilidade, descrição técnica, estoque, preço (e promocional), garantia, relacionados, comprar, tirar dúvida.
4. **Carrinho** — itens, quantidade, subtotal, frete, cupom, resumo, finalizar.
5. **Checkout** — cadastro/login, entrega, pagamento, revisão, confirmação, geração de pedido com baixa/reserva de estoque.
6. **Sobre nós** — história, missão, diferenciais, confiança/garantia.
7. **Promoções** — ofertas, cupons ativos, campanhas com início/fim, destaque vermelho/preto.
8. **Fale conosco** — formulário (nome, telefone, e-mail, assunto, mensagem), WhatsApp, registro interno, status (novo/em análise/respondido/finalizado).
9. **Cookies e LGPD** — banner (aceitar todos / recusar opcionais / configurar), política de privacidade, termos de uso, consentimento salvo.

## Área administrativa (menu lateral, cards de indicadores, tabelas profissionais)
1. **Dashboard** — faturamento (dia/mês/ano), pedidos, pendentes, estoque baixo, mais vendidos, lucro estimado, margem bruta, contas a pagar/receber, caixa atual, alertas.
2. **Produtos/peças** — nome, SKU, código original, categoria, marca, fabricante, aplicação, descrição, custo, preço, margem, estoque atual/mínimo, localização, imagens, status (ativo/inativo/esgotado/promoção), peso/dimensões, garantia, observações.
3. **Controle de estoque** — entrada, saída por venda, saída manual, ajuste, devolução cliente/fornecedor, perda/avaria, inventário, histórico completo (usuário, data/hora, motivo, custo, saldo anterior/posterior). **Nunca apagar fisicamente** — corrigir via lançamento de ajuste com auditoria.
4. **Entradas de estoque** — fornecedor, NF, datas, produtos, qtd, custo unit./total, frete, despesas, impostos, pagamento, parcelas, status financeiro, atualização do custo médio.
5. **Saídas de estoque** — baixa/reserva automática, registro, vínculo ao pedido, atualização financeira e do DRE, histórico por produto.
6. **Pedidos/vendas** — número, cliente, produtos, qtd, valor bruto, desconto, frete, líquido, pagamento, status (aguardando/pago/separação/enviado/entregue/cancelado/devolvido), histórico, observações.
7. **Clientes** — nome, CPF/CNPJ, telefone, e-mail, endereço, histórico, total comprado, última compra, observações.
8. **Fornecedores** — razão social, CNPJ/CPF, contato, endereço, produtos, histórico de compras, condições de pagamento, observações.
9. **Promoções e cupons** — promoção por produto/categoria, início/fim, cupom (valor fixo/percentual), limite de uso, pedido mínimo, status, relatório de uso.
10. **Financeiro** — contas a pagar, contas a receber, fluxo de caixa (entradas/saídas/saldo/projeção/filtros), **DRE / DR-e gerencial**.
11. **Relatórios** — estoque atual/baixo, giro, produtos sem venda, mais vendidos, vendas por período/cliente, compras por fornecedor, lucro por produto, margem por categoria, DRE por período, movimentações, promoções mais usadas.
12. **Usuários e permissões** — admin, gerente, vendedor, estoquista, financeiro, cliente. Proteção de rotas por permissão.
13. **Auditoria e segurança** — logs de login, CRUD de produto, movimentações, alterações financeiras/pedidos/permissões, cancelamentos, devoluções. Sem exclusão definitiva de dados críticos.

## DRE / DR-e gerencial (por período)
Receita bruta → (−) descontos → (−) devoluções/cancelamentos → **Receita líquida** → (−) CMV → **Lucro bruto** + Margem bruta → (−) despesas operacionais/administrativas/com vendas/financeiras → **Resultado operacional** → (−) impostos/taxas → **Lucro líquido** + Margem líquida. Exibir em tabela detalhada, cards de resumo, gráficos simples, exportação CSV/Excel; filtros por dia/semana/mês/ano/personalizado.

## Banco de dados (tabelas)
users, roles, permissions, customers, suppliers, products, categories, brands, product_images, inventory_movements, stock_entries, stock_entry_items, orders, order_items, payments, accounts_payable, accounts_receivable, cash_flow, dre_records/financial_results, promotions, coupons, contact_messages, cookie_consents, audit_logs. Migrations organizadas + seeds realistas.

## Regras de negócio (invariantes)
- Venda só finaliza com estoque suficiente (ou regra clara de pré-venda).
- Toda venda registra saída; toda entrada atualiza saldo; toda movimentação tem histórico.
- **Custo do produto é congelado no item vendido** (`order_items.unit_cost_at_sale`) — o DRE usa o custo do momento da venda, não o preço atual.
- Cancelamento reverte/ajusta estoque; devolução gera movimentação de retorno.
- Promoção não pode gerar preço negativo/margem inválida sem alerta.
- Estoque mínimo gera alerta no dashboard.
- `inventory_movements` e `audit_logs` são append-only; correções via novos lançamentos.
- Soft-delete (status/cancelado/inativo) em dados críticos.

## Qualidade
Pastas organizadas (components, services, schemas, hooks, pages, layouts); validações server + client; componentes reutilizáveis; sem duplicação; acessibilidade básica; SEO nas páginas públicas; performance nas listagens.

## Testes (Playwright)
Cadastro de produto · entrada de estoque · saída por venda · pedido completo · aplicação de cupom · cálculo de DRE · controle de permissão · banner de cookies · fale conosco · fluxo completo de compra.

## Roadmap por fases
- **F0** Fundação (scaffold, design system, layout base) ✅
- **F1** Banco (schema Prisma, migrations, seeds)
- **F2** Auth & permissões (login, papéis, rotas privadas)
- **F3** Loja pública (home → checkout + institucionais + LGPD)
- **F4** Admin core (dashboard, produtos, categorias, marcas, clientes, fornecedores)
- **F5** Estoque (movimentações, entradas, saídas, ajustes, inventário)
- **F6** Vendas/Pedidos (baixa de estoque, status, custo congelado)
- **F7** Financeiro & DRE
- **F8** Promoções/cupons & Relatórios
- **F9** Testes Playwright + revisão final (segurança, responsividade, performance)
