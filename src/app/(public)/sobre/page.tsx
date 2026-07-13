import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Target,
  Truck,
  Headset,
  BadgeCheck,
  Check,
  Clock,
  MapPin,
  Gauge,
  Handshake,
  Zap,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/lib/constants";
import { BRANDS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Quem somos: mais de uma década montando setups de performance com procedência, curadoria técnica e atendimento especializado. Conheça a história da FullBoost Race Parts.",
};

const ABOUT_WHATSAPP = whatsappLink(
  "Olá! Vi a página Sobre da FullBoost e quero falar com um especialista.",
);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

const STATS = [
  { value: "+15", label: "Anos de estrada" },
  { value: "+80 mil", label: "Pedidos entregues" },
  { value: "40+", label: "Marcas parceiras" },
  { value: "4.9", label: "Avaliação média" },
];

const TIMELINE = [
  {
    year: "2011",
    title: "Começou na oficina",
    text: "Abrimos a primeira oficina de preparação, montando motores turbo para pista e rua.",
  },
  {
    year: "2015",
    title: "Virou loja",
    text: "A procura por peças de verdade virou uma loja física dedicada a performance.",
  },
  {
    year: "2019",
    title: "Chegou no Brasil todo",
    text: "Lançamos o e-commerce e passamos a despachar race parts para todos os estados.",
  },
  {
    year: "2024",
    title: "+80 mil pedidos",
    text: "Centro de distribuição próprio e uma comunidade de preparadores que não para de crescer.",
  },
];

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Procedência garantida",
    text: "Peças originais e homologadas, com nota fiscal e garantia. Réplica sem procedência não entra no catálogo.",
  },
  {
    icon: Target,
    title: "Curadoria técnica",
    text: "Cada item passa pelo crivo de quem prepara carro. Se não colocaríamos no nosso, não vendemos pro seu.",
  },
  {
    icon: Truck,
    title: "Entrega rastreável",
    text: "Despacho em até 24h e envio para todo o Brasil, com rastreio do pedido até a sua garagem.",
  },
  {
    icon: Headset,
    title: "Suporte que entende",
    text: "Time técnico para resolver compatibilidade, potência e instalação — antes e depois da compra.",
  },
];

const QUALITY = [
  "Peças testadas em bancada e em uso real de pista e rua",
  "Marcas reconhecidas: Garrett, Brembo, Bosch, NGK, Sachs e mais",
  "Especificações técnicas reais, sem promessa de potência inventada",
  "Nota fiscal e garantia de fábrica em todos os itens",
];

const COMMITMENTS = [
  {
    icon: Gauge,
    title: "Performance comprovada",
    text: "Trabalhamos com produtos que entregam ganho real, medido no dinamômetro — não na conversa.",
  },
  {
    icon: Handshake,
    title: "Do lado do preparador",
    text: "Da escolha da peça ao acerto final, acompanhamos o seu projeto como se fosse o nosso.",
  },
  {
    icon: Zap,
    title: "Sempre evoluindo",
    text: "Novos lançamentos, marcas e tecnologias entrando no catálogo o tempo todo.",
  },
];

