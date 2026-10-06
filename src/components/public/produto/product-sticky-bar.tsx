"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHECKOUT_ENABLED, productWhatsappMessage, whatsappLink } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { StoreProduct } from "@/types/store";

/**
 * Barra fixa no rodapé do celular na página da peça: preço + ação principal
 * sempre à mão (no desktop a coluna de compra já fica visível).
 * No modo checkout a ação do carrinho continua na coluna de compra.
 */
export function ProductStickyBar({ product }: { product: StoreProduct }) {
  if (CHECKOUT_ENABLED && !product.priceOnRequest) return null;
  const current = product.promoPrice ?? product.price;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{product.name}</p>
          <p className="font-display text-lg font-bold leading-tight tabular-nums">
            {product.priceOnRequest ? "Sob consulta" : formatBRL(current)}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 gap-2">
          <a
            href={whatsappLink(productWhatsappMessage(product))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" />
            {product.priceOnRequest ? "Consultar" : "Pedir no WhatsApp"}
          </a>
        </Button>
      </div>
    </div>
  );
}
