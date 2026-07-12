import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { whatsappLink } from "@/lib/constants";
import { getStoreCategories } from "@/server/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categorias",
  description:
    "Navegue por categoria e encontre rodas, turbinas, freios, suspensão, escape e mais peças de performance para o seu projeto.",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Frase genérica quando a categoria ainda não tem descrição cadastrada. */
function fallbackDescription(name: string): string {
  return `Seleção de ${name.toLowerCase()} de performance com procedência garantida para o seu setup.`;
}

export default async function CategoriasPage() {
  const categories = await getStoreCategories();

  return (
    <>
      {/* ===================== CABEÇALHO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span
          aria-hidden
          className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        />
        <Container className="relative py-16">
          <Eyebrow>Explore por linha</Eyebrow>
          <h1 className="mt-4 text-balance text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-5xl">
            Categorias
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            Do turbo ao fluido de freio: encontre rápido a peça certa para o seu
            setup navegando por categoria. Cada seção reúne o que há de melhor em
            performance, com procedência e garantia.
          </p>
        </Container>
      </section>

      {/* ===================== GRID DE CATEGORIAS ===================== */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/produtos?categoria=${c.slug}`}
                className={cn(
                  "group relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10",
                  c.featured
                    ? "border-primary/60 shadow-lg shadow-primary/10 sm:col-span-2 sm:p-8"
                    : "border-border",
                )}
              >
                {c.featured && (
                  <span
                    aria-hidden
                    className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl opacity-70"
                  />
                )}

                <div className="relative flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                      c.featured ? "size-16" : "size-14",
                    )}
                  >
                    <PartIcon
                      icon={c.icon}
                      className={c.featured ? "size-8" : "size-7"}
                    />
                  </span>
                  <span className="flex items-center gap-2">
                    {c.featured && (
                      <Badge className="font-mono text-[11px] uppercase tracking-wide">
                        Destaque
                      </Badge>
                    )}
                    <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                      {c.count} {c.count === 1 ? "item" : "itens"}
                    </span>
                  </span>
                </div>

                <h2
                  className={cn(
                    "relative mt-5 font-display font-bold uppercase tracking-tight transition-colors group-hover:text-primary",
                    c.featured ? "text-2xl" : "text-xl",
                  )}
                >
                  {c.name}
                </h2>

                <p
                  className={cn(
                    "relative mt-2 flex-1 text-sm text-muted-foreground",
                    c.featured && "max-w-xl",
                  )}
                >
                  {c.description ?? fallbackDescription(c.name)}
                </p>

                <span className="relative mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wide text-primary">
                  Ver produtos
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== CTA WHATSAPP ===================== */}
      <section className="pb-20">
        <Container>
          <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-border bg-carbon px-8 py-14 text-center">
            <span
              aria-hidden
              className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-40"
            />
            <h2 className="relative max-w-2xl font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Não achou a categoria certa?{" "}
              <span className="text-boost">A gente te orienta.</span>
            </h2>
            <p className="relative max-w-xl text-muted-foreground">
              Diz qual é o seu carro e o objetivo do projeto que o nosso time
              técnico indica exatamente as peças compatíveis com o seu setup.
            </p>
            <Button asChild size="lg" className="relative gap-2">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
