"use client";

import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBRL, installment, discountPercent } from "@/lib/format";
import type { MockProduct } from "@/lib/mock-data";

export function ProductCard({ product }: { product: MockProduct }) {
  const hasPromo = typeof product.promoPrice === "number";
  const current = product.promoPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  function addToCart() {
    if (outOfStock) return;
    toast.success("Adicionado ao carrinho", {
      description: product.name,
    });
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10">
      {/* Imagem / painel */}
      <Link
        href={`/produtos/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-carbon"
        aria-label={product.name}
      >
        <span className="boost-glow absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
          <PartIcon icon={product.icon} className="size-20 text-muted-foreground/40" />
        </span>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasPromo && (
            <span className="rounded bg-primary px-2 py-0.5 font-mono text-[11px] font-bold text-primary-foreground">
              -{discountPercent(product.price, product.promoPrice!)}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded bg-boost px-2 py-0.5 font-mono text-[11px] font-bold text-boost-foreground">
              NOVO
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[10px] font-medium uppercase",
              outOfStock
                ? "bg-muted text-muted-foreground"
                : lowStock
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success",
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
            {product.brand}
          </span>
          {product.rating ? (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="size-3 fill-warning text-warning" />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
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

        {/* Ações */}
        <div className="flex gap-2">
          <Button onClick={addToCart} disabled={outOfStock} size="sm" className="flex-1 gap-1.5">
            <ShoppingCart className="size-4" />
            {outOfStock ? "Indisponível" : "Adicionar"}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/produtos/${product.slug}`}>Ver</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
