import type { MetadataRoute } from "next";
import { IS_STAGING, SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  // Homologação: bloqueia tudo.
  if (IS_STAGING) return { rules: [{ userAgent: "*", disallow: "/" }] };
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
