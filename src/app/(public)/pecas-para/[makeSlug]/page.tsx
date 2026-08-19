import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getStoreProducts, getVehicleCatalog } from "@/server/catalog";
import { productMatchesVehicle, type StoreProduct } from "@/types/store";

/**
 * Landing SEO por marca: /pecas-para/volkswagen
 * Servida pelo cache com tag "catalog" — sem force-dynamic.
 */

type Params = Promise<{ makeSlug: string }>;

async function getMake(makeSlug: string) {
  const makes = await getVehicleCatalog();
  return makes.find((m) => m.slug === makeSlug) ?? null;
}

/** Produtos que atendem alguma versão da lista (universais por último). */
function compatibleProducts(
  products: StoreProduct[],
  versionIds: string[],
): StoreProduct[] {
  return products
    .filter((p) => versionIds.some((id) => productMatchesVehicle(p, id)))
    .sort(
      (a, b) =>
        Number(a.fitmentType === "UNIVERSAL") -
        Number(b.fitmentType === "UNIVERSAL"),
    );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { makeSlug } = await params;
  const make = await getMake(makeSlug);
  if (!make) return { title: "Marca não encontrada" };
  return {
    title: `Peças de performance para ${make.name}`,
    description: `Turbo, escape, freios, suspensão e mais peças de performance compatíveis com ${make.name}. Compre com garantia e nota fiscal na FullBoost Race Parts.`,
  };
}

export default async function MakePage({ params }: { params: Params }) {
  const { makeSlug } = await params;
  const [make, products] = await Promise.all([
    getMake(makeSlug),
    getStoreProducts(),
  ]);

  if (!make) notFound();

  const versionIds = make.models.flatMap((m) => m.versions.map((v) => v.id));
  const compatible = compatibleProducts(products, versionIds);

  // Categorias presentes entre os compatíveis, com contagem.
  const categoryCounts = new Map<string, { name: string; count: number }>();
  for (const p of compatible) {
    const entry = categoryCounts.get(p.categorySlug);
    if (entry) entry.count += 1;
    else categoryCounts.set(p.categorySlug, { name: p.category, count: 1 });
  }

  return (
    <Container className="py-10 lg:py-14">
      <Breadcrumb>
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
            <BreadcrumbPage>Peças para {make.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Cabeçalho */}
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-6 bg-primary" />
          Peças para
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Peças de performance para {make.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {compatible.length}{" "}
          {compatible.length === 1
            ? "peça compatível encontrada"
            : "peças compatíveis encontradas"}{" "}
          para os modelos {make.name} do nosso catálogo. Selecione o seu modelo
          para refinar ou explore por categoria.
        </p>
      </div>

      {/* Modelos da marca */}
      {make.models.length > 0 && (
        <div className="mt-6">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Modelos
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {make.models.map((model) => (
              <li key={model.id}>
                <Link
                  href={`/pecas-para/${make.slug}/${model.slug}`}
                  className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {make.name} {model.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Categorias com contagem */}
      {categoryCounts.size > 0 && (
        <div className="mt-6">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Categorias compatíveis
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[...categoryCounts.entries()].map(([slug, c]) => (
              <li key={slug}>
                <Link
                  href={`/produtos?categoria=${slug}`}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {c.name}
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator className="mt-8" />

      {/* Produtos compatíveis */}
      {compatible.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {compatible.map((p) => (
            <div key={p.id} className="relative grid">
              {p.fitmentType === "UNIVERSAL" && (
                <Badge
                  variant="secondary"
                  className="pointer-events-none absolute right-2 top-2 z-10 font-mono uppercase"
                >
                  Universal
                </Badge>
              )}
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Nenhuma peça compatível ainda
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Ainda não temos peças específicas para {make.name} no catálogo, mas
            o estoque muda toda semana.
          </p>
        </div>
      )}

      {/* Link para o catálogo completo */}
      <div className="mt-10 text-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/produtos">Ver catálogo completo</Link>
        </Button>
      </div>
    </Container>
  );
}
