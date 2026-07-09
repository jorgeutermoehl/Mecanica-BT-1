"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Tag,
  X,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PRODUCTS, type MockProduct } from "@/lib/mock-data";
import { formatBRL, installment } from "@/lib/format";

/* ---------------------------------------------------------------- *
 * Configuração / helpers da demo de carrinho
 * ---------------------------------------------------------------- */

const FREE_SHIPPING = 599;

/** Cupons de demonstração (código → % de desconto). */
const COUPONS: Record<string, number> = {
  BOOST10: 10,
  RACE15: 15,
  NITRO20: 20,
};

type CartLine = { product: MockProduct; qty: number };
type AppliedCoupon = { code: string; pct: number };

/** Itens iniciais do carrinho-demo (um setup de exemplo). */
const INITIAL_CART: { id: string; qty: number }[] = [
  { id: "p1", qty: 1 }, // Turbina Billet .50 Anti-lag
  { id: "p6", qty: 4 }, // Vela de Ignição Iridium Racing (jogo)
  { id: "p7", qty: 1 }, // Filtro de Ar Esportivo Cônico
];

function seedCart(): CartLine[] {
  return INITIAL_CART.flatMap(({ id, qty }) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return product ? [{ product, qty }] : [];
  });
}

const unitPrice = (p: MockProduct) => p.promoPrice ?? p.price;

/* ---------------------------------------------------------------- *
 * Sub-componentes de página
 * ---------------------------------------------------------------- */

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

