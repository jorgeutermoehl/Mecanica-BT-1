"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Tag,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";
import { formatBRL, installment } from "@/lib/format";
import type { CartItem } from "@/types/store";

/** Regra de frete espelhada do servidor (src/server/orders.ts). */
const FREE_SHIPPING_THRESHOLD = 599;
const FLAT_SHIPPING = 34.9;
const MAX_QTY = 99;

/* ---------- Rótulo de seção (padrão da home) ---------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-mono tabular-nums",
          accent === "success" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ---------- Imagem do item (next/image 80px + fallback PartIcon) ---------- */
function ItemThumb({ item }: { item: CartItem }) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = item.image && !imgError;

  return (
    <Link
      href={`/produtos/${item.slug}`}
      aria-label={item.name}
      className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-carbon"
    >
      {showImage ? (
        <Image
          src={item.image!}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <>
          <span aria-hidden className="boost-glow absolute inset-0 opacity-60" />
          <PartIcon icon={item.icon} className="size-8 text-muted-foreground/40" />
        </>
      )}
    </Link>
  );
}

/* ---------- Linha do carrinho ---------- */
function CartLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const maxQty = Math.min(item.stock, MAX_QTY);
  const atMax = item.quantity >= maxQty;
  const hasPromo = item.fullPrice !== item.price;
  const lineTotal = item.price * item.quantity;

  return (
    <li className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <ItemThumb item={item} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produtos/${item.slug}`} className="block">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-primary">
                {item.name}
              </h3>
            </Link>
            <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {item.brand ? `${item.brand} · ` : ""}SKU {item.sku}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            aria-label={`Remover ${item.name} do carrinho`}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {/* Quantidade + preço */}
        <div className="mt-3 flex items-end justify-between gap-4 pt-1">
          <div>
            <div
              role="group"
              aria-label={`Quantidade de ${item.name}`}
              className="inline-flex items-center rounded-lg border border-border bg-background"
            >
              <button
                type="button"
                onClick={() => onQuantity(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                aria-label="Diminuir quantidade"
                className="flex size-8 items-center justify-center rounded-l-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span aria-live="polite" className="w-10 text-center font-mono text-sm tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantity(item.productId, item.quantity + 1)}
                disabled={atMax}
                aria-label="Aumentar quantidade"
                className="flex size-8 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            {atMax && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-warning">
                Máximo em estoque
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="font-display text-lg font-bold text-foreground">{formatBRL(lineTotal)}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {item.quantity} × {formatBRL(item.price)}
            </p>
            {hasPromo && (
              <p className="font-mono text-[11px] text-muted-foreground line-through">
                {formatBRL(item.fullPrice * item.quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ---------- Skeleton (antes da hidratação do localStorage) ---------- */
function CartSkeleton() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-9 w-64" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- *
 * Página
 * ---------------------------------------------------------------- */

export default function CartPage() {
  const { items, count, subtotal, hydrated, updateQuantity, removeItem } = useCart();

  if (!hydrated) return <CartSkeleton />;

  /* ---------- Carrinho vazio ---------- */
  if (items.length === 0) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-8 sm:py-16">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="size-7" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Seu carrinho está vazio
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Ainda não há peças no seu setup. Explore o catálogo e adicione o que falta para
              acelerar de verdade.
            </p>
            <Button asChild size="lg" className="mt-7 gap-2">
              <Link href="/produtos">
                Explorar produtos
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Link
              href="/promocoes"
              className="mt-4 font-mono text-xs uppercase tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Ver ofertas da semana
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  /* ---------- Carrinho com itens ---------- */
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : FLAT_SHIPPING;
  const missingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const total = subtotal + shipping;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        {/* Cabeçalho */}
        <div>
          <Eyebrow>Carrinho</Eyebrow>
          <h1 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Seu carrinho
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {count} {count === 1 ? "item" : "itens"} · pronto pra acelerar
          </p>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          {/* Lista de itens */}
          <div>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <CartLine
                  key={item.productId}
                  item={item}
                  onQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </ul>

            <div className="mt-6">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/produtos">
                  <ArrowLeft className="size-4" />
                  Continuar comprando
                </Link>
              </Button>
            </div>
          </div>

          {/* Resumo do pedido */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                Resumo do pedido
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <SummaryRow
                  label={`Subtotal (${count} ${count === 1 ? "item" : "itens"})`}
                  value={formatBRL(subtotal)}
                />
                <SummaryRow
                  label="Frete"
                  value={
                    freeShipping ? (
                      <span className="font-medium text-success">Grátis</span>
                    ) : (
                      formatBRL(FLAT_SHIPPING)
                    )
                  }
                />
              </dl>

              {/* Progresso de frete grátis */}
              <div className="mt-4">
                {freeShipping ? (
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-success">
                    <Truck className="size-4 shrink-0" />
                    <p className="text-xs font-medium">Você ganhou frete grátis!</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Faltam{" "}
                      <span className="font-mono font-medium text-foreground">
                        {formatBRL(missingForFree)}
                      </span>{" "}
                      para <span className="font-medium text-foreground">frete grátis</span>.
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-boost transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-5" />

              {/* Total */}
              <div className="flex items-end justify-between gap-4">
                <span className="font-display text-base font-bold uppercase tracking-tight">
                  Total
                </span>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {formatBRL(total)}
                  </span>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    ou 10x de {installment(total)} sem juros
                  </p>
                </div>
              </div>

              {/* Cupom — apenas informativo (validação acontece no checkout) */}
              <div className="mt-6">
                <Label
                  htmlFor="cupom"
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  Cupom de desconto
                </Label>
                <div className="relative mt-1.5">
                  <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input id="cupom" disabled placeholder="Ex.: BOOST10" className="pl-8" />
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  Aplique o cupom no checkout — ele é validado ao finalizar o pedido.
                </p>
              </div>

              {/* Finalizar */}
              <Button asChild size="lg" className="mt-6 w-full gap-2">
                <Link href="/checkout">
                  Finalizar compra
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              {/* Selos de confiança */}
              <div className="mt-5 flex items-center justify-center gap-4 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                  <Lock className="size-3.5" />
                  Pagamento seguro
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                  <ShieldCheck className="size-3.5" />
                  Compra garantida
                </span>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
