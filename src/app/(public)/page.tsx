import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { ProductCard } from "@/components/public/product-card";
import { TrustStrip } from "@/components/public/trust-strip";
import { Button } from "@/components/ui/button";
import { SPECIALTIES, whatsappLink } from "@/lib/constants";
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
  const {
    categories,
    focus,
    bestSellers,
    onSale,
    featuredCategory,
    featuredProducts,
    newArrivals,
  } = await getHomeData();

  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="bg-carbon">
        <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Eyebrow>Transmissão · Motor · Gaiolas</Eyebrow>
            <h1 className="mt-4 text-balance font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Peças de <span className="text-boost">performance</span> para o
              seu projeto
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-base text-muted-foreground sm:text-lg">
              Coroa e pinhão, virabrequins e gaiolas (rollcage) para rua e pista
              — com estoque real e envio para todo o Brasil.
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

          {/* Foto real de anúncio da loja (gaiola feita na oficina) */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-lg border border-border">
              <Image
                src="/produtos/gaiola-rollcage.webp"
                alt="Gaiola de proteção (rollcage) em tubo de aço"
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

      {/* ===================== FOCO DO MOMENTO (destaques do painel) ===================== */}
      {focus.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <SectionHeader
              eyebrow="Foco do momento"
              title="Em destaque"
              href="/produtos"
              linkLabel="Ver catálogo"
            />
            <div className={PRODUCT_GRID}>
              {focus.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

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

      {/* ============ CATEGORIA EM DESTAQUE (featured + com anúncio) ============ */}
      {featuredCategory && featuredProducts.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <div className="relative overflow-hidden rounded-lg border border-border">
              {featuredProducts[0].image && (
                <Image
                  src={featuredProducts[0].image}
                  alt={featuredProducts[0].name}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/25"
              />
              <div className="relative flex flex-col items-start gap-4 px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
                <Eyebrow>Destaque</Eyebrow>
                <h2 className="max-w-xl font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">
                  {featuredCategory.name}
                </h2>
                {featuredCategory.description && (
                  <p className="max-w-md text-pretty text-muted-foreground">
                    {featuredCategory.description}
                  </p>
                )}
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="mt-2 gap-2"
                >
                  <Link href={`/produtos?categoria=${featuredCategory.slug}`}>
                    Ver {featuredCategory.name.toLowerCase()}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className={`mt-6 ${PRODUCT_GRID}`}>
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

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

      {/* ===================== ESPECIALIDADES ===================== */}
      <section className="py-12 sm:py-16">
        <Container>
          <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Especialidades da casa
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {SPECIALTIES.map((b) => (
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
