/**
 * Migração de fitment legado (ESPEC-V2, Onda 2 item 2, fase 2).
 * 1. Copia as strings antigas para legacyText (se ainda vazio).
 * 2. Tenta casar cada aplicação sem vehicleVersionId com uma versão do
 *    catálogo por slug de marca/modelo (match conservador — sem fuzzy
 *    arriscado: homônimo errado é pior que fila de revisão).
 * 3. Lista o que NÃO casou para revisão manual (badge "fitment pendente").
 *
 * Idempotente. Uso: npx tsx scripts/migrate-fitment.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const apps = await prisma.productApplication.findMany({
    where: { vehicleVersionId: null },
    include: { product: { select: { sku: true, name: true } } },
  });

  let matched = 0;
  const unmatched: string[] = [];

  for (const app of apps) {
    // Fase 1: preserva a concatenação antiga.
    if (!app.legacyText) {
      const legacy = [app.vehicleBrand, app.vehicleModel, app.engine].filter(Boolean).join(" ");
      await prisma.productApplication.update({
        where: { id: app.id },
        data: { legacyText: legacy },
      });
    }

    // Fase 2: match por marca+modelo normalizados.
    const model = await prisma.vehicleModel.findFirst({
      where: { slug: slugify(app.vehicleModel), make: { slug: slugify(app.vehicleBrand) }, isActive: true },
      include: { versions: { where: { isActive: true } } },
    });
    if (!model || model.versions.length === 0) {
      unmatched.push(`${app.product.sku} — ${app.vehicleBrand} ${app.vehicleModel}${app.engine ? ` ${app.engine}` : ""}`);
      continue;
    }

    // Uma única versão no modelo = match direto. Várias: tenta por motor,
    // senão por interseção da faixa de anos; ambíguo vai para revisão.
    let version = model.versions.length === 1 ? model.versions[0] : null;
    if (!version && app.engine) {
      const byEngine = model.versions.filter(
        (v) => v.engine && v.engine.toLowerCase() === app.engine!.toLowerCase(),
      );
      if (byEngine.length === 1) version = byEngine[0];
    }
    if (!version && app.yearStart) {
      const byYears = model.versions.filter(
        (v) => v.yearStart <= (app.yearEnd ?? app.yearStart!) && (v.yearEnd ?? 9999) >= app.yearStart!,
      );
      if (byYears.length === 1) version = byYears[0];
    }
    if (!version) {
      unmatched.push(`${app.product.sku} — ${app.vehicleBrand} ${app.vehicleModel} (ambíguo: ${model.versions.length} versões)`);
      continue;
    }

    // Respeita a unicidade [productId, vehicleVersionId].
    const dupe = await prisma.productApplication.findFirst({
      where: { productId: app.productId, vehicleVersionId: version.id },
    });
    if (dupe) {
      await prisma.productApplication.delete({ where: { id: app.id } });
      matched++;
      continue;
    }

    await prisma.productApplication.update({
      where: { id: app.id },
      data: { vehicleVersionId: version.id },
    });
    matched++;
  }

  console.log(`Fitment migrado: ${matched} aplicação(ões) casadas com o catálogo.`);
  if (unmatched.length > 0) {
    console.log(`\n⚠ ${unmatched.length} pendente(s) para revisão manual (badge "fitment pendente"):`);
    for (const u of unmatched) console.log(`  - ${u}`);
  } else {
    console.log("Nenhuma pendência — todos os legados casaram.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
