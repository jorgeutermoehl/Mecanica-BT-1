import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStorageDriver } from "@/server/storage";
import { logAudit } from "@/server/audit";

/**
 * Pipeline de mídia (ESPEC-V2, Onda 2 itens 9-10).
 * - Validação por MAGIC BYTES (nunca extensão/mimetype do form).
 * - SVG rejeitado em TODOS os uploads (vetor de XSS).
 * - storageKey = cuid + extensão canonizada (nome nunca vem do usuário).
 * - 4 variantes WebP: thumb 160 / card 480 / detail 1000 / zoom 1600.
 */

export const MEDIA_KINDS = ["PRODUCT_IMAGE", "CATEGORY_IMAGE", "BRAND_LOGO", "ATTACHMENT"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
export const mediaKindSchema = z.enum(MEDIA_KINDS);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
export const MIN_IMAGE_DIMENSION = 600;
export const MAX_IMAGES_PER_PRODUCT = 8;

export const VARIANTS = [
  { name: "thumb", width: 160 },
  { name: "card", width: 480 },
  { name: "detail", width: 1000 },
  { name: "zoom", width: 1600 },
] as const;

export type VariantName = (typeof VARIANTS)[number]["name"];

/** Detecta o formato REAL pelo cabeçalho binário. SVG (texto) nunca passa. */
export function sniffImageFormat(buf: Buffer): "jpeg" | "png" | "webp" | "avif" | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 12) === "ftypavif" || buf.toString("ascii", 4, 12) === "ftypavis") return "avif";
  return null;
}

export interface StoredImage {
  mediaFileId: string;
  /** URL canônica da variante "detail". */
  url: string;
  variants: Record<VariantName, string>;
}

/**
 * Valida, gera variantes e persiste uma imagem. Dedup por SHA-256: o mesmo
 * binário enviado duas vezes reaproveita o MediaFile existente.
 */
export async function storeImage(opts: {
  data: Buffer;
  originalName: string;
  kind: MediaKind;
  userId: string;
}): Promise<StoredImage> {
  const { data, originalName, kind, userId } = opts;

  if (data.length === 0) throw new Error("Arquivo vazio.");
  if (data.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Arquivo acima de ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
  }
  const format = sniffImageFormat(data);
  if (!format) {
    throw new Error("Formato não permitido — envie JPEG, PNG, WebP ou AVIF (SVG não é aceito).");
  }

  const meta = await sharp(data).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    throw new Error(`Imagem muito pequena — mínimo ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px.`);
  }

  const checksum = createHash("sha256").update(data).digest("hex");
  const existing = await prisma.mediaFile.findFirst({
    where: { checksumSha256: checksum, kind, deletedAt: null },
  });
  if (existing) {
    const variants = JSON.parse(existing.variants ?? "{}") as Record<VariantName, string>;
    return { mediaFileId: existing.id, url: variants.detail ?? `/api/media/${existing.storageKey}`, variants };
  }

  const driver = getStorageDriver();
  const id = randomUUID();
  const baseKey = `${kind.toLowerCase().replace(/_/g, "-")}/${id}`;

  // Original canonizado + 4 variantes WebP.
  const originalKey = `${baseKey}/original.${format === "jpeg" ? "jpg" : format}`;
  await driver.put(originalKey, data);

  const variantEntries: [VariantName, string][] = [];
  for (const v of VARIANTS) {
    const buf = await sharp(data)
      .rotate() // respeita EXIF orientation
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const key = `${baseKey}/${v.name}.webp`;
    await driver.put(key, buf);
    variantEntries.push([v.name, driver.publicUrl(key)]);
  }
  const variants = Object.fromEntries(variantEntries) as Record<VariantName, string>;

  const media = await prisma.$transaction(async (tx) => {
    const created = await tx.mediaFile.create({
      data: {
        storageKey: originalKey,
        originalName: originalName.slice(0, 200),
        mimeType: format === "jpeg" ? "image/jpeg" : `image/${format}`,
        sizeBytes: data.length,
        width,
        height,
        checksumSha256: checksum,
        variants: JSON.stringify(variants),
        kind,
        uploadedById: userId,
      },
    });
    await logAudit(tx, {
      userId,
      action: "MEDIA_UPLOAD",
      entity: "MediaFile",
      entityId: created.id,
      description: `Upload ${kind}: ${originalName.slice(0, 80)} (${width}x${height}, ${Math.round(data.length / 1024)}kB)`,
    });
    return created;
  });

  return { mediaFileId: media.id, url: variants.detail, variants };
}

/** URL de uma variante a partir do MediaFile (fallback: original). */
export function getImageUrl(
  file: { storageKey: string; variants: string | null },
  variant: VariantName,
): string {
  const variants = JSON.parse(file.variants ?? "{}") as Partial<Record<VariantName, string>>;
  return variants[variant] ?? `/api/media/${file.storageKey}`;
}
