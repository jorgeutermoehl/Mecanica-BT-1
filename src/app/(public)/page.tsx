import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { ProductCard } from "@/components/public/product-card";
import { TrustStrip } from "@/components/public/trust-strip";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/constants";
import { BRANDS } from "@/lib/constants";
import { getHomeData } from "@/server/catalog";

// Vitrine servida pelo cache com tag "catalog" — mudanças no painel
// disparam revalidateTag e aparecem na hora, sem custo por request.

const PRODUCT_GRID =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Cabeçalho padrão de seção: eyebrow + título + link "ver tudo" à direita. */
function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "Ver tudo",
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-bold uppercase leading-none tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const { categories, bestSellers, onSale, wheels, newArrivals } =
    await getHomeData();

  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="bg-carbon">
        <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Eyebrow>Turbo · Suspensão · Freios · Rodas</Eyebrow>
            <h1 className="mt-4 text-balance font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Peças de <span className="text-boost">performance</span> para o
              seu projeto
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-base text-muted-foreground sm:text-lg">
              Turbinas, rodas, freios e suspensão selecionados a dedo — com
              estoque real, nota fiscal e envio para todo o Brasil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/produtos">
                  Ver produtos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Foto real de motor — sem moldura decorativa */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-lg border border-border">
              <Image
                src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1600&auto=format&fit=crop"
                alt="Motor de alta performance"
                fill
                priority
                sizes="(max-width: 1024px) 0px, 32rem"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== FAIXA DE CONFIANÇA ===================== */}
      <TrustStrip />

      {/* ===================== MAIS VENDIDOS ===================== */}
      {bestSellers.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <SectionHeader
              eyebrow="Top de linha"
              title="Mais vendidos"
              href="/produtos"
              linkLabel="Ver catálogo"
            />
            <div className={PRODUCT_GRID}>
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ===================== CATEGORIAS ===================== */}
      {categories.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <SectionHeader
              eyebrow="Navegue por peça"
              title="Categorias"
              href="/produtos"
              linkLabel="Ver todas"
            />
            <nav
              aria-label="Categorias de produtos"
              className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/produtos?categoria=${c.slug}`}
                  className="group flex items-center gap-3 border-b border-border/70 pb-3 text-sm font-medium transition-colors hover:text-primary"
                >
                  <PartIcon
                    icon={c.icon}
                    className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {c.count}
                  </span>
                </Link>
              ))}
            </nav>
          </Container>
        </section>
      )}

      {/* ===================== RODAS EM DESTAQUE ===================== */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="relative overflow-hidden rounded-lg border border-border">
            <Image
              src="https://images.unsplash.com/photo-1542377281-73d08e3a10aa?q=80&w=1600&auto=format&fit=crop"
              alt="Roda esportiva de liga leve"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/25"
            />
            <div className="relative flex flex-col items-start gap-4 px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
              <Eyebrow>Destaque</Eyebrow>
              <h2 className="max-w-xl font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">
                Rodas para todos os projetos
              </h2>
              <p className="max-w-md text-pretty text-muted-foreground">
                Esportivas, forjadas e réplicas — aro 15 ao 20.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-2 gap-2">
                <Link href="/produtos?categoria=rodas">
                  Ver todas as rodas
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {wheels.length > 0 && (
            <div className={`mt-6 ${PRODUCT_GRID}`}>
              {wheels.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ===================== EM PROMOÇÃO ===================== */}
      {onSale.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <SectionHeader
              eyebrow="Ofertas ativas"
              title="Em promoção"
              href="/promocoes"
              linkLabel="Ver ofertas"
            />
            <div className={PRODUCT_GRID}>
              {onSale.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ===================== NOVIDADES ===================== */}
      {newArrivals.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <SectionHeader
              eyebrow="Acabou de chegar"
              title="Novidades"
              href="/produtos"
              linkLabel="Ver catálogo"
            />
            <div className={PRODUCT_GRID}>
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ===================== MARCAS ===================== */}
      <section className="py-12 sm:py-16">
        <Container>
          <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Marcas parceiras
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {BRANDS.map((b) => (
              <span
                key={b}
                className="font-display text-lg font-semibold uppercase tracking-wide text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== CTA WHATSAPP ===================== */}
      <section className="border-t border-border bg-carbon">
        <Container className="flex flex-col items-start gap-6 py-12 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="max-w-2xl font-display text-2xl font-bold uppercase leading-none tracking-tight sm:text-3xl">
              Dúvida se a peça serve no seu carro?
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              Manda o modelo e o ano no WhatsApp que o nosso time confirma a
              aplicação antes de você fechar o pedido.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 gap-2">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Chamar no WhatsApp
            </a>
          </Button>
        </Container>
      </section>
    </>
  );
}
