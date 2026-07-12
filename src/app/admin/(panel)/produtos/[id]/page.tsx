import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminProduct, listCategoryOptions } from "@/server/products";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    listCategoryOptions(),
  ]);

  if (!product) notFound();

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
    </div>
  );
}
