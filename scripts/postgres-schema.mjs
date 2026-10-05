// Gera prisma/postgres/schema.prisma a partir de prisma/schema.prisma (SQLite).
// Fonte ÚNICA de modelos = prisma/schema.prisma; produção (Postgres/Supabase)
// usa a cópia gerada com provider postgresql + directUrl (migrations fora do pooler).
//   node scripts/postgres-schema.mjs          → (re)gera
//   node scripts/postgres-schema.mjs --check  → falha se estiver desatualizado (CI)
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC = "prisma/schema.prisma";
const OUT = "prisma/postgres/schema.prisma";

const src = readFileSync(SRC, "utf8");
const datasource = /datasource db \{[^}]*\}/;
if (!datasource.test(src)) throw new Error("datasource db não encontrado em " + SRC);

const out =
  "// ARQUIVO GERADO por scripts/postgres-schema.mjs — NÃO EDITE.\n" +
  "// Edite prisma/schema.prisma e rode `npm run db:pg:schema`.\n\n" +
  src.replace(
    datasource,
    `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Supabase: DATABASE_URL = pooler (6543, ?pgbouncer=true); DIRECT_URL = conexão direta (5432) p/ migrations.
  directUrl = env("DIRECT_URL")
}`,
  );

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== out) {
    console.error(`${OUT} desatualizado — rode: npm run db:pg:schema`);
    process.exit(1);
  }
  console.log(`${OUT} em dia.`);
} else {
  writeFileSync(OUT, out);
  console.log(`Gerado ${OUT}`);
}
