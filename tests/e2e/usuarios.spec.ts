import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** Gestão de usuários do painel + troca de senha (derruba sessões antigas). */

test("admin cria vendedor; vendedor troca a senha e não vê Usuários", async ({ browser }) => {
  const stamp = Date.now().toString(36);
  const email = `vendedor.${stamp}@example.com`;
  const senha1 = `Inicial${stamp}9`;
  const senha2 = `Nova${stamp}Senha7`;

  // Admin cria o usuário
  const admin = await browser.newPage();
  await login(admin);
  await admin.goto("/admin/usuarios");
  await admin.getByRole("button", { name: "Novo usuário" }).click();
  await admin.fill("#new-user-name", "Vendedor E2E");
  await admin.fill("#new-user-email", email);
  await admin.fill("#new-user-password", senha1);
  await admin.getByRole("button", { name: "Criar usuário" }).click();
  await expect(admin.getByRole("cell", { name: email })).toBeVisible();

  // Vendedor entra em dois "aparelhos"
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();
  for (const p of [a, b]) await login(p, email, senha1);
  await expect(a.getByRole("link", { name: "Usuários" })).toHaveCount(0);
  expect((await a.goto("/admin/usuarios"))?.status()).toBe(404);

  // Troca a senha no aparelho A
  await a.goto("/admin/conta");
  await a.fill("#current-password", senha1);
  await a.fill("#new-password", senha2);
  await a.fill("#confirm-password", senha2);
  await a.getByRole("button", { name: "Alterar senha" }).click();
  await expect(a.getByText("Senha alterada")).toBeVisible();

  // A continua logado; B (sessão antiga) cai para o login
  await a.goto("/admin");
  await expect(a).toHaveURL(/\/admin(\/produtos)?$/);
  await b.goto("/admin");
  await expect(b).toHaveURL(/\/admin\/login/);

  await ctxA.close();
  await ctxB.close();
});
