import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ClipboardList,
  MessageCircle,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import {
  CHECKOUT_ENABLED,
  SITE,
  SPECIALTIES,
  whatsappLink,
} from "@/lib/constants";

// Página institucional SEM números, datas ou selos não comprováveis:
// tudo aqui descreve o que a loja de fato faz hoje (CDC art. 37).

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "FullBoost Race Parts: peças de tuning para transmissão, motor e segurança — coroa e pinhão, virabrequins e gaiolas (rollcage) — com atendimento direto pelo WhatsApp.",
};

const ABOUT_WHATSAPP = whatsappLink(
  "Olá! Vi a página Sobre da FullBoost e quero tirar uma dúvida sobre uma peça.",
);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

const LINES = [
  {
    icon: "transmissao",
    title: "Transmissão",
    text: "Coroa e pinhão em várias relações para câmbios VW e outros — para quem quer mais arrancada ou mais velocidade final.",
  },
  {
    icon: "motor",
    title: "Motor",
    text: "Virabrequins e componentes internos, da linha a ar ao AP, para montagem de rua ou preparação.",
  },
  {
    icon: "gaiolas",
    title: "Gaiolas & segurança",
    text: "Gaiolas de proteção (rollcage) sob medida: com ou sem bancos traseiros, furando ou desviando o painel, com ou sem suporte de paraquedas.",
  },
] as const;

const STEPS = [
  {
    icon: Search,
    title: "Escolha a peça",
    text: "Veja fotos reais, ficha técnica e a aplicação indicada de cada peça.",
  },
  ...(CHECKOUT_ENABLED
    ? [
        {
          icon: ClipboardList,
          title: "Faça o pedido",
          text: "As peças ficam reservadas para você por 72 horas.",
        },
        {
          icon: MessageCircle,
          title: "Finalize no WhatsApp",
          text: "Confirmamos a aplicação, o frete e o pagamento (Pix ou cartão) direto com você.",
        },
      ]
    : [
        {
          icon: MessageCircle,
          title: "Chame no WhatsApp",
          text: "O botão da peça já manda o anúncio e o preço. Confirmamos aplicação e frete.",
        },
        {
          icon: ClipboardList,
          title: "Pague",
          text: "Pix ou cartão (link de pagamento), combinado direto com você.",
        },
      ]),
  {
    icon: Truck,
    title: "Receba em casa",
    text: "Enviamos para todo o Brasil com código de rastreio.",
  },
];

const COMMITMENTS = [
  "Fotos reais das peças que estão no estoque",
  "Estoque controlado: só vendemos o que temos",
  "Aplicação confirmada antes da compra, sem empurrar peça errada",
  "Atendimento por gente que entende de preparação",
];

export default function SobrePage() {
  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span
          aria-hidden
          className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        />
        <Container className="relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Eyebrow>Quem somos</Eyebrow>
            <h1 className="mt-5 text-balance text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-6xl">
              Peças de tuning para{" "}
              <span className="text-boost">quem leva o projeto a sério.</span>
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-lg text-muted-foreground">
              A {SITE.name} vende peças de transmissão, motor e segurança para
              carros de rua e pista. O atendimento é direto, pelo WhatsApp, com
              quem conhece a peça e o projeto.
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
                  href={ABOUT_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Foto real de peça da loja */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-lg border border-border">
              <Image
                src="/produtos/coroa-pinhao-lote.webp"
                alt="Lote de coroas e pinhões embalados"
                fill
                sizes="(max-width: 1024px) 0px, 32rem"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== O QUE VENDEMOS ===================== */}
      <section className="py-10 sm:py-14 lg:py-16">
        <Container>
          <Eyebrow>O que vendemos</Eyebrow>
          <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Foco em três linhas
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LINES.map((line) => (
              <div
                key={line.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <PartIcon icon={line.icon} className="size-8 text-primary" />
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                  {line.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {line.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => (
              <span
                key={s}
                className="rounded border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== COMO COMPRAR ===================== */}
      <section className="border-y border-border bg-card/40 py-10 sm:py-14 lg:py-16">
        <Container>
          <Eyebrow>Como comprar</Eyebrow>
          <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Do site ao WhatsApp, sem complicação
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-border bg-background p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <step.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ===================== COMPROMISSOS ===================== */}
      <section className="py-10 sm:py-14 lg:py-16">
        <Container className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Nosso compromisso</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Transparência antes da venda
            </h2>
            <p className="mt-3 text-muted-foreground">
              Peça de preparação errada custa caro. Por isso a gente confirma a
              aplicação com você antes de fechar o pedido.
            </p>
          </div>
          <ul className="space-y-3">
            {COMMITMENTS.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {c}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="pb-12 sm:pb-16 lg:pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-carbon px-5 py-10 text-center sm:px-8 sm:py-14">
            <span
              aria-hidden
              className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-40"
            />
            <div className="relative flex flex-col items-center gap-5">
              <PackageCheck className="size-8 text-primary" />
              <h2 className="max-w-2xl font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                Tem um projeto em andamento?
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Manda o carro, o motor e o objetivo que a gente indica a peça
                certa.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/produtos">
                    Ver produtos
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a
                    href={ABOUT_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    Chamar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
