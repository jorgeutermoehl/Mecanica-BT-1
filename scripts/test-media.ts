/**
 * Teste do pipeline de mídia (ESPEC-V2, Onda 2 itens 9-10):
 * SVG rejeitado · dimensão mínima · 4 variantes WebP · dedup SHA-256.
 * Auto-limpante. Uso: npx tsx scripts/test-media.ts
 */
import sharp from "sharp";
import { promises as fs } from "fs";
import { sniffImageFormat, storeImage } from "../src/server/media";
import { prisma } from "../src/lib/prisma";

let failed = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

async function main() {
  console.log("== PIPELINE DE MÍDIA ==");

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  check("SVG rejeitado por magic bytes", sniffImageFormat(svg) === null);

  const fakeJpg = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(64)]);
  check("GIF disfarçado de .jpg rejeitado", sniffImageFormat(fakeJpg) === null);

  const admin = await prisma.user.findFirst({ where: { email: "admin@fullboost.com.br" } });
  if (!admin) throw new Error("Rode o seed antes (admin ausente).");

  const small = await sharp({ create: { width: 200, height: 200, channels: 3, background: "#333" } })
    .jpeg()
    .toBuffer();
  try {
    await storeImage({ data: small, originalName: "small.jpg", kind: "PRODUCT_IMAGE", userId: admin.id });
    check("dimensão mínima 600px aplicada", false, "aceitou 200px");
  } catch (e) {
    check("dimensão mínima 600px aplicada", true, (e as Error).message);
  }

  const big = await sharp({ create: { width: 900, height: 900, channels: 3, background: "#ed2110" } })
    .jpeg()
    .toBuffer();
  const a = await storeImage({ data: big, originalName: "roda.jpg", kind: "PRODUCT_IMAGE", userId: admin.id });
  const names = Object.keys(a.variants).sort().join(",");
  check("4 variantes geradas", names === "card,detail,thumb,zoom", names);

  const b = await storeImage({ data: big, originalName: "roda-copia.jpg", kind: "PRODUCT_IMAGE", userId: admin.id });
  check("dedup por SHA-256", a.mediaFileId === b.mediaFileId);

  const onDisk = await fs.readdir("uploads/product-image").then((d) => d.length).catch(() => 0);
  check("arquivos gravados no storage local", onDisk === 1, `${onDisk} pasta(s)`);

  // Limpeza (teste não deixa rastro no banco nem no disco).
  await prisma.auditLog.deleteMany({ where: { entity: "MediaFile", entityId: a.mediaFileId } });
  await prisma.mediaFile.delete({ where: { id: a.mediaFileId } });
  await fs.rm("uploads", { recursive: true, force: true });
  console.log(failed === 0 ? "\n✅ Pipeline de mídia OK." : `\n❌ ${failed} falha(s).`);
  process.exit(failed === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
