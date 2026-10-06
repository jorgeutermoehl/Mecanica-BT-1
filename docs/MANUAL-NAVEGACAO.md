# Manual de navegação — FullBoost Race Parts

Guia de uso da **loja** (o que o cliente vê) e do **painel** (o que a equipe usa), no modo atual de operação: **venda pelo WhatsApp**. Não existe carrinho nem pagamento no site — toda peça leva o cliente para uma conversa no WhatsApp da loja com a mensagem já preenchida.

> Modo de venda é configuração do servidor (`NEXT_PUBLIC_SALES_MODE`). Vazio = WhatsApp (este manual). `checkout` reativa carrinho, pedidos, estoque e financeiro — ver o apêndice no fim.

---

## 1. Visão geral

| Quem | Onde | O que faz |
|---|---|---|
| Cliente | `https://seudominio.com.br` | Navega no catálogo, vê fotos/preço/disponibilidade e **pede pelo WhatsApp** |
| Equipe da loja | `https://seudominio.com.br/admin/login` | Cadastra e edita anúncios (fotos, preço, quantidade), ativa/desativa, gerencia usuários |
| Administrador | mesmo painel | Tudo acima + criar/desativar usuários e redefinir senhas |

Regras que valem em todo o site:
- **Tema claro/escuro** — botão de sol/lua no cabeçalho (padrão escuro; a escolha fica salva no navegador).
- **Botão flutuante do WhatsApp** — canto inferior direito em todas as páginas da loja (no celular, na página da peça ele cede lugar à barra fixa de pedido).
- **Aviso de cookies (LGPD)** — aparece uma vez na primeira visita; "Aceitar" ou "Preferências". Não bloqueia a navegação.
- **Celular e desktop** — todas as telas foram verificadas em 390 px (celular) e 1280 px (desktop); nada rola na horizontal.

---

## 2. Loja (cliente)

### 2.1 Cabeçalho (todas as páginas)
- **Logo** → volta para a Início.
- Menu: **Início · Produtos · Sobre**.
- Botão **WhatsApp** (verde) → abre conversa com a mensagem padrão da loja.
- Toggle de tema. No celular o menu vira o ícone ☰ (abre um painel lateral com os mesmos links).

### 2.2 Início — `/`
Ordem das seções, de cima para baixo:
1. **Hero** — frase da marca, botões **Ver catálogo** e **Falar no WhatsApp**.
2. **Faixa de confiança** — peça certa para a aplicação · pagamento combinado no WhatsApp · envio para todo o Brasil.
3. **Em destaque** — anúncios marcados como *Destaque* no painel (se nenhum estiver marcado, mostra os mais recentes).
4. **Categorias** — um cartão por categoria com produto cadastrado (Transmissão, Motor, Gaiolas…). Categoria sem produto **não aparece**: anunciar é o que a desbloqueia.
5. **Mais vendidos** — só aparece quando houver venda registrada (no modo WhatsApp normalmente fica oculta).
6. **Em promoção** — peças com preço promocional (só aparece se houver alguma).
7. **Como comprar** — 3 passos: *Escolha a peça → Chame no WhatsApp → Pague e receba*.
8. **Chamada final** para o WhatsApp.

### 2.3 Catálogo — `/produtos`
- **Busca** (topo): nome, SKU ou aplicação; ignora acentos e maiúsculas.
- **Filtros** (coluna à esquerda no desktop; botão "Filtros" no celular): **Categorias**, **Marca**, **Condição** (Novo / Usado / Revisado), **Disponibilidade**, **Faixa de preço**.
- **Ordenar**: Relevância · Menor preço · Maior preço · Novidades.
- Chegar já filtrado: `/produtos?categoria=transmissao` (é o link dos cartões da Início e do rodapé).
- Anúncios em *Destaque* vêm primeiro.

**Cartão da peça** (grade de 2 colunas no celular, até 4 no desktop):
- foto · selo de condição (**Novo / Usado / Revisado**) · selo **Destaque** quando marcado;
- categoria · nome · preço (ou preço riscado + promocional, ou **Sob consulta**);
- disponibilidade: **Disponível** · **Últimas N un.** (quando ≤ estoque mínimo) · **Esgotado**;
- um único botão: **Pedir no WhatsApp** (ou **Consultar**, se for sob consulta). Clicar na foto/nome abre a página da peça.

