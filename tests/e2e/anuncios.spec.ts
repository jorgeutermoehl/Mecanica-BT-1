import { expect, test } from "@playwright/test";

/** Anúncios em foco, condição da peça, "sob consulta" e categoria desativada. */

test("home mostra o foco do momento com selos de condição", async ({ page }) => {
  await page.goto("/");
  const foco = page.locator("section", { has: page.getByRole("heading", { name: "Em destaque" }) });
  await expect(foco).toBeVisible();
  await expect(foco.getByText("Gaiola Santo Antônio 6 Pontos — Básica")).toBeVisible();
  await expect(foco.getByText("Novo", { exact: true }).first()).toBeVisible();
  await expect(foco.getByText("Usado", { exact: true }).first()).toBeVisible();
});

test("anúncio sob consulta não vai ao carrinho e leva ao WhatsApp", async ({ page }) => {
  await page.goto("/produtos/virabrequim-modelos-diversos-usado");
  await expect(page.getByText("Sob consulta").first()).toBeVisible();
  // Sem seletor de quantidade/carrinho na área de compra (os relacionados abaixo têm o deles).
  await expect(page.getByRole("group", { name: "Selecionar quantidade" })).toHaveCount(0);
  const wa = await page.getByRole("link", { name: /Consultar modelos e preço no WhatsApp/ }).getAttribute("href");
  expect(decodeURIComponent(wa ?? "")).toContain("Virabrequim");
});

test("gaiola com preço da tabela e observações no pedido", async ({ page }) => {
  await page.goto("/produtos/gaiola-santo-antonio-6-pontos-portas-e-painel");
  await expect(page.getByText("R$ 1.850,00").first()).toBeVisible();
  await expect(page.getByText(/Gol G2, G3 e G4/).first()).toBeVisible();
  await expect(page.getByRole("group", { name: "Selecionar quantidade" })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).first().click();
  await page.goto("/checkout");
  await expect(page.locator("#notes")).toBeVisible();
});

test("categoria de rodas e pneus fica desativada", async ({ page }) => {
  await page.goto("/produtos");
  await expect(page.getByText("Rodas & Pneus")).toHaveCount(0);
  await page.goto("/produtos?categoria=rodas");
  await expect(page.getByText("Rodas & Pneus")).toHaveCount(0);
});
