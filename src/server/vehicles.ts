import { prisma } from "@/lib/prisma";
import type {
  FuelType,
  ProductApplicationInput,
  VehicleMakeInput,
  VehicleModelInput,
  VehicleVersionInput,
} from "@/lib/validations";
import { logAudit } from "@/server/audit";

/**
 * Catálogo de veículos e fitment (ESPEC-V2, Onda 2).
 * Modelo ÚNICO de compatibilidade: ProductApplication.vehicleVersionId.
 * Soft-delete via isActive; delete físico só em tabela de vínculo (aplicações).
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Rótulo canônico de uma versão (ex.: "Volkswagen Golf GTI Mk7 2014–2019"). */
export function versionLabel(v: {
  name: string;
  yearStart: number;
  yearEnd: number | null;
  model: { name: string; make: { name: string } };
}): string {
  const years = v.yearEnd ? `${v.yearStart}–${v.yearEnd}` : `${v.yearStart}+`;
  return `${v.model.make.name} ${v.model.name} ${v.name} ${years}`;
}

// ---------------------------------------------------------------------------
// Leitura (árvore do admin + cascata de selects)
// ---------------------------------------------------------------------------

/** Árvore Marca→Modelo→Versão para /admin/veiculos. */
export async function getVehicleTree() {
  const makes = await prisma.vehicleMake.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      models: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          versions: {
            where: { isActive: true },
            orderBy: [{ yearStart: "desc" }, { name: "asc" }],
            include: { _count: { select: { applications: true } } },
          },
        },
      },
    },
  });

  return makes.map((make) => ({
    id: make.id,
    name: make.name,
    slug: make.slug,
    models: make.models.map((model) => ({
      id: model.id,
      name: model.name,
      slug: model.slug,
      versions: model.versions.map((v) => ({
        id: v.id,
        name: v.name,
        yearStart: v.yearStart,
        yearEnd: v.yearEnd,
        engine: v.engine,
        fuel: (v.fuel as FuelType | null) ?? null,
        chassis: v.chassis,
        notes: v.notes,
        applicationsCount: v._count.applications,
      })),
    })),
  }));
}

export type VehicleTree = Awaited<ReturnType<typeof getVehicleTree>>;

