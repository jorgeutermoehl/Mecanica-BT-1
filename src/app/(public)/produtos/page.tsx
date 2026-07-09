import type { Metadata } from "next";
import { Catalog } from "@/components/public/produtos/catalog";
import { CATEGORIES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Produtos — FullBoost Race Parts",
  description:
    "Catálogo completo de peças de performance: turbo, motor, escape, freios, suspensão e mais. Filtre por categoria, marca e preço.",
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;

  // Só aceita categoria que exista de fato no catálogo.
  const initialCategory = CATEGORIES.some((c) => c.slug === categoria)
    ? categoria
    : undefined;

  return <Catalog initialCategory={initialCategory} />;
}
