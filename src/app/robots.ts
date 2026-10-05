import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Painel, API e etapas de compra não devem ser indexados.
        disallow: ["/admin", "/api", "/carrinho", "/checkout", "/pedido-confirmado"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
