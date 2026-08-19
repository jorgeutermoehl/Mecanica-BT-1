/**
 * Reconstrói o snapshot diário de vendas e verifica a consistência com
 * order_items (mesma base do DRE). Uso: npx tsx scripts/rebuild-sales-daily.ts
 */
import { rebuildSalesDaily, verifySalesDaily } from "../src/server/reports/aggregation";
import { prisma } from "../src/lib/prisma";

async function main() {
  const r = await rebuildSalesDaily();
  console.log(`Snapshot reconstruído: ${r.days} dia(s).`);
  const v = await verifySalesDaily();
  console.log(
    `Consistência snapshot × order_items: ${v.ok ? "OK" : "DIVERGÊNCIA"} — ` +
      `snapshot R$ ${v.snapshot.netRevenue.toFixed(2)} / ${v.snapshot.qtySold} un · ` +
      `fonte R$ ${v.source.netRevenue.toFixed(2)} / ${v.source.qtySold} un`,
  );
  process.exit(v.ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
