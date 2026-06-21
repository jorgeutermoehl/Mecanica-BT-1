import Link from "next/link";
import {
  ArrowRight,
  Battery,
  Cog,
  Disc3,
  Droplets,
  Filter,
  Gauge,
  Package,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { name: "Motor", icon: Cog, href: "/catalogo?categoria=motor" },
  { name: "Freios", icon: Disc3, href: "/catalogo?categoria=freios" },
  { name: "Suspensão", icon: Gauge, href: "/catalogo?categoria=suspensao" },
  { name: "Filtros", icon: Filter, href: "/catalogo?categoria=filtros" },
  { name: "Elétrica", icon: Zap, href: "/catalogo?categoria=eletrica" },
  { name: "Óleos e Fluidos", icon: Droplets, href: "/catalogo?categoria=oleos" },
  { name: "Bateria", icon: Battery, href: "/catalogo?categoria=bateria" },
  { name: "Acessórios", icon: Package, href: "/catalogo?categoria=acessorios" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_0%,oklch(0.62_0.24_27/0.18),transparent_70%)]"
        />
        <Container className="relative grid gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="outline" className="mb-5 w-fit gap-1.5 border-primary/40 text-primary">
              <Sparkles className="size-3.5" />
              Peças com garantia e procedência
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              A peça certa para o seu carro,
              <span className="text-primary"> sem complicação.</span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg text-muted-foreground">
              Milhares de peças mecânicas e componentes automotivos com qualidade,
              garantia e entrega para todo o Brasil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/catalogo">
                  Ver catálogo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/promocoes">Ver promoções</Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {[
                { value: "5.000+", label: "Itens em estoque" },
                { value: "24h", label: "Envio rápido" },
                { value: "100%", label: "Compra segura" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl font-extrabold text-foreground">{stat.value}</dt>
                  <dd className="text-xs text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Cartão decorativo (placeholder até integrarmos imagens reais) */}
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="relative aspect-square w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-2xl shadow-black/40">
              <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-primary/10 to-transparent">
                <Cog className="size-24 text-primary/70" strokeWidth={1.2} />
                <p className="px-8 text-center text-sm text-muted-foreground">
                  Vitrine de produtos em destaque
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CATEGORIAS */}
      <section className="py-16">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Categorias</h2>
              <p className="text-sm text-muted-foreground">Encontre peças pelo tipo de componente.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/catalogo">
                Ver tudo <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORIES.map(({ name, icon: Icon, href }) => (
              <Link
                key={name}
                href={href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-6" />
                </span>
                <span className="text-sm font-semibold">{name}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FAIXA DE PROMOÇÃO */}
      <section className="py-4">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl bg-primary px-8 py-10 text-primary-foreground sm:flex-row">
            <div className="flex items-center gap-4">
              <Tag className="size-10 shrink-0" />
              <div>
                <h3 className="text-xl font-bold">Promoções da semana</h3>
                <p className="text-sm text-primary-foreground/80">
                  Descontos em peças selecionadas. Aproveite enquanto durar o estoque.
                </p>
              </div>
            </div>
            <Button asChild size="lg" variant="secondary" className="shrink-0">
              <Link href="/promocoes">Conferir ofertas</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* POR QUE COMPRAR */}
      <section className="py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Garantia de verdade",
                text: "Todas as peças com garantia e nota fiscal. Procedência verificada.",
              },
              {
                icon: Gauge,
                title: "Compatibilidade certa",
                text: "Informações de aplicação por marca e modelo para você não errar na compra.",
              },
              {
                icon: Package,
                title: "Estoque real",
                text: "Disponibilidade atualizada em tempo real. O que está no site, está no estoque.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-card p-6">
                <span className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mb-1.5 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
