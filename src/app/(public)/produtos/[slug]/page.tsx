import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Gauge,
  Wrench,
  Car,
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { ProductCard } from "@/components/public/product-card";
import { ProductActions } from "@/components/public/produto/product-actions";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { getStoreProduct, getRelatedProducts } from "@/server/catalog";
import type { StoreProduct } from "@/types/store";
import { formatBRL, installment, discountPercent } from "@/lib/format";
import { whatsappLink } from "@/lib/constants";

// PDP servida pelo cache com tag "catalog" (revalidateTag no painel).

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  const current = product.promoPrice ?? product.price;
  return {
    title: product.name,
    description: `${product.name} da ${product.brand ?? product.category} — ${formatBRL(
      current,
    )}. ${product.category} de performance com garantia e nota fiscal. Compre na FullBoost Race Parts.`,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers de apresentação (dados reais vindos do banco)               */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Quebra a descrição do banco em parágrafos (fallback com copy plausível). */
function buildDescription(p: StoreProduct): string[] {
  if (p.description) {
    const paragraphs = p.description
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (paragraphs.length > 0) return paragraphs;
  }
  return [
    `${p.name} da ${p.brand ?? "FullBoost"}, desenvolvida para quem leva a preparação a sério. Peça da linha ${p.category.toLowerCase()} com controle de qualidade rigoroso para uso severo em pista e rua.`,
  ];
}

/**
 * Especificações técnicas: se o texto seguir o padrão
 * "chave: valor | chave: valor", vira linhas de tabela; senão, parágrafo mono.
 */
function parseTechnicalSpecs(
  specs: string | null,
): { label: string; value: string }[] | null {
  if (!specs || !specs.includes(" | ")) return null;
  return specs
    .split(" | ")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return { label: "Especificação", value: entry };
      return {
        label: entry.slice(0, idx).trim(),
        value: entry.slice(idx + 1).trim(),
      };
    });
}

/** Faixa de anos de uma aplicação ("2008–2020", "2016+", "—"). */
function formatYears(app: StoreProduct["applications"][number]): string {
  if (app.yearStart && app.yearEnd) {
    return app.yearStart === app.yearEnd
      ? String(app.yearStart)
      : `${app.yearStart}–${app.yearEnd}`;
  }
  if (app.yearStart) return `${app.yearStart}+`;
  if (app.yearEnd) return `até ${app.yearEnd}`;
  return "—";
}

