import Link from "next/link";
import type { Metadata } from "next";
import { Timer, ArrowRight, Info } from "lucide-react";
import { Container } from "@/components/shared/container";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStoreProducts } from "@/server/catalog";
import { CouponCard, type Coupon } from "@/components/public/promocoes/coupon-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promoções",
  description:
    "Cupons ativos e ofertas em peças de performance. Economize em turbo, freios, suspensão, escape e mais na FullBoost Race Parts.",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Cupons ativos cadastrados no sistema (mesmas regras do checkout). */
const COUPONS: Coupon[] = [
  {
    code: "BEMVINDO10",
    highlight: "10% OFF",
    title: "Boas-vindas",
    description: "Desconto de 10% para começar o seu projeto com a gente.",
    condition: "Pedidos acima de R$ 100 · não acumulativo",
  },
  {
    code: "TURBO15",
    highlight: "15% OFF",
    title: "Setup completo",
    description: "Montou o kit inteiro? Leve mais e pague menos no carrinho.",
    condition: "Pedidos acima de R$ 500 · não acumulativo",
  },
  {
    code: "NITRO50",
    highlight: "R$ 50 OFF",
    title: "Injeção direta",
    description: "R$ 50 de desconto direto no total do seu pedido.",
    condition: "Pedidos acima de R$ 300 · não acumulativo",
  },
];

export default async function PromocoesPage() {
  const products = await getStoreProducts();
  const onSale = products.filter((p) => p.promoPrice !== null);

  return (
    <>
      {/* ===================== BANNER ===================== */}
      <section className="racing-clip relative overflow-hidden bg-boost text-white">
        <span aria-hidden className="absolute inset-0 bg-carbon opacity-10" />
        <Container className="relative py-16 pb-24 sm:py-20 sm:pb-28">
          <p className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            <span className="h-px w-6 bg-white/70" />
            Ofertas &amp; cupons
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            Promoções
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-lg text-white/90">
            Descontos reais em race parts selecionadas e cupons para usar no
            carrinho. Aproveite antes que o estoque acabe.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wide backdrop-blur-sm">
            <Timer className="size-3.5" />
            Válido enquanto durar o estoque
          </span>
        </Container>
      </section>

      {/* ===================== CUPONS ATIVOS ===================== */}
      <section className="py-16">
        <Container>
          <div className="mb-8">
            <Eyebrow>Use no carrinho</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Cupons ativos
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Copie o código e cole na finalização do pedido para aplicar o
              desconto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COUPONS.map((coupon) => (
              <CouponCard key={coupon.code} coupon={coupon} />
            ))}
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" />
            Cupons não são acumulativos entre si e valem enquanto estiverem
            ativos. O desconto é aplicado no carrinho, antes de finalizar a
            compra.
          </p>
        </Container>
      </section>

      {/* ===================== OFERTAS ===================== */}
      <section className="py-8 pb-20">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Preço de boost</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Ofertas
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Peças com preço promocional válido enquanto durar o estoque.
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 font-mono uppercase tracking-wide text-primary"
            >
              <Timer className="size-3" />
              Enquanto durar o estoque
            </Badge>
          </div>

          {onSale.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {onSale.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-lg font-semibold uppercase tracking-tight">
                Nenhuma oferta ativa no momento
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                As promoções mudam rápido por aqui. Volte em breve ou explore o
                catálogo completo.
              </p>
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/produtos">
                Ver catálogo completo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
