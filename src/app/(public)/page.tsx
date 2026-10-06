import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { ProductCard } from "@/components/public/product-card";
import { TrustStrip } from "@/components/public/trust-strip";
import { Button } from "@/components/ui/button";
import { CHECKOUT_ENABLED, whatsappLink } from "@/lib/constants";
import { getHomeData } from "@/server/catalog";

// Vitrine servida pelo cache com tag "catalog" — mudanças no painel
// disparam revalidateTag e aparecem na hora, sem custo por request.

const HOW_TO_BUY = CHECKOUT_ENABLED
  ? [
      {
        title: "Escolha a peça",
        text: "Fotos reais, ficha técnica e aplicação de cada anúncio.",
      },
      {
        title: "Faça o pedido",
        text: "As peças ficam reservadas por 72h enquanto você paga.",
      },
      {
        title: "Receba em casa",
        text: "Enviamos para todo o Brasil com código de rastreio.",
      },
    ]
  : [
      {
        title: "Escolha a peça",
        text: "Fotos reais, ficha técnica e aplicação de cada anúncio.",
      },
      {
        title: "Chame no WhatsApp",
        text: "O botão já manda a peça e o preço. Confirmamos aplicação e frete.",
      },
      {
        title: "Pague e receba",
        text: "Pix ou cartão. Enviamos para todo o Brasil com rastreio.",
      },
    ];

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
  const { focus, categoryTiles, bestSellers, onSale } = await getHomeData();

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

      {/* ===================== CATEGORIAS (tiles com foto) ===================== */}
      {categoryTiles.length > 0 && (
        <section className="pb-12 sm:pb-16">
          <Container>
            <SectionHeader eyebrow="Navegue por peça" title="Categorias" />
            <nav
              aria-label="Categorias de produtos"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {categoryTiles.map((c) => (
                <Link
                  key={c.id}
                  href={`/produtos?categoria=${c.slug}`}
                  className="group relative flex h-32 items-end overflow-hidden rounded-lg border border-border bg-carbon p-4 transition-colors hover:border-primary/60 sm:h-40"
                >
                  {c.image && (
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover opacity-50 transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-60"
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent"
                  />
                  <span className="relative flex w-full items-end justify-between gap-3">
                    <span className="flex items-center gap-2.5">
                      <PartIcon
                        icon={c.icon}
                        className="size-6 shrink-0 text-primary"
                      />
                      <span className="font-display text-lg font-bold uppercase leading-tight tracking-tight">
                        {c.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {c.count} {c.count === 1 ? "anúncio" : "anúncios"}
                    </span>
                  </span>
                </Link>
              ))}
            </nav>
          </Container>
        </section>
      )}

      {/* ===================== MAIS VENDIDOS (só com venda pelo site) ===================== */}
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

      {/* ===================== EM PROMOÇÃO ===================== */}
      {onSale.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <SectionHeader
              eyebrow="Ofertas ativas"
              title="Em promoção"
              href="/produtos"
              linkLabel="Ver catálogo"
            />
            <div className={PRODUCT_GRID}>
              {onSale.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ===================== COMO COMPRAR ===================== */}
      <section className="border-t border-border py-12 sm:py-16">
        <Container>
          <SectionHeader eyebrow="Simples assim" title="Como comprar" />
          <ol className="grid gap-3 sm:grid-cols-3">
            {HOW_TO_BUY.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-lg border border-border bg-card p-5"
              >
                <span className="font-display text-3xl font-bold leading-none text-boost tabular-nums">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{step.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
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
