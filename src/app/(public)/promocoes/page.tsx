import Link from "next/link";
import type { Metadata } from "next";
import { Timer, ArrowRight, Info } from "lucide-react";
import { Container } from "@/components/shared/container";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ON_SALE } from "@/lib/mock-data";
import { CouponCard, type Coupon } from "@/components/public/promocoes/coupon-card";

export const metadata: Metadata = {
  title: "Promoções",
  description:
    "Cupons ativos e ofertas em peças de performance. Economize em turbo, freios, suspensão, escape e mais durante a Semana do Boost.",
};

/** Fim da campanha vigente (exibido nos selos). */
const CAMPAIGN_END = "15/07/2026";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

const COUPONS: Coupon[] = [
  {
    code: "BEMVINDO10",
    highlight: "10% OFF",
    title: "Primeira compra",
    description: "Desconto de boas-vindas na sua estreia com a gente.",
    condition: "Válido na 1ª compra · pedidos acima de R$ 200",
  },
  {
    code: "TURBO15",
    highlight: "15% OFF",
    title: "Setup completo",
    description: "Montou o kit inteiro? Leve mais e pague menos no carrinho.",
    condition: "Pedidos acima de R$ 500 · não acumulativo",
  },
  {
    code: "FRETEGRATIS",
    highlight: "Frete grátis",
    title: "Entrega por nossa conta",
    description: "Frete zero para Sul e Sudeste nas peças em estoque.",
    condition: "Sul e Sudeste · pedidos acima de R$ 350",
  },
];

export default function PromocoesPage() {
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
            Semana do Boost · até {CAMPAIGN_END}
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
            Cupons não são acumulativos entre si e valem enquanto durar a
            campanha. O desconto é aplicado no carrinho, antes de finalizar a
            compra.
          </p>
        </Container>
      </section>

      {/* ===================== OFERTAS ===================== */}
      <section className="py-8 pb-20">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Semana do Boost</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Ofertas
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Preços promocionais válidos até {CAMPAIGN_END} ou enquanto
                durarem os estoques.
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 font-mono uppercase tracking-wide text-primary"
            >
              <Timer className="size-3" />
              Termina em {CAMPAIGN_END}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {ON_SALE.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

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
