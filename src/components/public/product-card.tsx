"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";
import { formatBRL, installment, discountPercent } from "@/lib/format";
import type { StoreProduct } from "@/types/store";

export function ProductCard({ product }: { product: StoreProduct }) {
  const { addProduct } = useCart();
  const [imgError, setImgError] = React.useState(false);

  const hasPromo = product.promoPrice !== null;
  const current = product.promoPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const showImage = product.image && !imgError;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
      {/* Foto */}
      <Link
        href={`/produtos/${product.slug}`}
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
            <PartIcon
              icon={product.icon}
              className={cn(
                "size-20 text-muted-foreground/40",
                outOfStock && "opacity-60",
              )}
            />
          </span>
        )}

        {(hasPromo || product.isNew) && (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {hasPromo && (
              <span className="rounded-sm bg-primary px-2 py-1 font-mono text-[11px] font-bold leading-none text-primary-foreground tabular-nums">
                -{discountPercent(product.price, product.promoPrice!)}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-sm bg-foreground px-2 py-1 font-mono text-[11px] font-bold leading-none text-background">
                NOVO
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        {/* Marca + SKU */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand ?? product.category}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {product.sku}
          </span>
        </div>

        <Link href={`/produtos/${product.slug}`} className="mt-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.fitment && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {product.fitment}
          </p>
        )}

        <div className="flex-1" />

        {/* Preço — padrão BR: PIX em destaque + parcelamento em mono */}
        <div className="mt-3">
          {hasPromo && (
            <p className="font-mono text-xs text-muted-foreground line-through tabular-nums">
              {formatBRL(product.price)}
            </p>
          )}
          <p className="font-display text-xl font-bold tracking-tight text-foreground tabular-nums">
            {formatBRL(current)}{" "}
            <span className="font-sans text-xs font-semibold text-success">
              no PIX
            </span>
          </p>
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
            ou 10x de {installment(current)} sem juros no cartão
          </p>
        </div>

        {/* Estoque (texto + cor) e prova social */}
        <p className="mt-2 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wide">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              outOfStock
                ? "bg-muted-foreground"
                : lowStock
                  ? "bg-warning"
                  : "bg-success",
            )}
          />
          <span
            className={
              outOfStock
                ? "text-muted-foreground"
                : lowStock
                  ? "text-warning"
                  : "text-success"
            }
          >
            {outOfStock
              ? "Esgotado"
              : lowStock
                ? `Últimas ${product.stock} un.`
                : "Em estoque"}
          </span>
          {product.sold > 0 && (
            <span className="ml-auto font-normal normal-case tracking-normal text-muted-foreground tabular-nums">
              {product.sold} {product.sold === 1 ? "vendido" : "vendidos"}
            </span>
          )}
        </p>

        {/* Ações — uma primária, uma secundária */}
        <div className="mt-3 grid gap-2">
          <Button
            onClick={() => addProduct(product)}
            disabled={outOfStock}
            className="h-10 w-full gap-2"
          >
            <ShoppingCart className="size-4" />
            {outOfStock ? (
              "Indisponível"
            ) : (
              <span>
                Adicionar<span className="hidden lg:inline"> ao carrinho</span>
              </span>
            )}
          </Button>
          <Button asChild variant="outline" className="h-10 w-full">
            <Link href={`/produtos/${product.slug}`}>Ver detalhes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
