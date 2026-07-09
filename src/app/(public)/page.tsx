import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Truck,
  ShieldCheck,
  Lock,
  Headset,
  Star,
  Gauge,
  Quote,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/constants";
import { CATEGORIES, BEST_SELLERS, ON_SALE, BRANDS } from "@/lib/mock-data";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

const BENEFITS = [
  { icon: Truck, title: "Envio para todo o Brasil", text: "Logística ágil e rastreável, com despacho em até 24h." },
  { icon: ShieldCheck, title: "Garantia e procedência", text: "Peças originais e homologadas, com nota fiscal." },
  { icon: Lock, title: "Pagamento seguro", text: "Ambiente protegido e criptografado do início ao fim." },
  { icon: Headset, title: "Suporte especialista", text: "Time técnico para indicar a peça certa pro seu setup." },
];

const TESTIMONIALS = [
  { name: "Rafael M.", car: "Golf GTI Mk7", text: "Turbina e intercooler impecáveis. Ganho de boost real e entrega rápida." },
  { name: "Bruna L.", car: "Civic Si", text: "Coilover excelente e o suporte me ajudou a escolher a regulagem certa." },
  { name: "Diego S.", car: "Gol G6 Turbo", text: "Preço justo, peça de qualidade e chegou antes do prazo. Recomendo demais." },
];

export default function HomePage() {
  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
        <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <Eyebrow>Performance · Boost · Race Parts</Eyebrow>
            <h1 className="mt-5 text-balance text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Peças para quem busca{" "}
              <span className="text-boost">performance</span> de verdade.
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-lg text-muted-foreground">
              Race parts, acessórios e componentes selecionados para elevar o desempenho
              do seu carro — com qualidade premium e garantia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/produtos">
                  Ver produtos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  Falar com especialista
                </a>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { value: "+5.000", label: "Itens em estoque" },
                { value: "24h", label: "Despacho rápido" },
                { value: "100%", label: "Compra segura" },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-2xl font-bold text-foreground">{s.value}</dt>
                  <dd className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Painel visual (turbo / boost) */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-square w-full max-w-md -skew-x-3 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
              <span className="boost-glow absolute inset-0" />
              <div className="absolute inset-0 skew-x-3 p-8">
                <div className="flex h-full flex-col items-center justify-center gap-6">
                  <PartIcon icon="turbo" className="size-28 text-primary" />
                  <div className="text-center">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Boost pressure
                    </p>
                    <p className="font-display text-5xl font-bold text-boost">1.8 bar</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="size-4" />
                    <span className="font-mono text-xs">Full boost engaged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== CATEGORIAS ===================== */}
      <section className="py-16">
        <Container>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Explore</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Categorias</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/categorias">Ver todas <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${c.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <PartIcon icon={c.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{c.count} itens</span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== MAIS VENDIDOS ===================== */}
      <section className="py-8">
        <Container>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Top de linha</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Mais vendidos</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/produtos">Ver catálogo <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {BEST_SELLERS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== FAIXA DE PROMOÇÃO ===================== */}
      <section className="py-12">
        <Container>
          <div className="racing-clip relative overflow-hidden rounded-2xl bg-boost px-8 py-12 text-white">
            <span aria-hidden className="absolute inset-0 bg-carbon opacity-10" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/80">Ofertas da semana</p>
                <h3 className="mt-2 max-w-xl font-display text-2xl font-bold uppercase sm:text-3xl">
                  Descontos em peças de performance selecionadas
                </h3>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0 gap-2">
                <Link href="/promocoes">Ver ofertas <ArrowRight className="size-4" /></Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== OFERTAS ===================== */}
      <section className="py-8">
        <Container>
          <div className="mb-8">
            <Eyebrow>Economize</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Em promoção</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {ON_SALE.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== MARCAS ===================== */}
      <section className="py-12">
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

      {/* ===================== BENEFÍCIOS ===================== */}
      <section className="border-y border-border bg-card/40 py-16">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-base font-semibold uppercase tracking-wide">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== DEPOIMENTOS ===================== */}
      <section className="py-16">
        <Container>
          <div className="mb-8 text-center">
            <Eyebrow>Quem acelera com a gente</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Depoimentos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-xl border border-border bg-card p-6">
                <Quote className="size-6 text-primary/60" />
                <blockquote className="mt-3 flex-1 text-sm text-foreground/90">“{t.text}”</blockquote>
                <div className="mt-4 flex items-center justify-between">
                  <figcaption>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{t.car}</span>
                  </figcaption>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== CTA WHATSAPP ===================== */}
      <section className="pb-20">
        <Container>
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-carbon px-8 py-14 text-center">
            <span className="boost-glow pointer-events-none absolute" />
            <h2 className="max-w-2xl font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Montou seu setup? <span className="text-boost">Fale com um especialista.</span>
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Tire dúvidas de compatibilidade, potência e instalação direto com o nosso time técnico.
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Chamar no WhatsApp
              </a>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
