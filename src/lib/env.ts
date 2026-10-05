/**
 * Validação das variáveis de ambiente de PRODUÇÃO. Chamado no boot do
 * servidor (src/instrumentation.ts): configuração faltando ou de exemplo
 * derruba o deploy na hora, em vez de virar falha silenciosa (ex.: sessão
 * assinada com segredo público, botão de WhatsApp para número inexistente).
 */

const DEFAULT_SECRETS = new Set([
  "troque-este-segredo-em-producao",
  "fullboost-dev-secret-change-me-in-production",
]);

export function productionEnvProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  const problems: string[] = [];
  const secret = env.AUTH_SECRET ?? "";
  if (secret.length < 32 || DEFAULT_SECRETS.has(secret)) {
    problems.push("AUTH_SECRET ausente, de exemplo ou com menos de 32 caracteres (gere com: openssl rand -base64 48)");
  }
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP ?? "";
  if (!/^\d{12,13}$/.test(whatsapp) || /^550+$/.test(whatsapp)) {
    problems.push("NEXT_PUBLIC_WHATSAPP ausente ou de exemplo (formato: 55 + DDD + número, ex.: 5547999999999)");
  }
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!siteUrl.startsWith("https://")) {
    problems.push("NEXT_PUBLIC_SITE_URL precisa ser a URL pública com https://");
  }
  if (env.STORAGE_DRIVER === "supabase" && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    problems.push("STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  }
  if (env.VERCEL && env.STORAGE_DRIVER !== "supabase") {
    problems.push("Na Vercel o disco é apagado a cada deploy — configure STORAGE_DRIVER=supabase para as fotos");
  }
  if (env.DATABASE_URL?.startsWith("file:")) {
    problems.push("DATABASE_URL aponta para SQLite — use Postgres em produção (docs/DEPLOY.md)");
  }
  return problems;
}

export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  // Escape consciente para rodar o build de produção localmente (testes/CI).
  if (process.env.ALLOW_DEMO_ENV === "1") return;
  const problems = productionEnvProblems();
  if (problems.length > 0) {
    throw new Error(`Configuração de produção inválida:\n- ${problems.join("\n- ")}`);
  }
}
