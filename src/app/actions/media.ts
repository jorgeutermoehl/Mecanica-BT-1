"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, requireStaff } from "@/lib/auth";
import { CATALOG_TAG } from "@/server/catalog";
import { logAudit } from "@/server/audit";
import { MAX_IMAGES_PER_PRODUCT, storeImage } from "@/server/media";

export type MediaActionResult = { ok: boolean; error?: string };

function fail(e: unknown): MediaActionResult {
  if (e instanceof Error) {
    if (e.message === "NOT_AUTHENTICATED" || e.message === "NOT_AUTHORIZED") {
      return { ok: false, error: "Sessão expirada — faça login novamente." };
    }
    return { ok: false, error: e.message };
  }
  return { ok: false, error: "Erro inesperado." };
}

const uploadMetaSchema = z.object({
  productId: z.string().min(1),
  alt: z.string().min(3, "Descreva a imagem (texto alternativo)").max(200),
});

/**
 * Upload de imagem de produto (ESPEC-V2, Onda 2 item 10).
 * Validação dupla: o client restringe tipo/tamanho, e AQUI revalidamos por
 * magic bytes, dimensão mínima e limite de imagens — nunca confiar no form.
 */
export async function uploadProductImageAction(formData: FormData): Promise<
  MediaActionResult & { imageId?: string; url?: string }
> {
  try {
    const user = await requireStaff();
    const parsed = uploadMetaSchema.safeParse({
      productId: formData.get("productId"),
      alt: formData.get("alt"),
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Selecione um arquivo de imagem." };

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      include: { _count: { select: { images: true } } },
    });
    if (!product || product.deletedAt) return { ok: false, error: "Produto não encontrado." };
    if (product._count.images >= MAX_IMAGES_PER_PRODUCT) {
      return { ok: false, error: `Máximo de ${MAX_IMAGES_PER_PRODUCT} imagens por produto.` };
    }

    const data = Buffer.from(await file.arrayBuffer());
    const stored = await storeImage({
      data,
      originalName: file.name,
      kind: "PRODUCT_IMAGE",
      userId: user.id,
    });

    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        url: stored.url,
        mediaFileId: stored.mediaFileId,
        alt: parsed.data.alt,
        position: product._count.images,
        isPrimary: product._count.images === 0,
      },
    });

    revalidateTag(CATALOG_TAG, "max");
    revalidatePath(`/admin/produtos/${product.id}`);
    return { ok: true, imageId: image.id, url: stored.url };
  } catch (e) {
    return fail(e);
  }
}

/** Remove o VÍNCULO ProductImage; o MediaFile fica para auditoria. */
export async function removeProductImageAction(imageId: string): Promise<MediaActionResult> {
  try {
    const user = await requireStaff();
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return { ok: false, error: "Imagem não encontrada." };

    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });
      // Exatamente 1 primária: promove a próxima se a removida era a principal.
      if (image.isPrimary) {
        const next = await tx.productImage.findFirst({
          where: { productId: image.productId },
          orderBy: { position: "asc" },
        });
        if (next) {
          await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
        }
      }
      await logAudit(tx, {
        userId: user.id,
        action: "MEDIA_DELETE",
        entity: "ProductImage",
        entityId: imageId,
        description: `Imagem desvinculada do produto (MediaFile preservado p/ auditoria)`,
      });
    });

    revalidateTag(CATALOG_TAG, "max");
    revalidatePath(`/admin/produtos/${image.productId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Define a imagem principal — desmarca as demais NA MESMA transação. */
export async function setPrimaryImageAction(imageId: string): Promise<MediaActionResult> {
  try {
    await requireStaff();
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return { ok: false, error: "Imagem não encontrada." };

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: image.productId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);

    revalidateTag(CATALOG_TAG, "max");
    revalidatePath(`/admin/produtos/${image.productId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Reordena a galeria (lista completa de ids na nova ordem). */
export async function reorderProductImagesAction(
  productId: string,
  orderedIds: string[],
): Promise<MediaActionResult> {
  try {
    await requireStaff();
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return { ok: false, error: "Ordem inválida." };
    }
    const images = await prisma.productImage.findMany({ where: { productId } });
    const known = new Set(images.map((i) => i.id));
    if (orderedIds.length !== images.length || !orderedIds.every((id) => known.has(id))) {
      return { ok: false, error: "Lista de imagens desatualizada — recarregue a página." };
    }
    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.productImage.update({ where: { id }, data: { position } }),
      ),
    );
    revalidateTag(CATALOG_TAG, "max");
    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Limpeza de arquivos órfãos (requireRole ADMIN): MediaFile sem NENHUMA
 * referência há 30+ dias vira deletedAt (soft-delete). Exclusão física do
 * binário é sempre manual e nunca de arquivo referenciado.
 */
export async function cleanupOrphanMediaAction(): Promise<
  MediaActionResult & { marked?: number }
> {
  try {
    const user = await requireRole("admin");
    const cutoff = new Date(Date.now() - 30 * 86_400_000);
    const orphans = await prisma.mediaFile.findMany({
      where: {
        deletedAt: null,
        createdAt: { lt: cutoff },
        productImages: { none: {} },
        categoryImages: { none: {} },
      },
      select: { id: true },
    });
    if (orphans.length === 0) return { ok: true, marked: 0 };

    await prisma.$transaction(async (tx) => {
      await tx.mediaFile.updateMany({
        where: { id: { in: orphans.map((o) => o.id) } },
        data: { deletedAt: new Date() },
      });
      await logAudit(tx, {
        userId: user.id,
        action: "MEDIA_DELETE",
        entity: "MediaFile",
        description: `Limpeza de órfãos: ${orphans.length} arquivo(s) sem referência há 30+ dias marcados`,
      });
    });
    return { ok: true, marked: orphans.length };
  } catch (e) {
    return fail(e);
  }
}
