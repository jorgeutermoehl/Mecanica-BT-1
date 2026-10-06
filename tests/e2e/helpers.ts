import type { Page } from "@playwright/test";

/** Modo do build testado (mesma env do build: NEXT_PUBLIC_SALES_MODE). */
export const CHECKOUT = process.env.NEXT_PUBLIC_SALES_MODE === "checkout";

export const ADMIN = { email: "admin@fullboost.com.br", password: "fullboost123" };

/** Login no painel; termina em /admin (checkout) ou /admin/produtos (WhatsApp). */
export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/admin/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin") && !u.pathname.startsWith("/admin/login"));
}