export default function SobrePage() {
  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
        <Container className="relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <Eyebrow>Quem somos · Race Parts</Eyebrow>
            <h1 className="mt-5 text-balance text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-6xl">
              Mais de uma década montando{" "}
              <span className="text-boost">setups que aguentam o tranco.</span>
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-lg text-muted-foreground">
              A FullBoost nasceu na oficina, no meio do óleo e do boost. Somos
              preparadores e apaixonados por performance que transformaram a
              paixão por carro em uma loja de peças com procedência, curadoria
              técnica e atendimento que fala a sua língua.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/produtos">
                  Ver produtos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href={ABOUT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  Falar com especialista
                </a>
              </Button>
            </div>
          </div>

          {/* Painel visual (credenciais) */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-square w-full max-w-md -skew-x-3 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
              <span className="boost-glow absolute inset-0" />
              <div className="absolute inset-0 skew-x-3 p-8">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <PartIcon icon="turbo" className="size-12 text-primary" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Est. 2011
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Oficina + Loja
                    </p>
                    <p className="mt-2 font-display text-4xl font-bold uppercase leading-[0.95] text-boost">
                      Full boost, sempre.
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                    <div>
                      <dt className="font-display text-2xl font-bold text-foreground">+15</dt>
                      <dd className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                        Anos de pista
                      </dd>
                    </div>
                    <div>
                      <dt className="font-display text-2xl font-bold text-foreground">4.9</dt>
                      <dd className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                        Nota dos clientes
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== NÚMEROS ===================== */}
      <section className="border-b border-border bg-card/40 py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="mb-10 text-center">
            <Eyebrow>Em números</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              A estrada da FullBoost
            </h2>
          </div>
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  {s.value}
                </dt>
                <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ===================== NOSSA HISTÓRIA ===================== */}
      <section className="py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <Eyebrow>Nossa história</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Da bancada da oficina para todo o Brasil
              </h2>
              <div className="mt-5 space-y-4 text-muted-foreground">
                <p>
                  A gente começou como muita gente começa: com um carro na
                  garagem, uma turbina na mão e vontade de arrancar mais potência
                  de cada componente. Foi na oficina, sujando a mão de graxa, que
                  aprendemos o que separa uma peça boa de uma peça que só parece
                  boa na foto.
                </p>
                <p>
                  Com o tempo, os clientes começaram a pedir indicação de peça
                  antes de pedir serviço. Foi aí que a FullBoost virou loja: um
                  catálogo montado por quem prepara carro, para quem prepara
                  carro. Hoje despachamos race parts para todo o país, mas a
                  régua continua a mesma — só vendemos o que colocaríamos no
                  nosso próprio motor.
                </p>
              </div>
            </div>

            {/* Linha do tempo */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
              <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70" />
              <p className="relative font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Linha do tempo
              </p>
              <ol className="relative mt-6 space-y-6">
                {TIMELINE.map((t) => (
                  <li key={t.year} className="flex gap-4">
                    <span className="w-12 shrink-0 pt-0.5 font-mono text-sm font-bold text-primary">
                      {t.year}
                    </span>
                    <div className="border-l border-border pl-4">
                      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                        {t.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== POR QUE ESCOLHER ===================== */}
      <section className="border-y border-border bg-card/40 py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="mb-10">
            <Eyebrow>Por que escolher</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              O que faz a FullBoost diferente
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-base font-semibold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== QUALIDADE DAS PEÇAS ===================== */}
      <section className="py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Selo de procedência */}
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-carbon p-8 sm:p-10">
                <span aria-hidden className="boost-glow absolute inset-0" />
                <div className="relative flex flex-col items-center gap-5 text-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BadgeCheck className="size-8" />
                  </span>
                  <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                    Selo FullBoost de procedência
                  </p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Todo item é conferido, catalogado e sai com nota fiscal e
                    garantia. Sem atalho, sem peça duvidosa.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {BRANDS.slice(0, 6).map((b) => (
                      <span
                        key={b}
                        className="rounded border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Eyebrow>Qualidade das peças</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Só entra no catálogo o que aguenta pista
              </h2>
              <p className="mt-5 text-muted-foreground">
                Performance de verdade não combina com peça de procedência
                duvidosa. Por isso cada item que você encontra aqui passou por
                uma seleção rigorosa — da bancada de teste à conferência final
                antes do despacho.
              </p>
              <ul className="mt-6 space-y-3">
                {QUALITY.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="size-3.5" />
                    </span>
                    <span className="text-sm text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== ATENDIMENTO ESPECIALIZADO ===================== */}
      <section className="border-y border-border bg-card/40 py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <Eyebrow>Atendimento especializado</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Fala com quem coloca a mão na graxa
              </h2>
              <div className="mt-5 space-y-4 text-muted-foreground">
                <p>
                  Aqui você não fala com robô nem com quem nunca abriu um motor.
                  Nosso time é formado por preparadores e entusiastas que sabem a
                  diferença entre um flange 44mm e um 38mm sem precisar consultar
                  a tabela.
                </p>
                <p>
                  Antes de comprar, a gente ajuda a escolher a peça certa pro seu
                  setup. Depois de comprar, seguimos por perto para tirar dúvida
                  de instalação e regulagem. Compatibilidade, ganho de potência,
                  torque de aperto — pode chamar no WhatsApp.
                </p>
              </div>
            </div>

            {/* Cartão de contato */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Headset className="size-5" />
                </span>
                <div>
                  <p className="font-display text-base font-semibold uppercase tracking-wide">
                    Central FullBoost
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Suporte técnico especializado
                  </p>
                </div>
              </div>

              <dl className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-semibold text-foreground">Horário</dt>
                    <dd className="font-mono text-xs text-muted-foreground">{SITE.hours}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-semibold text-foreground">Endereço</dt>
                    <dd className="font-mono text-xs text-muted-foreground">{SITE.address}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-semibold text-foreground">WhatsApp</dt>
                    <dd className="font-mono text-xs text-muted-foreground">
                      Resposta rápida em horário comercial
                    </dd>
                  </div>
                </div>
              </dl>

              <Button asChild className="mt-6 w-full gap-2">
                <a href={ABOUT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== COMPROMISSO COM PERFORMANCE ===================== */}
      <section className="py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="mb-10 text-center">
            <Eyebrow>Compromisso com performance</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              O que a gente promete pra você
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {COMMITMENTS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-base font-semibold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="pb-12 sm:pb-16 lg:pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-carbon px-5 py-10 text-center sm:px-8 sm:py-14">
            <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-40" />
            <div className="relative flex flex-col items-center gap-5">
              <h2 className="max-w-2xl font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                Bora montar o seu setup?{" "}
                <span className="text-boost">A FullBoost acelera com você.</span>
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Explore o catálogo completo de race parts ou chame nosso time
                técnico para escolher a peça certa pro seu projeto.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/produtos">
                    Ver produtos
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a href={ABOUT_WHATSAPP} target="_blank" rel="noopener noreferrer">
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