### 2.4 Página da peça — `/produtos/<slug>`
- **Galeria** — foto principal grande + miniaturas (até 8 fotos; clique troca a principal).
- **Título, SKU, marca, condição, categoria**.
- **Preço** (ou promocional / Sob consulta) e **disponibilidade**.
- **Botões**:
  - **Pedir pelo WhatsApp** — abre o WhatsApp da loja com: *"Olá! Tenho interesse nesta peça: Nome (SKU) — R$ … link"*; para sob consulta: **Consultar modelos e preço no WhatsApp**.
  - **Tirar dúvida sobre aplicação** — mesma conversa, mensagem de dúvida.
- **Barra fixa no rodapé do celular** — preço + botão **Pedir no WhatsApp** sempre visível enquanto rola.
- Seções: **Descrição**, **Especificações técnicas**, **Aplicação** (texto livre do cadastro), **Garantia**, **Perguntas frequentes**, **Peças relacionadas**.
- Peça **inativa** ou de categoria desativada → página não existe (404) e some do catálogo/sitemap.

### 2.5 Promoções — `/promocoes`
Lista só as peças com **preço promocional** definido no painel. Sem promoção ativa mostra "Nenhuma oferta ativa no momento" e o botão para o catálogo. (Cupons só existem no modo `checkout`.)

### 2.6 Sobre — `/sobre`
Quem somos, as três linhas de produto (Transmissão · Motor · Gaiolas & segurança) e "Como funciona" em 3 passos (WhatsApp). Botões para o catálogo e para o WhatsApp.

### 2.7 Contato — `/contato`
Cartão do **WhatsApp** (canal principal) e, se configurados no servidor, e-mail, telefone, horário e endereço. **Não há formulário** no modo WhatsApp — o atendimento acontece na conversa.

### 2.8 Rodapé (todas as páginas)
Links: Início · Produtos · Sobre · Contato · Termos · Privacidade; categorias com produto; redes sociais e identificação do vendedor (nome/CPF ou CNPJ) **quando configurados** — vazio nunca mostra texto de exemplo.

### 2.9 Termos — `/termos` e Privacidade — `/privacidade`
Textos legais já adaptados ao modo WhatsApp (pagamento combinado na conversa, sem checkout). Revisar nome e documento do vendedor antes de publicar.

### 2.10 Fluxo do cliente, do início ao fim
1. Entra pelo link do Instagram/Google → **Início** ou direto na peça.
2. Filtra o catálogo (ex.: Transmissão → Novo) ou busca "8x31".
3. Abre a peça, confere fotos, aplicação e disponibilidade.
4. Toca **Pedir no WhatsApp** → WhatsApp abre já com nome, SKU, preço e link da peça.
5. Loja responde na conversa: confirma aplicação, combina **Pix ou link da maquininha**, frete e prazo.
6. Loja atualiza a **quantidade disponível** no painel (0 = "Esgotado" na loja na hora).

---

## 3. Painel (equipe)

### 3.1 Entrar — `/admin/login`
E-mail + senha. Após entrar vai para **Produtos**. Regras de segurança:
- 5 tentativas erradas (por e-mail ou por IP) → bloqueio de 15 minutos.
- Sessão de 7 dias; **trocar a senha derruba as sessões em outros aparelhos**.
- Usuário desativado perde o acesso na próxima ação, mesmo logado.
- A tela nunca mostra credenciais. Em produção o 1º admin é criado por `npm run db:bootstrap` (ver `docs/DEPLOY.md`).

### 3.2 Menu lateral (desktop) / ☰ (celular)
**Produtos · Usuários** (só admin) · **Minha conta · Ver loja** (abre a loja em nova aba) e **Sair**. Nome e papel do usuário aparecem no rodapé do menu.

### 3.3 Produtos — `/admin/produtos`
- **Busca** por nome, SKU ou código original (sem acento/maiúsculas).
- Lista (tabela no desktop, cartões no celular) com: foto · nome · SKU · categoria · condição · selo Destaque · **Preço** (promocional em laranja, "Sob consulta") · **Estoque** (em amarelo quando ≤ mínimo) · **Status** (Ativo / Promoção / Sem estoque / Inativo).
- Ações por linha: **Editar** · **Desativar/Ativar** (pede confirmação). Desativar tira o anúncio da loja na hora, sem apagar nada (soft-delete).
- Botão **Novo produto** no topo.

### 3.4 Novo produto — `/admin/produtos/novo`
Campos (* = obrigatório):

