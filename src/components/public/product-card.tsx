"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import {
  CHECKOUT_ENABLED,
  COMMERCE,
  productWhatsappMessage,
  whatsappLink,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatBRL, installment, discountPercent } from "@/lib/format";
import { CONDITION_LABEL, type StoreProduct } from "@/types/store";

/**
 * Card da vitrine. O card inteiro leva à página da peça; o único botão é a
 * ação principal: no modo WhatsApp "Pedir no WhatsApp" (mensagem com nome,
 * SKU, preço e link), no modo checkout "Adicionar" ao carrinho.
 */
export function ProductCard({ product }: { product: StoreProduct }) {
  const { addProduct } = useCart();
  const [imgError, setImgError] = React.useState(false);

  const onRequest = product.priceOnRequest;
  const hasPromo = product.promoPrice !== null && !onRequest;
  const current = product.promoPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 3;
  const showImage = product.image && !imgError;
  const conditionLabel = CONDITION_LABEL[product.condition] ?? null;
  const href = `/produtos/${product.slug}`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
      {/* Foto */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden border-b border-border bg-carbon"
        aria-label={product.name}
      >
        {showImage ? (
          <Image
            src={product.image!}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-[1.03]",
              outOfStock && "opacity-60 grayscale",
            )}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <PartIcon icon={product.icon} className="size-16 text-muted-foreground/40" />
          </span>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {conditionLabel && (
            <span
              className={cn(
                "rounded-sm px-1.5 py-1 font-mono text-[10px] font-bold uppercase leading-none sm:px-2 sm:text-[11px]",
                product.condition === "NEW"
                  ? "bg-success text-success-foreground"
                  : "bg-foreground text-background",
              )}
            >
              {conditionLabel}
            </span>
          )}
          {hasPromo && (
            <span className="rounded-sm bg-primary px-1.5 py-1 font-mono text-[10px] font-bold leading-none text-primary-foreground tabular-nums sm:px-2 sm:text-[11px]">
              -{discountPercent(product.price, product.promoPrice!)}%
            </span>
          )}
        </div>
        {product.featured && (
          <span className="absolute right-2 top-2 rounded-sm bg-boost px-1.5 py-1 font-mono text-[10px] font-bold uppercase leading-none text-white sm:px-2 sm:text-[11px]">
            Destaque
          </span>
        )}
      </Link>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="truncate font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
          {product.category}
        </span>

        <Link href={href} className="mt-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.fitment && (
          <p className="mt-1 line-clamp-1 hidden text-xs text-muted-foreground sm:block">
            {product.fitment}
          </p>
        )}

        <div className="flex-1" />

        {/* Preço */}
        <div className="mt-3">
          {onRequest ? (
            <p className="font-display text-lg font-bold tracking-tight sm:text-xl">Sob consulta</p>
          ) : (
            <>
              {hasPromo && (
                <p className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                  {formatBRL(product.price)}
                </p>
              )}
              <p className="font-display text-lg font-bold tracking-tight tabular-nums sm:text-xl">
                {formatBRL(current)}
              </p>
              {COMMERCE.maxInstallments > 1 && (
                <p className="hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:block">
                  ou {COMMERCE.maxInstallments}x de {installment(current)} sem juros
                </p>
              )}
            </>
          )}
        </div>

        {/* Disponibilidade (texto + cor) */}
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wide sm:text-[11px]">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              outOfStock ? "bg-muted-foreground" : lowStock ? "bg-warning" : "bg-success",
            )}
          />
          <span
            className={
              outOfStock ? "text-muted-foreground" : lowStock ? "text-warning" : "text-success"
            }
          >
            {outOfStock ? "Esgotado" : lowStock ? `Últimas ${product.stock} un.` : "Disponível"}
          </span>
        </p>

        {/* Ação principal */}
        <div className="mt-3">
          {CHECKOUT_ENABLED && !onRequest ? (
            <Button
              onClick={() => addProduct(product)}
              disabled={outOfStock}
              className="h-10 w-full gap-2"
            >
              <ShoppingCart className="size-4" />
              {outOfStock ? "Indisponível" : "Adicionar"}
            </Button>
          ) : (
            <Button asChild className="h-10 w-full gap-1.5 px-2">
              <a
                href={whatsappLink(productWhatsappMessage(product))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${onRequest ? "Consultar" : "Pedir"} ${product.name} no WhatsApp`}
              >
                <MessageCircle className="size-4 shrink-0" />
                <span className="truncate">
                  {onRequest ? "Consultar" : "Pedir"}
                  <span className="hidden sm:inline"> no WhatsApp</span>
                </span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
