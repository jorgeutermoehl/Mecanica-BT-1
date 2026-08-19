import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdminProduct, listCategoryOptions } from "@/server/products";
import { listProductApplications } from "@/server/vehicles";
import { listProductOptions } from "@/server/inventory";
import { ProductForm } from "@/components/admin/product-form";
import { FitmentEditor } from "@/components/admin/produtos/fitment-editor";
import { ProductGalleryManager } from "@/components/admin/produtos/product-gallery-manager";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, applications, productOptions, images] = await Promise.all([
    getAdminProduct(id),
    listCategoryOptions(),
    listProductApplications(id),
    listProductOptions(),
    prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { position: "asc" },
      select: { id: true, url: true, alt: true, isPrimary: true, position: true },
    }),
  ]);

  if (!product) notFound();

  // Origens possíveis para "copiar aplicações" — todos os produtos, menos este.
  const copySources = productOptions
    .filter((p) => p.id !== id)
    .map((p) => ({ id: p.id, label: p.label }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
          <Link href="/admin/produtos">
            <ArrowLeft className="size-4" />
            Voltar para produtos
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
          Editar produto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{product.sku}</span> · {product.name} — o
          estoque muda por movimentações, não por aqui.
        </p>
      </div>

      <ProductForm categories={categories} product={product} />

      {/* Galeria de imagens — upload, principal e ordem de exibição na loja */}
      <section
        aria-labelledby="gallery-heading"
        className="space-y-4 border-t-2 border-border pt-6"
      >
        <div>
          <h2
            id="gallery-heading"
            className="font-display text-lg font-bold uppercase tracking-tight"
          >
            Galeria de imagens
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fotos exibidas na loja — a imagem principal é a capa do produto no
            catálogo.
          </p>
        </div>
        <ProductGalleryManager
          productId={id}
          productName={product.name}
          images={images}
        />
      </section>

      {/* Compatibilidade (fitment) — vínculos com o catálogo de veículos */}
      <section aria-labelledby="fitment-heading" className="space-y-4 border-t-2 border-border pt-6">
        <div>
          <h2
            id="fitment-heading"
            className="font-display text-lg font-bold uppercase tracking-tight"
          >
            Compatibilidade
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Veículos em que esta peça se aplica — gerencie marcas e versões em{" "}
            <Link
              href="/admin/veiculos"
              className="text-primary underline-offset-2 hover:underline"
            >
              Veículos
            </Link>
            .
          </p>
        </div>
        <FitmentEditor
          productId={id}
          applications={applications}
          products={copySources}
        />
      </section>
    </div>
  );
}
