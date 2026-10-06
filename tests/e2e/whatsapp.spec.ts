import path from "node:path";
import { expect, test } from "@playwright/test";
import { CHECKOUT, login } from "./helpers";

/**
 * Modo WhatsApp (padrão): vitrine + pedido pelo WhatsApp, sem carrinho e com
 * o painel reduzido ao cadastro de produtos.
 */
test.skip(CHECKOUT, "modo WhatsApp");

const FOTOS = ["coroa-pinhao-detalhe.webp", "coroa-pinhao-lote.webp"].map((f) =>
  path.join(process.cwd(), "public/produtos", f),
);

test("loja sem carrinho: card e página da peça levam ao WhatsApp com a peça", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Carrinho/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toBeVisible();

  // Card: botão "Pedir no WhatsApp" com nome, SKU, preço e link da peça
  const pedir = page.getByRole("link", { name: "Pedir Gaiola Santo Antônio 6 Pontos — Básica no WhatsApp" }).first();
  const href = decodeURIComponent((await pedir.getAttribute("href")) ?? "");
  expect(href).toContain("GAI-6P-BASICO");
  expect(href).toMatch(/R\$\s1\.650,00/);
  expect(href).toContain("/produtos/gaiola-santo-antonio-6-pontos-basica");

  // Rotas de venda pelo site não existem
  expect((await page.goto("/carrinho"))?.status()).toBe(404);
  expect((await page.goto("/checkout"))?.status()).toBe(404);

  // Página da peça: botão principal + barra fixa no celular
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/produtos/gaiola-santo-antonio-6-pontos-basica");
  await expect(page.getByRole("link", { name: "Pedir pelo WhatsApp" })).toBeVisible();
  await page.mouse.wheel(0, 2500);
  await expect(page.getByRole("link", { name: "Pedir no WhatsApp" }).last()).toBeInViewport();
});

test("painel enxuto: cadastro com fotos, edição de quantidade e loja atualizada", async ({ page, context }) => {
  await login(page);
  await expect(page).toHaveURL(/\/admin\/produtos$/);
  const nav = page.getByRole("navigation", { name: "Navegação do painel" });
  await expect(nav.getByRole("link")).toHaveText(["Produtos", "Usuários", "Minha conta", "Ver loja"]);
  for (const rota of ["/admin/pedidos", "/admin/estoque", "/admin/dre", "/admin/mensagens"]) {
    expect((await page.goto(rota))?.status()).toBe(404);
  }

  // Cadastro com fotos
  const sku = `TRA-WA-${Date.now().toString(36).toUpperCase()}`;
  await page.goto("/admin/produtos/novo");
  await page.fill("#product-name", `Coroa e Pinhão 9x33 WA ${sku}`);
  await page.fill("#product-sku", sku);
  await page.click("#product-category");
  await page.getByRole("option", { name: "Transmissão" }).click();
  await page.fill("#product-cost", "300");
  await page.fill("#product-price", "690");
  await page.fill("#product-initial-stock", "2");
  await page.setInputFiles("#product-photos", FOTOS);
  await expect(page.getByText("Capa", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publicar na loja" }).click();
  await page.waitForURL((u) => /^\/admin\/produtos\/(?!novo)[^/]+$/.test(u.pathname), { timeout: 60_000 });

  // Loja mostra a peça disponível
  const shop = await context.newPage();
  await shop.goto("/produtos?categoria=transmissao");
  const card = shop.locator("div.group", { hasText: sku.slice(-6) }).first();
  await expect(shop.getByText(`Coroa e Pinhão 9x33 WA ${sku}`)).toBeVisible();
  await expect(card).toBeVisible();

  // Vendeu pelo WhatsApp: zera a quantidade no cadastro → "Esgotado" na loja
  await page.fill("#product-stock", "0");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.waitForURL(/\/admin\/produtos$/);
  await expect(page.locator("tr", { hasText: sku })).toContainText("0");
  await shop.reload();
  await expect(shop.locator("div.group", { hasText: `WA ${sku}` }).getByText("Esgotado")).toBeVisible();
});