| Bloco | Campos |
|---|---|
| Identificação | **Nome*** · **SKU*** (único) · **Categoria*** · Marca · Código original |
| Anúncio | **Condição** (Novo / Usado / Revisado) · **Anúncio em destaque** (vai para "Em destaque" na Início e topo do catálogo) · Descrição · Especificações técnicas (uma por linha, ex.: `Relação: 8x31`) · Aplicação (texto livre, ex.: *Câmbio Gol BX*) · Garantia · Localização no estoque |
| Preços | **Custo (R$)*** (interno, nunca aparece na loja) · **Preço de venda (R$)*** · Preço promocional (opcional; cria o selo e a seção Promoções) · **Preço sob consulta** (esconde o preço; botão vira "Consultar") |
| Estoque | **Estoque inicial** · **Estoque mínimo** (abaixo disso a loja mostra "Últimas N un." e a lista do painel destaca em amarelo) |

**Salvar** publica na loja imediatamente (produto nasce **Ativo**) e abre a tela de edição para adicionar as **fotos**.

### 3.5 Editar produto — `/admin/produtos/<id>`
Cabeçalho com SKU, nome e link **ver na loja**. Mesmo formulário do cadastro, mais:
- **Quantidade disponível** — edite e salve. Cada alteração vira um lançamento de ajuste no histórico (quem, quando, de quanto para quanto). `0` = "Esgotado" na loja; o anúncio continua visível.
- **Imagens do produto** (galeria):
  - **Adicionar fotos** — JPEG, PNG, WebP ou AVIF, até **8 MB**, menor lado ≥ **400 px** (recomendado ≥ 1200 px); até **8 fotos** por peça. SVG é recusado. O servidor gera automaticamente os tamanhos (miniatura, card, detalhe, zoom).
  - **Texto alternativo** obrigatório (descreva a foto — acessibilidade e Google Imagens).
  - **Principal** — define a foto do cartão e do compartilhamento.
  - **Arrastar** para reordenar; **Remover** (pede confirmação; o arquivo fica guardado para auditoria).
  - Guia completo: `docs/IMAGENS-PRODUTO.md`.
- Botões **Salvar** e **Voltar**.

### 3.6 Usuários — `/admin/usuarios` (só administrador)
Tabela: Nome · E-mail · Papel · Situação · Último login · Ações.
- **Novo usuário**: nome, e-mail, papel (Administrador, Gerente, Vendedor, Estoquista, Financeiro), senha inicial (mín. 10 caracteres com letra e número).
- **Editar**: papel, **Acesso ativo** (liga/desliga), **Redefinir senha** (opcional).
- Proteções: sempre sobra ao menos 1 administrador ativo; ninguém desativa a si mesmo.

### 3.7 Minha conta — `/admin/conta`
**Alterar senha**: senha atual → nova → confirmar. Ao salvar, os outros aparelhos são deslogados; este continua.

### 3.8 Sair
Botão **Sair** no rodapé do menu (ou no ☰ do celular). Volta para o login.

---

## 4. Tarefas do dia a dia (passo a passo)

| Quero… | Faço |
|---|---|
| Publicar uma peça nova | Produtos → **Novo produto** → preencher → **Salvar** → na edição, **Adicionar fotos** → marcar a **Principal** |
| Marcar que vendeu / acabou | Produtos → **Editar** → **Quantidade disponível** = novo valor (0 = Esgotado) → **Salvar** |
| Colocar em promoção | Editar → **Preço promocional** → Salvar (aparece em Promoções e com preço riscado) |
| Tirar da promoção | Editar → apagar o preço promocional → Salvar |
| Destacar na Início | Editar → ligar **Anúncio em destaque** → Salvar |
| Vender "sob consulta" (vários modelos/preços) | Editar → ligar **Preço sob consulta** → Salvar (botão vira "Consultar") |
| Esconder um anúncio sem apagar | Produtos → **Desativar** (voltar: **Ativar**) |
| Abrir uma nova linha de produto (ex.: Suspensão) | Basta cadastrar o 1º produto na categoria — ela aparece sozinha na Início, no catálogo e no rodapé |
| Dar acesso a um funcionário | Usuários → **Novo usuário** (papel Vendedor para só cadastrar; Administrador para também mexer em usuários) |
| Funcionário saiu | Usuários → Editar → desligar **Acesso ativo** |
| Trocar minha senha | Minha conta → **Alterar senha** |

---

## 5. Mapa de URLs

**Loja**

| URL | Tela |
|---|---|
| `/` | Início |
| `/produtos` · `/produtos?categoria=<slug>` | Catálogo (com filtro) |
| `/produtos/<slug>` | Página da peça |
| `/promocoes` | Ofertas |
| `/sobre` · `/contato` · `/termos` · `/privacidade` | Institucionais |
| `/sitemap.xml` · `/robots.txt` | SEO (gerados automaticamente; painel e API ficam fora do Google) |

