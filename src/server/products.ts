import { prisma } from "@/lib/prisma";
import type { ProductInput, ProductStatus } from "@/lib/validations";
import { logAudit } from "@/server/audit";

/**
 * Serviço de produtos do painel. Regras:
 *  - Estoque NUNCA é editado direto: nasce/muda via InventoryMovement.
 *  - Exclusão é lógica (status INACTIVE) — nunca física.
 *  - Todo produto criado como ACTIVE é publicado imediatamente na loja.
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function listAdminProducts(search?: string) {
  const q = search?.trim();
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { sku: { contains: q } },
              { originalCode: { contains: q } },
            ],
          }
        : {}),
    },
    include: { category: true, brand: true, images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
    brand: p.brand?.name ?? null,
    costPrice: Number(p.costPrice),
    salePrice: Number(p.salePrice),
    promoPrice: p.promoPrice !== null ? Number(p.promoPrice) : null,
    stock: p.stockQuantity,
    minStock: p.minStock,
    status: p.status as ProductStatus,
    image: p.images[0]?.url ?? null,
    createdAt: p.createdAt.toISOString(),
  }));
}

export type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number];

export async function getAdminProduct(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, images: true },
  });
  if (!p || p.deletedAt) return null;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    categoryId: p.categoryId,
    brandName: p.brand?.name ?? "",
    originalCode: p.originalCode ?? "",
    description: p.description ?? "",
    technicalSpecs: p.technicalSpecs ?? "",
    fitment: p.fitment ?? "",
    warranty: p.warranty ?? "",
    location: p.location ?? "",
    imageUrl: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "",
    costPrice: Number(p.costPrice),
    salePrice: Number(p.salePrice),
    promoPrice: p.promoPrice !== null ? Number(p.promoPrice) : undefined,
    stock: p.stockQuantity,
    minStock: p.minStock,
    status: p.status as ProductStatus,
  };
}

async function ensureBrand(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], name?: string) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const existing = await tx.brand.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await tx.brand.create({ data: { name: trimmed, slug } });
  return created.id;
}

/** Cria produto (publicado na loja) + estoque inicial via movimento ENTRY. */
export async function createProduct(input: ProductInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const sku = input.sku.trim().toUpperCase();
    const existingSku = await tx.product.findUnique({ where: { sku } });
    if (existingSku) throw new Error("Já existe um produto com esse SKU.");

    let slug = slugify(input.name);
    if (await tx.product.findUnique({ where: { slug } })) {
      slug = `${slug}-${sku.toLowerCase()}`;
    }

    const brandId = await ensureBrand(tx, input.brandName);
    const initialStock = input.initialStock ?? 0;
    const promo = input.promoPrice;

    const product = await tx.product.create({
      data: {
        sku,
        name: input.name.trim(),
        slug,
        categoryId: input.categoryId,
        brandId,
        originalCode: input.originalCode || null,
        description: input.description || null,
        technicalSpecs: input.technicalSpecs || null,
        fitment: input.fitment || null,
        warranty: input.warranty || null,
        location: input.location || null,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        promoPrice: promo ?? null,
        stockQuantity: initialStock,
        minStock: input.minStock ?? 0,
        status: initialStock > 0 ? (promo ? "PROMOTION" : "ACTIVE") : "OUT_OF_STOCK",
        ...(input.imageUrl
          ? { images: { create: [{ url: input.imageUrl, alt: input.name, isPrimary: true }] } }
          : {}),
      },
    });

    if (initialStock > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "ENTRY",
          direction: "IN",
          quantity: initialStock,
          unitCost: input.costPrice,
          balanceBefore: 0,
          balanceAfter: initialStock,
          reason: "Estoque inicial (cadastro do produto)",
          userId,
        },
      });
    }

    await logAudit(tx, {
      userId,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: product.id,
      description: `Produto ${sku} cadastrado e publicado na loja`,
    });

    return { id: product.id, slug: product.slug };
  });
}

/** Atualiza dados cadastrais (estoque só muda via movimentos). */
export async function updateProduct(id: string, input: ProductInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id }, include: { images: true } });
    if (!current || current.deletedAt) throw new Error("Produto não encontrado.");

    const sku = input.sku.trim().toUpperCase();
    const skuOwner = await tx.product.findUnique({ where: { sku } });
    if (skuOwner && skuOwner.id !== id) throw new Error("Já existe outro produto com esse SKU.");

    const brandId = await ensureBrand(tx, input.brandName);
    const promo = input.promoPrice;

    await tx.product.update({
      where: { id },
      data: {
        sku,
        name: input.name.trim(),
        categoryId: input.categoryId,
        brandId,
        originalCode: input.originalCode || null,
        description: input.description || null,
        technicalSpecs: input.technicalSpecs || null,
        fitment: input.fitment || null,
        warranty: input.warranty || null,
        location: input.location || null,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        promoPrice: promo ?? null,
        minStock: input.minStock ?? 0,
        status:
          current.stockQuantity <= 0
            ? "OUT_OF_STOCK"
            : promo
              ? "PROMOTION"
              : current.status === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE",
      },
    });

    // Imagem principal: substitui se mudou.
    const primary = current.images.find((i) => i.isPrimary) ?? current.images[0];
    if (input.imageUrl && input.imageUrl !== primary?.url) {
      if (primary) {
        await tx.productImage.update({ where: { id: primary.id }, data: { url: input.imageUrl } });
      } else {
        await tx.productImage.create({
          data: { productId: id, url: input.imageUrl, alt: input.name, isPrimary: true },
        });
      }
    }

    const priceChanged =
      Number(current.salePrice) !== input.salePrice ||
      (current.promoPrice !== null ? Number(current.promoPrice) : undefined) !== promo;
    await logAudit(tx, {
      userId,
      action: priceChanged ? "PRICE_CHANGE" : "PRODUCT_UPDATE",
      entity: "Product",
      entityId: id,
      description: `Produto ${sku} atualizado`,
      before: { salePrice: Number(current.salePrice), promoPrice: current.promoPrice !== null ? Number(current.promoPrice) : null },
      after: { salePrice: input.salePrice, promoPrice: promo ?? null },
    });
  });
}

/** Ativa/inativa o anúncio (soft delete = INACTIVE). */
export async function setProductStatus(id: string, active: boolean, userId: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) throw new Error("Produto não encontrado.");

  const status = active ? (product.stockQuantity > 0 ? (product.promoPrice ? "PROMOTION" : "ACTIVE") : "OUT_OF_STOCK") : "INACTIVE";

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: { status } });
    await logAudit(tx, {
      userId,
      action: active ? "PRODUCT_UPDATE" : "PRODUCT_DEACTIVATE",
      entity: "Product",
      entityId: id,
      description: `Produto ${product.sku} ${active ? "reativado na loja" : "removido da loja (soft delete)"}`,
      before: { status: product.status },
      after: { status },
    });
  });
}

/** Categorias para selects do painel. */
export async function listCategoryOptions() {
  const cats = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });
  return cats;
}
