import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategoryOptions } from "@/server/products";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await listCategoryOptions();

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
          Novo produto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre a peça e publique o anúncio direto na loja.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