**Painel**

| URL | Tela | Quem |
|---|---|---|
| `/admin/login` | Entrar | todos |
| `/admin` | redireciona para Produtos | — |
| `/admin/produtos` | Lista de anúncios | equipe |
| `/admin/produtos/novo` | Cadastro | equipe |
| `/admin/produtos/<id>` | Edição + fotos + quantidade | equipe |
| `/admin/usuarios` | Usuários do painel | administrador |
| `/admin/conta` | Minha conta | todos |

**Desligadas neste modo (respondem "página não encontrada")**: `/carrinho`, `/checkout`, `/pedido-confirmado`, `/admin/estoque`, `/admin/pedidos`, `/admin/clientes`, `/admin/promocoes`, `/admin/mensagens`, `/admin/notificacoes`, `/admin/relatorios`, `/admin/dre`, `/admin/financeiro/transacoes`, `/api/webhooks/*`, `/api/cron/*`. As respectivas ações no servidor também recusam.

---

## 6. Segurança (o que já está garantido)

- Painel inteiro atrás de sessão assinada (cookie `httpOnly`, `Secure` em produção), revalidada no banco a cada ação; papéis conferidos no servidor.
- Toda ação do painel valida os dados duas vezes (navegador e servidor, Zod) e exige usuário logado; ações de usuários exigem administrador.
- Anti força bruta no login; auditoria de login, cadastro, estoque, fotos e usuários.
- Upload de fotos: tipo real conferido pelos bytes do arquivo (não pela extensão), SVG recusado, nome do arquivo nunca vem do usuário, servidor de mídia com caminho confinado.
- Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- Servidor **não sobe em produção** com segredo/WhatsApp de exemplo, SQLite ou sem storage na Vercel.
- Nenhum rastreador: só o aviso de cookies com consentimento registrado (1 registro por sessão/dia).

---

## 7. Checklist de validação (antes de ir ao ar)

**Loja**
- [ ] Início abre no celular e no desktop; tema claro/escuro alterna.
- [ ] Catálogo: busca "8x31", filtro Transmissão, ordenar por menor preço.
- [ ] Página da peça: fotos trocam; **Pedir no WhatsApp** abre o WhatsApp **da loja** com nome, SKU, preço e link.
- [ ] Barra fixa de pedido aparece no celular.
- [ ] Peça sob consulta mostra "Consultar"; peça com quantidade 0 mostra "Esgotado".
- [ ] Contato mostra o WhatsApp certo; rodapé mostra nome/documento do vendedor.

**Painel**
- [ ] Login com a senha definitiva (nunca a de demonstração); senha errada 5× bloqueia.
- [ ] Cadastrar peça → aparece na loja na hora; adicionar 2 fotos, trocar a principal, reordenar, remover 1.
- [ ] Alterar **Quantidade disponível** para 0 → loja mostra Esgotado; voltar para 3 → "Últimas 3 un." (se mínimo ≥ 3).
- [ ] Desativar e reativar um anúncio.
- [ ] Criar usuário Vendedor, entrar com ele (não vê Usuários), trocar a própria senha.

**Servidor** (ver `docs/DEPLOY.md`)
- [ ] `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, banco Postgres e storage Supabase configurados.
- [ ] `NEXT_PUBLIC_LEGAL_NAME` / `NEXT_PUBLIC_LEGAL_DOCUMENT` preenchidos (obrigatórios para vender).
- [ ] Senha do seed **não** está em uso; 1º admin criado por `npm run db:bootstrap`.

---

## Apêndice — modo `checkout` (desligado)

Com `NEXT_PUBLIC_SALES_MODE=checkout` (e redeploy) voltam: carrinho e checkout com reserva de estoque por 72 h, cupons, formulário de contato, e no painel o **Dashboard** (`/admin`), **Estoque** (entradas/saídas/ajustes/histórico), **Pedidos** (marcar Pago, cancelar com reposição), **Clientes**, **Promoções/cupons**, **Mensagens**, **Notificações**, **Relatórios**, **DRE** e **Transações** (gateway). Também passam a valer frete/parcelas (`NEXT_PUBLIC_FREE_SHIPPING_FROM`, `NEXT_PUBLIC_FLAT_SHIPPING`, `NEXT_PUBLIC_MAX_INSTALLMENTS`), o cron de expiração e o e-mail transacional. Nada precisa ser reinstalado: é a mesma base de código e o mesmo banco.
