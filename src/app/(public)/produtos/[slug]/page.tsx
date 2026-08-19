import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Gauge,
  Wrench,
  Car,
  ShieldCheck,
  BadgeCheck,
  Truck,
  Lock,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { ProductCard } from "@/components/public/product-card";
import { ProductActions } from "@/components/public/produto/product-actions";
import { FitmentBadge } from "@/components/public/my-car/fitment-badge";
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
      <section className="py-6 sm:py-8">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
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
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-carbon">
                {/* Badges sobre a galeria */}
                {(hasPromo || product.isNew) && (
                  <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
                    {hasPromo && (
                      <span className="rounded-sm bg-primary px-2 py-1 font-mono text-xs font-bold leading-none text-primary-foreground tabular-nums">
                        -{discountPercent(product.price, product.promoPrice!)}%
                      </span>
                    )}
                    {product.isNew && (
                      <span className="rounded-sm bg-foreground px-2 py-1 font-mono text-xs font-bold leading-none text-background">
                        NOVO
                      </span>
                    )}
                  </div>
                )}
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
              </div>

              {/* Miniaturas reais (apenas quando há mais de uma foto) */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(0, 4).map((url, i) => (
                    <div
                      key={url}
                      className={`relative aspect-square overflow-hidden rounded-md border bg-carbon ${
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

            {/* ---------- Coluna de compra ---------- */}
            <div className="flex flex-col">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {brandLabel}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  SKU {product.sku}
                </span>
              </div>

              <h1 className="mt-2 text-balance font-display text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl">
                {product.name}
              </h1>

              {/* Prova social / código original */}
              {(product.sold > 0 || product.originalCode) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  {product.sold > 0 && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <BadgeCheck className="size-4 text-success" />
                      {product.sold} {product.sold === 1 ? "vendido" : "vendidos"}
                    </span>
                  )}
                  {product.originalCode && (
                    <span>Cód. original {product.originalCode}</span>
                  )}
                </div>
              )}

              {/* Preço — padrão BR: PIX em destaque + parcelamento */}
              <div className="mt-4 border-y border-border py-4">
                {hasPromo && (
                  <p className="font-mono text-sm tabular-nums">
                    <span className="text-muted-foreground line-through">
                      {formatBRL(product.price)}
                    </span>{" "}
                    <span className="font-semibold text-primary">
                      Economize {formatBRL(product.price - product.promoPrice!)}
                    </span>
                  </p>
                )}
                <p className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatBRL(current)}{" "}
                  <span className="font-sans text-sm font-semibold text-success">
                    no PIX
                  </span>
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground tabular-nums">
                  ou 10x de {installment(current)} sem juros no cartão
                </p>

                {/* Estoque real (texto + cor) */}
                <p className="mt-3 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wide">
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
                  <span
                    className={
                      outOfStock
                        ? "text-muted-foreground"
                        : lowStock
                          ? "text-warning"
                          : "text-success"
                    }
                  >
                    {outOfStock
                      ? "Sem estoque"
                      : lowStock
                        ? `Últimas ${product.stock} unidades`
                        : "Em estoque"}
                  </span>
                </p>
              </div>

              {/* Compatibilidade com o "Meu Carro" (client, lê o contexto) */}
              <FitmentBadge product={product} />

              {/* Fitment em destaque */}
              {product.fitment && (
                <p className="mt-4 flex items-center gap-2 text-sm">
                  <Car className="size-4 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 text-muted-foreground">
                    Aplicação:
                  </span>
                  <span className="truncate font-mono font-medium">
                    {product.fitment}
                  </span>
                </p>
              )}

              {/* Quantidade + CTA (client) */}
              <ProductActions product={product} />

              {/* Linha de confiança */}
              <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Truck aria-hidden className="size-4 shrink-0 text-success" />
                  Frete grátis acima de R$ 599
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck
                    aria-hidden
                    className="size-4 shrink-0 text-success"
                  />
                  Garantia e nota fiscal
                </li>
                <li className="flex items-center gap-2">
                  <Lock aria-hidden className="size-4 shrink-0 text-success" />
                  Compra segura
                </li>
              </ul>

              {/* Descrição curta */}
              <p className="mt-4 text-pretty text-sm text-muted-foreground">
                {description[0]}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== DETALHES ===================== */}
      <section className="border-t border-border py-10 sm:py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            {/* Coluna principal */}
            <div className="space-y-10 lg:col-span-2">
              {/* Descrição */}
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  Descrição
                </h2>
                <div className="mt-4 space-y-4 text-pretty text-muted-foreground">
                  {description.map((par, i) => (
                    <p key={i}>{par}</p>
                  ))}
                </div>
              </div>

              {/* Ficha técnica */}
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  Ficha técnica
                </h2>
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border">
                        {baseSpecs.map((s, i) => (
                          <tr key={`${s.label}-${i}`}>
                            <th
                              scope="row"
                              className="w-2/5 px-4 py-2 text-left align-top font-normal text-muted-foreground"
                            >
                              {s.label}
                            </th>
                            <td className="px-4 py-2 text-right font-mono font-medium tabular-nums">
                              {s.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {!specLines && product.technicalSpecs && (
                  <p className="mt-4 font-mono text-sm text-muted-foreground">
                    {product.technicalSpecs}
                  </p>
                )}
              </div>

              {/* Compatibilidade */}
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  Compatibilidade
                </h2>
                <p className="mt-4 flex items-center gap-2 text-sm">
                  <Wrench className="size-4 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 text-muted-foreground">
                    Aplicação indicada:
                  </span>
                  <span className="font-mono font-medium">
                    {product.fitment ?? "Multiaplicação"}
                  </span>
                </p>
                {product.applications.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-2 text-left font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Marca
                            </th>
                            <th className="px-4 py-2 text-left font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Modelo
                            </th>
                            <th className="px-4 py-2 text-left font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Anos
                            </th>
                            <th className="px-4 py-2 text-left font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Motor
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {product.applications.map((app, i) => (
                            <tr
                              key={`${app.vehicleBrand}-${app.vehicleModel}-${i}`}
                            >
                              <td className="px-4 py-2">{app.vehicleBrand}</td>
                              <td className="px-4 py-2">{app.vehicleModel}</td>
                              <td className="px-4 py-2 font-mono tabular-nums">
                                {formatYears(app)}
                              </td>
                              <td className="px-4 py-2 font-mono">
                                {app.engine ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
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

            {/* Coluna lateral — FAQ + selos */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  Perguntas frequentes
                </h2>
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="faq-0"
                  className="mt-4 rounded-lg border border-border bg-card px-4"
                >
                  {faqs.map((f, i) => (
                    <AccordionItem key={f.q} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Selos de confiança */}
                <ul className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
                  <li className="flex items-center gap-3">
                    <BadgeCheck
                      aria-hidden
                      className="size-4 shrink-0 text-success"
                    />
                    Peça original com nota fiscal
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldCheck
                      aria-hidden
                      className="size-4 shrink-0 text-success"
                    />
                    Garantia: {warrantyLabel}
                  </li>
                  <li className="flex items-center gap-3">
                    <Gauge
                      aria-hidden
                      className="size-4 shrink-0 text-success"
                    />
                    Suporte técnico especializado
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* ===================== RELACIONADOS ===================== */}
      {related.length > 0 && (
        <section className="border-t border-border py-10 sm:py-12">
          <Container>
            <h2 className="mb-6 font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
              Produtos relacionados
            </h2>
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
