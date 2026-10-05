import { defineConfig, devices } from "@playwright/test";

/**
 * Teste ponta a ponta do fluxo de venda (painel → loja → pedido → painel).
 * Pré-requisito: `npm run build` + banco de demonstração recém-seedado.
 * O servidor sobe em modo produção (ALLOW_DEMO_ENV libera a checagem de env).
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { ALLOW_DEMO_ENV: "1" },
  },
});
