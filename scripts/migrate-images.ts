/**
 * Migração de imagens externas (ESPEC-V2, Onda 2 item 12): baixa cada
 * ProductImage.url hotlinkada (http/https), passa pelo pipeline de mídia
 * (magic bytes + variantes WebP) e reescreve a url para a rota local.
 * Encerra a dupla fonte de verdade url/mediaFileId.
 *
 * Idempotente: imagens já locais (/api/media/...) são puladas.
 * Uso: npx tsx scripts/migrate-images.ts
 */
import { PrismaClient } from "@prisma/client";
import { storeImage } from "../src/server/media";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: { slug: "admin" } } });
  if (!admin) throw new Error("Usuário admin não encontrado — rode o seed.");

  const images = await prisma.productImage.findMany({
    where: { url: { startsWith: "http" }, mediaFileId: null },
    include: { product: { select: { sku: true, name: true } } },
  });

  if (images.length === 0) {
    console.log("Nada a migrar — nenhuma imagem hotlinkada sem MediaFile.");
    return;
  }

  let ok = 0;
  const failures: string[] = [];

  for (const image of images) {
    try {
      const res = await fetch(image.url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = Buffer.from(await res.arrayBuffer());

      const stored = await storeImage({
        data,
        originalName: `${image.product.sku.toLowerCase()}.jpg`,
        kind: "PRODUCT_IMAGE",
        userId: admin.id,
      });

      await prisma.productImage.update({
        where: { id: image.id },
        data: { url: stored.url, mediaFileId: stored.mediaFileId },
      });
      ok++;
      console.log(`  ✓ ${image.product.sku} → ${stored.url}`);
    } catch (e) {
      failures.push(`${image.product.sku}: ${(e as Error).message}`);
    }
  }

  console.log(`\nMigradas: ${ok}/${images.length}.`);
  if (failures.length > 0) {
    console.log("Falhas (mantêm o hotlink até nova tentativa):");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(2);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
