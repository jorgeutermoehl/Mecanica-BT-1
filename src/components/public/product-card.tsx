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
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10">
      {/* Imagem do produto */}
      <Link
        href={`/produtos/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-carbon"
        aria-label={product.name}
      >
        {showImage ? (
          <Image
            src={product.image!}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <>
            <span className="boost-glow absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              <PartIcon icon={product.icon} className="size-20 text-muted-foreground/40" />
            </span>
          </>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasPromo && (
            <span className="rounded bg-primary px-2 py-0.5 font-mono text-[11px] font-bold text-primary-foreground shadow-sm">
              -{discountPercent(product.price, product.promoPrice!)}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded bg-boost px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-sm">
              NOVO
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[10px] font-medium uppercase shadow-sm backdrop-blur-sm",
              outOfStock
                ? "bg-background/80 text-muted-foreground"
                : lowStock
                  ? "bg-warning/90 text-warning-foreground"
                  : "bg-success/90 text-success-foreground",
            )}
          >
            {outOfStock ? "Esgotado" : lowStock ? `Últimas ${product.stock}` : "Em estoque"}
          </span>
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand ?? product.category}
          </span>
          {product.sold > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">{product.sold} vendidos</span>
          )}
        </div>

        <Link href={`/produtos/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.fitment && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.fitment}</p>
        )}

        <div className="mt-3 flex-1" />

        {/* Preço */}
        <div className="mb-3">
          {hasPromo && (
            <span className="mr-2 font-mono text-xs text-muted-foreground line-through">
              {formatBRL(product.price)}
            </span>
          )}
          <span className="font-display text-xl font-bold text-foreground">
            {formatBRL(current)}
          </span>
          <p className="font-mono text-[11px] text-muted-foreground">
            ou 10x de {installment(current)}
          </p>
        </div>

        {/* Ações — sempre empilhadas em largura total: espaçamento idêntico
            em todos os cards, independente do tamanho dos rótulos. */}
        <div className="grid gap-2">
          <Button
            onClick={() => addProduct(product)}
            disabled={outOfStock}
            className="h-10 w-full gap-1.5"
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
