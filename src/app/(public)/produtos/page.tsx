import type { Metadata } from "next";
import { Catalog } from "@/components/public/produtos/catalog";
import { getStoreCategories, getStoreProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Catálogo completo de peças de performance: turbo, motor, escape, freios, suspensão e mais. Filtre por categoria, marca e preço.",
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const [{ categoria }, products, categories] = await Promise.all([
    searchParams,
    getStoreProducts(),
    getStoreCategories(),
  ]);

  // Só aceita categoria que exista de fato no catálogo.
  const initialCategory = categories.some((c) => c.slug === categoria)
    ? categoria
    : undefined;

  return (
    <Catalog
      products={products}
      categories={categories}
      initialCategory={initialCategory}
    />
  );
}
