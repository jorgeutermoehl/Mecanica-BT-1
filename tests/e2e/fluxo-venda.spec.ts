import path from "node:path";
import { expect, test } from "@playwright/test";
import { CHECKOUT, login } from "./helpers";

/**
 * Fluxo padrão da loja, de ponta a ponta:
 *  painel: login → cadastro de peça com fotos → loja: catálogo e página do
 *  produto → carrinho → checkout → pedido aguardando pagamento (WhatsApp) →
 *  painel: Pago → Em separação → Enviado. Roda contra o seed de demonstração.
 */

const FOTOS = ["coroa-pinhao-detalhe.webp", "coroa-pinhao-lote.webp"].map((f) =>
  path.join(process.cwd(), "public/produtos", f),
);
const SKU = `TRA-E2E-${Date.now().toString(36).toUpperCase()}`;
const NOME = `Coroa e Pinhão 8x31 E2E ${SKU}`;

test("cadastro com fotos → venda pelo site → baixa no estoque", async ({ page, context }) => {
  test.skip(!CHECKOUT, "venda pelo site só no modo checkout");
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  // ---------- Painel: login (sem credenciais expostas na tela) ----------
  await page.goto("/admin/login");
  await expect(page.getByText("fullboost123")).toHaveCount(0);
  await login(page);
  await expect(page.getByRole("link", { name: "Veículos" })).toHaveCount(0);

  // ---------- Cadastro da peça com 2 fotos ----------
  await page.goto("/admin/produtos/novo");
  await page.fill("#product-name", NOME);
  await page.fill("#product-sku", SKU);
  await page.click("#product-category");
  await page.getByRole("option", { name: "Transmissão" }).click();
  await page.fill("#product-fitment", "Câmbio Gol BX · relação 8x31");
  await page.fill("#product-description", "Par coroa e pinhão 8x31 — teste ponta a ponta.");
  await page.fill("#product-cost", "400");
  await page.fill("#product-price", "750");
  await page.fill("#product-initial-stock", "10");
  await page.fill("#product-min-stock", "2");
  await page.setInputFiles("#product-photos", FOTOS);
  await expect(page.getByText("Capa", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publicar na loja" }).click();
  await page.waitForURL((u) => /^\/admin\/produtos\/(?!novo)[^/]+$/.test(u.pathname), { timeout: 60_000 });
  await expect(page.locator("section[aria-labelledby=gallery-heading] img")).toHaveCount(2);

  // ---------- Loja: catálogo e página do produto ----------
  const shop = await context.newPage();
  await shop.goto("/produtos?categoria=transmissao");
  const link = shop.locator(`a[href^="/produtos/coroa-e-pinhao-8x31-e2e"]`).first();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  await shop.goto(href!);
  await expect(shop.getByRole("heading", { level: 1 })).toContainText("8x31 E2E");
  const imgs = await shop
    .locator("main img")
    .evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).currentSrc.includes("media")).length);
  expect(imgs).toBeGreaterThan(0);

  // ---------- Carrinho + checkout ----------
  await shop.getByRole("button", { name: "Adicionar ao carrinho" }).first().click();
  await shop.goto("/checkout");
  await shop.fill("#name", "Cliente Teste E2E");
  await shop.fill("#email", "cliente.e2e@example.com");
  await shop.fill("#phone", "(47) 99999-1234");
  await shop.fill("#zipCode", "89200-000");
  await shop.fill("#street", "Rua das Oficinas");
  await shop.fill("#number", "100");
  await shop.fill("#city", "Joinville");
  await shop.fill("#state", "SC");
  await shop.click("label[for=pay-CREDIT_CARD]");
  await shop.getByRole("button", { name: /Finalizar pedido/ }).click();
  await shop.waitForURL(/pedido-confirmado/, { timeout: 30_000 });
  const url = new URL(shop.url());
  const numero = url.searchParams.get("numero")!;
  expect(url.searchParams.get("status")).toBe("AWAITING_PAYMENT");
  const wa = await shop.getByRole("link", { name: /Finalizar no WhatsApp/ }).getAttribute("href");
  expect(decodeURIComponent(wa ?? "")).toContain(numero);

  // ---------- Painel: Pago → Em separação → Enviado ----------
  await page.goto("/admin/pedidos");
  const orderHref = await page.locator("tr", { hasText: numero }).locator("a").last().getAttribute("href");
  await page.goto(orderHref!);
  const statusForm = page.locator("form").filter({ has: page.locator("#next-status") });
  for (const status of ["Pago", "Em separação", "Enviado"]) {
    await page.click("#next-status");
    await page.getByRole("option", { name: status, exact: true }).click();
    await expect(page.locator("#next-status")).toContainText(status);
    await page.fill("#status-note", `E2E: ${status}`);
    await statusForm.getByRole("button", { name: "Atualizar" }).click();
    // Espera o servidor confirmar (toast) antes de recarregar a página.
    await expect(page.getByText(`Status atualizado para "${status}".`)).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator("main")).toContainText(`E2E: ${status}`);
  }

  // ---------- Estoque: 10 → 9 com movimento de venda ----------
  await page.goto("/admin/produtos");
  await expect(page.locator("tr", { hasText: SKU })).toContainText("9");

  expect(consoleErrors).toEqual([]);
});

test("formulário de contato grava a mensagem e ela aparece no painel", async ({ page, context }) => {
  test.skip(!CHECKOUT, "formulário de contato só no modo checkout (no WhatsApp é só o botão)");
  const shop = await context.newPage();
  const assunto = `Gaiola E2E ${Date.now()}`;
  await shop.goto("/contato");
  await shop.fill("#nome", "Visitante E2E");
  await shop.fill("#telefone", "(47) 98888-0000");
  await shop.fill("#email", `contato.${Date.now()}@example.com`);
  await shop.fill("#assunto", assunto);
  await shop.fill("#mensagem", "Vocês fazem gaiola sob medida para Gol quadrado de pista?");
  await shop.getByRole("button", { name: /Enviar mensagem/ }).click();
  await expect(shop.getByText("Mensagem enviada")).toBeVisible();

  await login(page);
  await page.goto("/admin/mensagens");
  await expect(page.getByText(assunto)).toBeVisible();
});
