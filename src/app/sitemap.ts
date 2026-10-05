import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getStoreCategories, getStoreProducts } from "@/server/catalog";

// Gerado a cada request (catálogo muda pelo painel); a leitura vem do cache "catalog".
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  const now = new Date();
  const pages = ["", "/produtos", "/promocoes", "/sobre", "/contato", "/termos", "/privacidade"];
  return [
    ...pages.map((p) => ({
      url: `${SITE.url}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.6,
    })),
    ...categories.map((c) => ({
      url: `${SITE.url}/produtos?categoria=${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE.url}/produtos/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(p.image ? { images: [p.image.startsWith("http") ? p.image : `${SITE.url}${p.image}`] } : {}),
    })),
  ];
}