function CartRow({
  line,
  onInc,
  onDec,
  onRemove,
}: {
  line: CartLine;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { product, qty } = line;
  const hasPromo = typeof product.promoPrice === "number";
  const atMax = qty >= product.stock;
  const lineTotal = unitPrice(product) * qty;

  return (
    <li className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      {/* Painel do produto */}
      <Link
        href={`/produtos/${product.slug}`}
        aria-label={product.name}
        className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-carbon sm:size-24"
      >
        <span aria-hidden className="boost-glow absolute inset-0 opacity-60" />
        <PartIcon icon={product.icon} className="size-9 text-muted-foreground/40 sm:size-10" />
      </Link>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </span>
            <Link href={`/produtos/${product.slug}`} className="block">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-primary">
                {product.name}
              </h3>
            </Link>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              SKU {product.sku}
              {product.fitment ? ` · ${product.fitment}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(product.id)}
            aria-label={`Remover ${product.name} do carrinho`}
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
              aria-label={`Quantidade de ${product.name}`}
              className="inline-flex items-center rounded-lg border border-border bg-background"
            >
              <button
                type="button"
                onClick={() => onDec(product.id)}
                disabled={qty <= 1}
                aria-label="Diminuir quantidade"
                className="flex size-8 items-center justify-center rounded-l-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span
                aria-live="polite"
                className="w-10 text-center font-mono text-sm tabular-nums"
              >
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onInc(product.id)}
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
            <p className="font-display text-lg font-bold text-foreground">
              {formatBRL(lineTotal)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {qty} × {formatBRL(unitPrice(product))}
            </p>
            {hasPromo && (
              <p className="font-mono text-[11px] text-muted-foreground line-through">
                {formatBRL(product.price * qty)}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------------- *
 * Página
 * ---------------------------------------------------------------- */

export default function CartPage() {
  const [items, setItems] = useState<CartLine[]>(seedCart);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const totals = useMemo(() => {
    const fullSubtotal = items.reduce((s, it) => s + it.product.price * it.qty, 0);
    const subtotal = items.reduce((s, it) => s + unitPrice(it.product) * it.qty, 0);
    const promoSavings = fullSubtotal - subtotal;
    const count = items.reduce((s, it) => s + it.qty, 0);
    const couponDiscount = coupon ? subtotal * (coupon.pct / 100) : 0;
    const merchandise = subtotal - couponDiscount;
    const freeShipping = merchandise >= FREE_SHIPPING;
    const missingForFree = Math.max(0, FREE_SHIPPING - merchandise);
    const progress = Math.min(100, (merchandise / FREE_SHIPPING) * 100);
    return {
      fullSubtotal,
      subtotal,
      promoSavings,
      count,
      couponDiscount,
      merchandise,
      freeShipping,
      missingForFree,
      progress,
      total: merchandise,
    };
  }, [items, coupon]);

  function incQty(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.product.id === id
          ? { ...it, qty: Math.min(it.product.stock, it.qty + 1) }
          : it,
      ),
    );
  }

  function decQty(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.product.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it,
      ),
    );
  }

  function removeItem(id: string) {
    const removed = items.find((it) => it.product.id === id);
    setItems((prev) => prev.filter((it) => it.product.id !== id));
    if (removed) {
      toast.success("Item removido", { description: removed.product.name });
    }
  }

  function clearCart() {
    setItems([]);
    setCoupon(null);
    toast.success("Carrinho esvaziado");
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Digite um cupom para aplicar.");
      return;
    }
    const pct = COUPONS[code];
    if (!pct) {
      toast.error("Cupom inválido", {
        description: `O código "${code}" não existe ou expirou.`,
      });
      return;
    }
    if (coupon?.code === code) {
      toast.info("Esse cupom já está aplicado.");
      return;
    }
    setCoupon({ code, pct });
    setCouponInput("");
    toast.success("Cupom aplicado", {
      description: `${pct}% de desconto com o código ${code}.`,
    });
  }

  function removeCoupon() {
    setCoupon(null);
    toast.success("Cupom removido");
  }

  /* ---------- Carrinho vazio ---------- */
  if (items.length === 0) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-card px-8 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="size-7" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Seu carrinho está vazio
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Ainda não há peças no seu setup. Explore o catálogo e adicione o que
              falta para acelerar de verdade.
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
  return (
    <section className="py-12 sm:py-16">
      <Container>
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Carrinho</Eyebrow>
            <h1 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Seu carrinho
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {totals.count} {totals.count === 1 ? "item" : "itens"} · pronto pra acelerar
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Limpar carrinho
          </Button>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          {/* Lista de itens */}
          <div>
            <ul className="flex flex-col gap-4">
              {items.map((line) => (
                <CartRow
                  key={line.product.id}
                  line={line}
                  onInc={incQty}
                  onDec={decQty}
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
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                Resumo do pedido
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <SummaryRow
                  label={`Subtotal (${totals.count} ${totals.count === 1 ? "item" : "itens"})`}
                  value={formatBRL(totals.fullSubtotal)}
                />
                {totals.promoSavings > 0 && (
                  <SummaryRow
                    label="Descontos em promoções"
                    value={`- ${formatBRL(totals.promoSavings)}`}
                    accent="success"
                  />
                )}
                {coupon && (
                  <SummaryRow
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <Tag className="size-3.5 text-success" />
                        Cupom {coupon.code}
                      </span>
                    }
                    value={`- ${formatBRL(totals.couponDiscount)}`}
                    accent="success"
                  />
                )}
                <SummaryRow
                  label="Frete"
                  value={
                    totals.freeShipping ? (
                      <span className="text-success">Grátis</span>
                    ) : (
                      <span className="text-muted-foreground">A calcular</span>
                    )
                  }
                />
              </dl>

              {/* Progresso de frete grátis */}
              <div className="mt-4">
                {totals.freeShipping ? (
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-success">
                    <Truck className="size-4 shrink-0" />
                    <p className="text-xs font-medium">Você ganhou frete grátis!</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Faltam{" "}
                      <span className="font-mono font-medium text-foreground">
                        {formatBRL(totals.missingForFree)}
                      </span>{" "}
                      para <span className="font-medium text-foreground">frete grátis</span>.
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-boost transition-all"
                        style={{ width: `${totals.progress}%` }}
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
                    {formatBRL(totals.total)}
                  </span>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    ou 10x de {installment(totals.total)} sem juros
                  </p>
                </div>
              </div>

              {/* Cupom */}
              <div className="mt-6">
                <Label htmlFor="cupom" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Cupom de desconto
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="cupom"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    placeholder="Ex.: BOOST10"
                    autoComplete="off"
                    className="font-mono uppercase placeholder:normal-case placeholder:tracking-normal"
                  />
                  <Button type="button" variant="secondary" onClick={applyCoupon}>
                    Aplicar
                  </Button>
                </div>
                {coupon && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-success">
                      <Tag className="size-3.5" />
                      {coupon.code} · -{coupon.pct}%
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label={`Remover cupom ${coupon.code}`}
                      className="flex size-6 items-center justify-center rounded-md text-success/80 outline-none transition-colors hover:bg-success/15 hover:text-success focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
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