/** Opções em cascata para comboboxes (FitmentEditor / Meu Carro). */
export async function getVehicleOptions(level: "makes"): Promise<{ id: string; label: string }[]>;
export async function getVehicleOptions(level: "models", parentId: string): Promise<{ id: string; label: string }[]>;
export async function getVehicleOptions(level: "versions", parentId: string): Promise<{ id: string; label: string }[]>;
export async function getVehicleOptions(
  level: "makes" | "models" | "versions",
  parentId?: string,
): Promise<{ id: string; label: string }[]> {
  if (level === "makes") {
    const makes = await prisma.vehicleMake.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return makes.map((m) => ({ id: m.id, label: m.name }));
  }
  if (level === "models") {
    const models = await prisma.vehicleModel.findMany({
      where: { isActive: true, makeId: parentId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return models.map((m) => ({ id: m.id, label: m.name }));
  }
  const versions = await prisma.vehicleVersion.findMany({
    where: { isActive: true, modelId: parentId },
    orderBy: [{ yearStart: "desc" }, { name: "asc" }],
    select: { id: true, name: true, yearStart: true, yearEnd: true, engine: true },
  });
  return versions.map((v) => ({
    id: v.id,
    label: `${v.name} ${v.yearEnd ? `${v.yearStart}–${v.yearEnd}` : `${v.yearStart}+`}${v.engine ? ` · ${v.engine}` : ""}`,
  }));
}

// ---------------------------------------------------------------------------
// Escrita (CRUD do admin)
// ---------------------------------------------------------------------------

export async function createVehicleMake(input: VehicleMakeInput, userId: string) {
  const slug = slugify(input.name);
  const existing = await prisma.vehicleMake.findUnique({ where: { slug } });
  if (existing) {
    if (existing.isActive) throw new Error("Já existe uma marca com esse nome.");
    await prisma.vehicleMake.update({ where: { id: existing.id }, data: { isActive: true } });
    return { id: existing.id };
  }
  const make = await prisma.vehicleMake.create({ data: { name: input.name.trim(), slug } });
  return { id: make.id };
}

export async function createVehicleModel(input: VehicleModelInput, userId: string) {
  const slug = slugify(input.name);
  const existing = await prisma.vehicleModel.findUnique({
    where: { makeId_slug: { makeId: input.makeId, slug } },
  });
  if (existing) {
    if (existing.isActive) throw new Error("Já existe esse modelo nessa marca.");
    await prisma.vehicleModel.update({ where: { id: existing.id }, data: { isActive: true } });
    return { id: existing.id };
  }
  const model = await prisma.vehicleModel.create({
    data: { makeId: input.makeId, name: input.name.trim(), slug },
  });
  return { id: model.id };
}

export async function createVehicleVersion(input: VehicleVersionInput, userId: string) {
  const version = await prisma.vehicleVersion.create({
    data: {
      modelId: input.modelId,
      name: input.name.trim(),
      yearStart: input.yearStart,
      yearEnd: input.yearEnd ?? null,
      engine: input.engine || null,
      fuel: input.fuel ?? null,
      chassis: input.chassis || null,
      notes: input.notes || null,
    },
  });
  return { id: version.id };
}

/** Soft-delete (isActive=false) — nunca remove versões com aplicações sem confirmação. */
export async function deactivateVehicleVersion(id: string, userId: string) {
  const version = await prisma.vehicleVersion.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });
  if (!version) throw new Error("Versão não encontrada.");
  await prisma.vehicleVersion.update({ where: { id }, data: { isActive: false } });
  return { applicationsCount: version._count.applications };
}

// ---------------------------------------------------------------------------
// Fitment do produto
// ---------------------------------------------------------------------------

/** Deriva o resumo Product.fitment a partir das aplicações vinculadas. */
async function refreshProductFitment(productId: string) {
  const apps = await prisma.productApplication.findMany({
    where: { productId, vehicleVersionId: { not: null } },
    include: { vehicleVersion: { include: { model: { include: { make: true } } } } },
    take: 4,
  });
  if (apps.length === 0) return;
  const labels = apps
    .filter((a) => a.vehicleVersion)
    .map((a) => `${a.vehicleVersion!.model.name} ${a.vehicleVersion!.name}`);
  const summary = [...new Set(labels)].slice(0, 3).join(" · ");
  await prisma.product.update({
    where: { id: productId },
    data: { fitment: summary || null },
  });
}

/** Aplicações vinculadas a um produto (aba Compatibilidade do admin). */
export async function listProductApplications(productId: string) {
  const apps = await prisma.productApplication.findMany({
    where: { productId },
    include: { vehicleVersion: { include: { model: { include: { make: true } } } } },
    orderBy: { vehicleBrand: "asc" },
  });
  return apps.map((a) => ({
    id: a.id,
    vehicleVersionId: a.vehicleVersionId,
    label: a.vehicleVersion
      ? versionLabel(a.vehicleVersion)
      : (a.legacyText ?? `${a.vehicleBrand} ${a.vehicleModel}`),
    pending: a.vehicleVersionId === null,
    yearStart: a.yearStart,
    yearEnd: a.yearEnd,
    engine: a.engine,
    notes: a.notes,
  }));
}

export type ProductApplicationRow = Awaited<ReturnType<typeof listProductApplications>>[number];

export async function addProductApplication(input: ProductApplicationInput, userId: string) {
  const version = await prisma.vehicleVersion.findUnique({
    where: { id: input.vehicleVersionId },
    include: { model: { include: { make: true } } },
  });
  if (!version) throw new Error("Versão de veículo não encontrada.");

  const existing = await prisma.productApplication.findFirst({
    where: { productId: input.productId, vehicleVersionId: input.vehicleVersionId },
  });
  if (existing) throw new Error("Este veículo já está vinculado ao produto.");

  await prisma.$transaction(async (tx) => {
    await tx.productApplication.create({
      data: {
        productId: input.productId,
        vehicleVersionId: input.vehicleVersionId,
        vehicleBrand: version.model.make.name,
        vehicleModel: version.model.name,
        yearStart: input.yearStart ?? null,
        yearEnd: input.yearEnd ?? null,
        engine: input.engine || version.engine,
        notes: input.notes || null,
      },
    });
    await logAudit(tx, {
      userId,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: input.productId,
      description: `Aplicação adicionada: ${versionLabel(version)}`,
    });
  });
  await refreshProductFitment(input.productId);
}

/** Delete físico aceitável em tabela de vínculo — registrado no audit. */
export async function removeProductApplication(applicationId: string, userId: string) {
  const app = await prisma.productApplication.findUnique({
    where: { id: applicationId },
    include: { vehicleVersion: { include: { model: { include: { make: true } } } } },
  });
  if (!app) throw new Error("Aplicação não encontrada.");

  await prisma.$transaction(async (tx) => {
    await tx.productApplication.delete({ where: { id: applicationId } });
    await logAudit(tx, {
      userId,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: app.productId,
      description: `Aplicação removida: ${
        app.vehicleVersion ? versionLabel(app.vehicleVersion) : (app.legacyText ?? app.vehicleModel)
      }`,
    });
  });
  await refreshProductFitment(app.productId);
}

/** Copia todas as aplicações de outro produto (famílias de peças compartilham fitment). */
export async function copyProductApplications(fromProductId: string, toProductId: string, userId: string) {
  const source = await prisma.productApplication.findMany({
    where: { productId: fromProductId, vehicleVersionId: { not: null } },
  });
  if (source.length === 0) throw new Error("O produto de origem não tem aplicações vinculadas.");

  const existing = await prisma.productApplication.findMany({
    where: { productId: toProductId },
    select: { vehicleVersionId: true },
  });
  const already = new Set(existing.map((e) => e.vehicleVersionId));
  const toCreate = source.filter((s) => !already.has(s.vehicleVersionId));

  await prisma.$transaction(async (tx) => {
    for (const s of toCreate) {
      await tx.productApplication.create({
        data: {
          productId: toProductId,
          vehicleVersionId: s.vehicleVersionId,
          vehicleBrand: s.vehicleBrand,
          vehicleModel: s.vehicleModel,
          yearStart: s.yearStart,
          yearEnd: s.yearEnd,
          engine: s.engine,
          notes: s.notes,
        },
      });
    }
    await logAudit(tx, {
      userId,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: toProductId,
      description: `${toCreate.length} aplicações copiadas de outro produto`,
    });
  });
  await refreshProductFitment(toProductId);
  return { copied: toCreate.length };
}

/** Vincula TODAS as versões ativas de um modelo em 1 clique. */
export async function addAllModelVersions(productId: string, modelId: string, userId: string) {
  const versions = await prisma.vehicleVersion.findMany({
    where: { modelId, isActive: true },
    include: { model: { include: { make: true } } },
  });
  if (versions.length === 0) throw new Error("Esse modelo não tem versões cadastradas.");

  const existing = await prisma.productApplication.findMany({
    where: { productId },
    select: { vehicleVersionId: true },
  });
  const already = new Set(existing.map((e) => e.vehicleVersionId));
  const toCreate = versions.filter((v) => !already.has(v.id));

  await prisma.$transaction(async (tx) => {
    for (const v of toCreate) {
      await tx.productApplication.create({
        data: {
          productId,
          vehicleVersionId: v.id,
          vehicleBrand: v.model.make.name,
          vehicleModel: v.model.name,
          engine: v.engine,
        },
      });
    }
    await logAudit(tx, {
      userId,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: productId,
      description: `${toCreate.length} versões do modelo vinculadas em lote`,
    });
  });
  await refreshProductFitment(productId);
  return { added: toCreate.length };
}

/** Produtos com fitment pendente (legado sem versão vinculada) para revisão manual. */
export async function listPendingFitment() {
  const apps = await prisma.productApplication.findMany({
    where: { vehicleVersionId: null },
    include: { product: { select: { id: true, name: true, sku: true } } },
    orderBy: { vehicleBrand: "asc" },
  });
  return apps.map((a) => ({
    id: a.id,
    productId: a.product.id,
    productName: a.product.name,
    sku: a.product.sku,
    legacyText: a.legacyText ?? [a.vehicleBrand, a.vehicleModel, a.engine].filter(Boolean).join(" "),
  }));
}