const HIGHLIGHTS = [
  "Materiais premium selecionados para uso severo",
  "Engenharia de precisão com tolerâncias apertadas",
  "Ganho real de performance e durabilidade",
  "Instalação com padrão de encaixe original",
];

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStoreProduct(slug);

  if (!product) {
    notFound();
  }

  const hasPromo = product.promoPrice !== null;
  const current = product.promoPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const brandLabel = product.brand ?? product.category;
  const warrantyLabel =
    product.warranty ?? "12 meses contra defeitos de fabricação";

  const description = buildDescription(product);
  const specLines = parseTechnicalSpecs(product.technicalSpecs);
  const baseSpecs: { label: string; value: string }[] = [
    { label: "Código (SKU)", value: product.sku },
    { label: "Marca", value: brandLabel },
    { label: "Categoria", value: product.category },
    ...(product.originalCode
      ? [{ label: "Código original", value: product.originalCode }]
      : []),
    ...(specLines ?? []),
    { label: "Aplicação", value: product.fitment ?? "Multiaplicação" },
    { label: "Garantia", value: warrantyLabel },
    { label: "Procedência", value: "Produto original com nota fiscal" },
  ];

  const related = await getRelatedProducts(product);

  const faqs = [
    {
      q: "Preciso de reprogramação (remap) para usar essa peça?",
      a: "Depende do seu objetivo. Em setups de rua, boa parte das nossas peças funciona em conjunto com a calibração original. Para extrair o máximo de performance, recomendamos acompanhar com um remap feito por um preparador de confiança. Fale com o nosso time que indicamos o caminho certo.",
    },
    {
      q: "A compra tem nota fiscal e garantia?",
      a: "Sim. Toda peça é original, sai com nota fiscal e conta com 12 meses de garantia contra defeitos de fabricação. Guarde a nota para acionar a garantia quando necessário.",
    },
    {
      q: "Qual é o prazo de entrega e como funciona o frete?",
      a: "Despachamos em até 24h após a confirmação do pagamento, com frete rastreável para todo o Brasil. O prazo final e o valor variam conforme o CEP e aparecem no checkout antes de você fechar o pedido.",
    },
    {
      q: "Como confirmo se é compatível com o meu carro?",
      a: "Confira a lista de compatibilidade nesta página e, na dúvida, chame o nosso time no WhatsApp com o modelo, ano e motorização do seu carro. Confirmamos o encaixe antes de você comprar.",
    },
  ];

  const waMessage = `Olá! Quero confirmar a compatibilidade da peça ${product.name} (SKU ${product.sku}) com o meu carro.`;

  return (
    <>
      {/* ===================== TOPO / PRODUTO ===================== */}
      <section className="py-8 sm:py-10">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Início</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/produtos">Produtos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/produtos?categoria=${product.categorySlug}`}>
                    {product.category}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* ---------- Galeria ---------- */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-carbon">
                {!product.image && (
                  <span
                    aria-hidden
                    className="boost-glow pointer-events-none absolute inset-0"
                  />
                )}
                {/* Badges sobre a galeria */}
                <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
                  {hasPromo && (
                    <span className="rounded bg-primary px-2.5 py-1 font-mono text-xs font-bold text-primary-foreground">
                      -{discountPercent(product.price, product.promoPrice!)}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="rounded bg-boost px-2.5 py-1 font-mono text-xs font-bold text-boost-foreground">
                      NOVO
                    </span>
                  )}
                </div>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PartIcon
                      icon={product.icon}
                      className="size-40 text-muted-foreground/40 sm:size-52"
                    />
                  </div>
                )}
                <span className="absolute bottom-4 right-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <Gauge className="size-3.5" />
                  Full boost
                </span>
              </div>

              {/* Miniaturas reais (apenas quando há mais de uma foto) */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(0, 4).map((url, i) => (
                    <div
                      key={url}
                      className={`relative aspect-square overflow-hidden rounded-lg border bg-carbon ${
                        i === 0
                          ? "border-primary/60"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${product.name} — foto ${i + 1}`}
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- Informações ---------- */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {brandLabel}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  SKU {product.sku}
                </span>
              </div>

              <h1 className="mt-3 text-balance font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:text-4xl">
                {product.name}
              </h1>

              {/* Prova social / código original */}
              {(product.sold > 0 || product.originalCode) && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground">
                  {product.sold > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <BadgeCheck className="size-4 text-success" />
                      {product.sold} vendidos
                    </span>
                  )}
                  {product.originalCode && (
                    <span>Cód. original {product.originalCode}</span>
                  )}
                </div>
              )}

              {/* Preço */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                {hasPromo && (
                  <div className="mb-1 flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground line-through">
                      {formatBRL(product.price)}
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      Economize{" "}
                      {formatBRL(product.price - product.promoPrice!)}
                    </span>
                  </div>
                )}
                <p className="font-display text-4xl font-bold tracking-tight text-foreground">
                  {formatBRL(current)}
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  ou 10x de {installment(current)} sem juros
                </p>

                {/* Estoque real */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium uppercase ${
                      outOfStock
                        ? "bg-muted text-muted-foreground"
                        : lowStock
                          ? "bg-warning/15 text-warning"
                          : "bg-success/15 text-success"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full ${
                        outOfStock
                          ? "bg-muted-foreground"
                          : lowStock
                            ? "bg-warning"
                            : "bg-success"
                      }`}
                    />
                    {outOfStock
                      ? "Sem estoque"
                      : lowStock
                        ? `Últimas ${product.stock} unidades`
                        : "Em estoque"}
                  </span>
                </div>
              </div>

              {/* Descrição curta */}
              <p className="mt-6 text-pretty text-muted-foreground">
                {description[0]}
              </p>

              {/* Fitment em destaque */}
              {product.fitment && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <Car className="size-4 shrink-0 text-primary" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Aplicação: </span>
                    <span className="font-mono font-medium">
                      {product.fitment}
                    </span>
                  </span>
                </div>
              )}

              {/* Ações (client) */}
              <ProductActions product={product} />
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== DETALHES ===================== */}
      <section className="border-t border-border py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Coluna principal */}
            <div className="space-y-14 lg:col-span-2">
              {/* Descrição */}
              <div>
                <Eyebrow>Sobre a peça</Eyebrow>
                <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight">
                  Descrição
                </h2>
                <div className="mt-5 space-y-4 text-pretty text-muted-foreground">
                  {description.map((par, i) => (
                    <p key={i}>{par}</p>
                  ))}
                </div>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {HIGHLIGHTS.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Especificações técnicas */}
              <div>
                <Eyebrow>Ficha técnica</Eyebrow>
                <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight">
                  Especificações técnicas
                </h2>
                <div className="mt-5 overflow-hidden rounded-xl border border-border">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {baseSpecs.map((s, i) => (
                        <tr
                          key={`${s.label}-${i}`}
                          className={i % 2 === 0 ? "bg-card" : "bg-card/40"}
                        >
                          <th
                            scope="row"
                            className="w-2/5 border-b border-border px-4 py-3 text-left font-medium text-muted-foreground"
                          >
                            {s.label}
                          </th>
                          <td className="border-b border-border px-4 py-3 text-right font-mono font-medium sm:text-left">
                            {s.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                {!specLines && product.technicalSpecs && (
                  <p className="mt-4 rounded-xl border border-border bg-card p-4 font-mono text-sm text-muted-foreground">
                    {product.technicalSpecs}
                  </p>
                )}
              </div>

              {/* Compatibilidade */}
              <div>
                <Eyebrow>Fitment</Eyebrow>
                <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight">
                  Compatibilidade
                </h2>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-card p-4">
                  <Wrench className="size-4 shrink-0 text-primary" />
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      Aplicação indicada:{" "}
                    </span>
                    <span className="font-mono font-medium">
                      {product.fitment ?? "Multiaplicação"}
                    </span>
                  </p>
                </div>
                {product.applications.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-card">
                            <th className="border-b border-border px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Marca
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Modelo
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Anos
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Motor
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.applications.map((app, i) => (
                            <tr
                              key={`${app.vehicleBrand}-${app.vehicleModel}-${i}`}
                              className={i % 2 === 0 ? "bg-card/40" : "bg-card"}
                            >
                              <td className="border-b border-border px-4 py-3">
                                <span className="inline-flex items-center gap-2">
                                  <Car className="size-4 shrink-0 text-muted-foreground" />
                                  {app.vehicleBrand}
                                </span>
                              </td>
                              <td className="border-b border-border px-4 py-3">
                                {app.vehicleModel}
                              </td>
                              <td className="border-b border-border px-4 py-3 font-mono">
                                {formatYears(app)}
                              </td>
                              <td className="border-b border-border px-4 py-3 font-mono">
                                {app.engine ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                    Multiaplicação — confirme o encaixe com o nosso time antes
                    de comprar.
                  </p>
                )}
                <p className="mt-4 text-sm text-muted-foreground">
                  Não encontrou o seu carro na lista? Confirme a compatibilidade
                  com o nosso time antes de comprar.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <a
                    href={whatsappLink(waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Confirmar compatibilidade
                  </a>
                </Button>
              </div>
            </div>

            {/* Coluna lateral — FAQ */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Eyebrow>Tire suas dúvidas</Eyebrow>
                <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight">
                  Perguntas frequentes
                </h2>
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="faq-0"
                  className="mt-5 rounded-xl border border-border bg-card px-4"
                >
                  {faqs.map((f, i) => (
                    <AccordionItem key={f.q} value={`faq-${i}`}>
                      <AccordionTrigger className="font-medium">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Selos de confiança */}
                <div className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="size-4 shrink-0 text-success" />
                    <span className="text-sm">Peça original com nota fiscal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-4 shrink-0 text-success" />
                    <span className="text-sm">Garantia: {warrantyLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gauge className="size-4 shrink-0 text-success" />
                    <span className="text-sm">
                      Suporte técnico especializado
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* ===================== RELACIONADOS ===================== */}
      {related.length > 0 && (
        <section className="border-t border-border py-10 sm:py-14 lg:py-16">
          <Container>
            <div className="mb-8">
              <Eyebrow>Combina com o seu setup</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Produtos relacionados
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
