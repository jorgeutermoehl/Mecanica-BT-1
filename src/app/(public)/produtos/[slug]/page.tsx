import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
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
import {
  getProduct,
  relatedProducts,
  type MockProduct,
  type IconKey,
} from "@/lib/mock-data";
import { formatBRL, installment, discountPercent } from "@/lib/format";
import { whatsappLink } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return { title: "Produto não encontrado · FullBoost Race Parts" };
  }

  const current = product.promoPrice ?? product.price;
  return {
    title: `${product.name} · FullBoost Race Parts`,
    description: `${product.name} da ${product.brand} — ${formatBRL(
      current,
    )}. ${product.category} de performance com garantia e nota fiscal. Compre na FullBoost Race Parts.`,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers de conteúdo (copy plausível a partir dos dados do produto)  */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Especificações técnicas plausíveis por tipo de peça. */
function buildSpecs(p: MockProduct): { label: string; value: string }[] {
  const byIcon: Partial<Record<IconKey, { label: string; value: string }[]>> = {
    turbo: [
      { label: "Material da carcaça", value: "Alumínio billet usinado" },
      { label: "Pressão máx. de boost", value: "1.8 bar" },
      { label: "Rolamento", value: "Dual ball bearing" },
      { label: "Refrigeração", value: "Água + óleo" },
    ],
    escape: [
      { label: "Material", value: "Aço inox 304" },
      { label: "Diâmetro", value: '3" (76 mm)' },
      { label: "Acabamento", value: "Ponteira polida dupla parede" },
      { label: "Ganho sonoro", value: "Ronco esportivo progressivo" },
    ],
    suspensao: [
      { label: "Regulagem", value: "32 pontos de amortecimento" },
      { label: "Molas", value: "Aço SAE 9254 pré-carregado" },
      { label: "Altura", value: "Rebaixamento ajustável 30–70 mm" },
      { label: "Corpo", value: "Alumínio anodizado anticorrosão" },
    ],
    freios: [
      { label: "Pistões", value: "4 por pinça, alumínio" },
      { label: "Disco", value: "Ventilado 330 mm ranhurado" },
      { label: "Pastilha", value: "Composto semimetálico HP" },
      { label: "Linha", value: "Flexível em malha de aço" },
    ],
    filtros: [
      { label: "Elemento", value: "Algodão lavável multicamada" },
      { label: "Entrada", value: "76 mm universal" },
      { label: "Fluxo", value: "+35% vs. filtro de papel" },
      { label: "Vida útil", value: "Lavável até 1.000.000 km" },
    ],
    eletrica: [
      { label: "Eletrodo", value: "Irídio 0,6 mm" },
      { label: "Tensão de trabalho", value: "12 V" },
      { label: "Rosca", value: "M14 x 1.25" },
      { label: "Índice térmico", value: "Grau 8 (frio, uso severo)" },
    ],
    motor: [
      { label: "Material", value: "Liga forjada de alta resistência" },
      { label: "Tolerância", value: "Usinagem de precisão ±0,01 mm" },
      { label: "Aplicação", value: "Motores turbo e aspirados" },
      { label: "Torque de aperto", value: "Conforme manual do fabricante" },
    ],
    oleos: [
      { label: "Viscosidade", value: "5W40" },
      { label: "Especificação", value: "API SN / ACEA C3" },
      { label: "Base", value: "100% sintética" },
      { label: "Volume", value: "1 litro" },
    ],
    bateria: [
      { label: "Capacidade", value: "60 Ah" },
      { label: "Corrente de partida", value: "600 A (CCA)" },
      { label: "Tensão", value: "12 V" },
      { label: "Tecnologia", value: "Livre de manutenção" },
    ],
  };

  const specific = byIcon[p.icon] ?? [
    { label: "Material", value: "Componente de alta performance" },
    { label: "Acabamento", value: "Padrão racing" },
  ];

  return [
    { label: "Código (SKU)", value: p.sku },
    { label: "Marca", value: p.brand },
    { label: "Categoria", value: p.category },
    ...specific,
    { label: "Aplicação", value: p.fitment ?? "Multiaplicação" },
    { label: "Garantia", value: "12 meses contra defeito de fabricação" },
    { label: "Procedência", value: "Produto original com nota fiscal" },
  ];
}

/** Lista de veículos compatíveis plausível por tipo de peça. */
function buildVehicles(p: MockProduct): string[] {
  const generic = [
    "VW Golf GTI Mk7 (2014–2020)",
    "VW Jetta GLI 2.0 TSI (2019+)",
    "Audi A3 Sedan 1.8 TFSI (2017+)",
    "Honda Civic Si (2018+)",
    "Chevrolet Cruze Turbo (2017+)",
    "Ford Focus 2.0 (2016+)",
  ];
  if (p.icon === "oleos" || p.icon === "eletrica") {
    return [
      "Aplicação universal para motores de alta performance",
      "VW / Audi linha TSI e TFSI",
      "Honda linha VTEC turbo",
      "GM / Ford linhas Ecotec e EcoBoost",
    ];
  }
  return generic;
}

/** Descrição longa plausível para o produto. */
function buildDescription(p: MockProduct): string[] {
  return [
    `${p.name} da ${p.brand}, desenvolvida para quem leva a preparação a sério. Cada componente passa por controle de qualidade rigoroso para entregar desempenho consistente mesmo sob uso severo em pista e rua.`,
    `Projetada para a linha ${p.category.toLowerCase()}, esta peça une materiais premium, engenharia de precisão e acabamento de alto padrão. O resultado é resposta imediata, durabilidade e ganho real de performance no seu setup.`,
  ];
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
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const hasPromo = typeof product.promoPrice === "number";
  const current = product.promoPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const rating = product.rating ?? 0;

  const specs = buildSpecs(product);
  const vehicles = buildVehicles(product);
  const description = buildDescription(product);
  const related = relatedProducts(product);

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

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* ---------- Galeria ---------- */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-carbon">
                <span
                  aria-hidden
                  className="boost-glow pointer-events-none absolute inset-0"
                />
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <PartIcon
                    icon={product.icon}
                    className="size-40 text-muted-foreground/40 sm:size-52"
                  />
                </div>
                <span className="absolute bottom-4 right-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <Gauge className="size-3.5" />
                  Full boost
                </span>
              </div>

              {/* Miniaturas decorativas */}
              <div
                aria-hidden
                className="grid grid-cols-4 gap-3"
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-carbon transition-colors ${
                      i === 0
                        ? "border-primary/60"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <PartIcon
                      icon={product.icon}
                      className={`size-8 ${
                        i === 0 ? "text-primary/70" : "text-muted-foreground/30"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- Informações ---------- */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {product.brand}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  SKU {product.sku}
                </span>
              </div>

              <h1 className="mt-3 text-balance font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:text-4xl">
                {product.name}
              </h1>

              {/* Avaliação */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(rating)
                          ? "size-4 fill-warning text-warning"
                          : "size-4 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  {rating.toFixed(1)}
                  {product.sold ? ` · ${product.sold} vendidos` : ""}
                </span>
              </div>

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

                {/* Estoque */}
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
      <section className="border-t border-border py-16">
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
                  <table className="w-full text-sm">
                    <tbody>
                      {specs.map((s, i) => (
                        <tr
                          key={s.label}
                          className={
                            i % 2 === 0 ? "bg-card" : "bg-card/40"
                          }
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
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {vehicles.map((v) => (
                    <li
                      key={v}
                      className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      <Car className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
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
                    <span className="text-sm">
                      12 meses de garantia de fábrica
                    </span>
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
        <section className="border-t border-border py-16">
          <Container>
            <div className="mb-8">
              <Eyebrow>Combina com o seu setup</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                Produtos relacionados
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
