import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listAdminProducts, type AdminProduct } from "@/server/products";
import { PRODUCT_STATUS_LABEL, type ProductStatus } from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PartIcon } from "@/components/shared/part-icon";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { ProductStatusToggle } from "@/components/admin/products/product-status-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

/** Padrão Stripe: cabeçalho de tabela discreto e respiro nas bordas do card. */
const TH_CLASS =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TABLE_CLASS =
  "[&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:last-child]:pr-4";

/** Status do produto sobre o StatusBadge único (texto + cor, nunca cor sozinha). */
const STATUS_TONE: Record<ProductStatus, StatusTone> = {
  PROMOTION: "primary",
  ACTIVE: "success",
  OUT_OF_STOCK: "warning",
  INACTIVE: "muted",
};

function ProductThumb({ product }: { product: AdminProduct }) {
  if (product.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={product.name}
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
      <PartIcon icon={product.category.toLowerCase()} className="size-4" />
    </span>
  );
}

const CONDITION_SHORT: Record<string, string> = {
  NEW: "Novo",
  USED: "Usado",
  REMAN: "Revisado",
};

/** SKU · categoria · condição · destaque — numa linha sob o nome. */
function ProductTags({ product: p }: { product: AdminProduct }) {
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span className="font-mono">{p.sku}</span>
      <span aria-hidden>·</span>
      <span>{p.category}</span>
      <span aria-hidden>·</span>
      <span>{CONDITION_SHORT[p.condition] ?? p.condition}</span>
      {p.featured && (
        <span className="rounded-sm bg-boost px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none text-white">
          Destaque
        </span>
      )}
    </p>
  );
}

function PriceCell({ product: p }: { product: AdminProduct }) {
  if (p.priceOnRequest) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        Sob consulta
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-end font-mono text-xs tabular-nums">
      {p.promoPrice !== null ? (
        <>
          <span className="text-muted-foreground line-through">
            {formatBRL(p.salePrice)}
          </span>
          <span className="text-primary">{formatBRL(p.promoPrice)}</span>
        </>
      ) : (
        <span>{formatBRL(p.salePrice)}</span>
      )}
    </span>
  );
}

function StockCell({ product: p }: { product: AdminProduct }) {
  const low = p.stock <= p.minStock;
  return (
    <span className="whitespace-nowrap font-mono text-xs tabular-nums">
      <span className={cn("text-sm", low && "font-medium text-warning")}>
        {p.stock}
      </span>
      <span className="ml-1 text-muted-foreground">un.</span>
    </span>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await listAdminProducts(q);

  return (
    <div className="space-y-6">
      {/* Cabeçalho — "Novo produto" é a única ação primária da tela */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-tight">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Anúncios da loja — produtos ativos são publicados imediatamente.
          </p>
        </div>
        <Button asChild className="w-full gap-2 sm:w-auto">
          <Link href="/admin/produtos/novo">
            <Plus className="size-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <form
        method="GET"
        action="/admin/produtos"
        role="search"
        className="flex max-w-md items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome, SKU ou código original"
            aria-label="Buscar produtos"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {q
              ? `Nenhum produto encontrado para “${q}”.`
              : "Nenhum produto cadastrado ainda — publique o primeiro anúncio."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Celular: cards (tabela não cabe) */}
          <ul className="space-y-3 md:hidden">
            {products.map((p) => (
              <li key={p.id}>
                <Card>
                  <CardContent className="flex gap-3 p-3">
                    <ProductThumb product={p} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">
                        {p.name}
                      </p>
                      <ProductTags product={p} />
                      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                        <PriceCell product={p} />
                        <StockCell product={p} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusBadge tone={STATUS_TONE[p.status]}>
                          {PRODUCT_STATUS_LABEL[p.status]}
                        </StatusBadge>
                        <div className="flex items-center gap-1">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/produtos/${p.id}`}>Editar</Link>
                          </Button>
                          <ProductStatusToggle
                            productId={p.id}
                            productName={p.name}
                            active={p.status !== "INACTIVE"}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: tabela enxuta (SKU, categoria e selos sob o nome) */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className={TABLE_CLASS}>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={TH_CLASS}>Produto</TableHead>
                      <TableHead className={cn(TH_CLASS, "text-right")}>
                        Preço
                      </TableHead>
                      <TableHead className={cn(TH_CLASS, "text-right")}>
                        Estoque
                      </TableHead>
                      <TableHead className={TH_CLASS}>Status</TableHead>
                      <TableHead className={cn(TH_CLASS, "text-right")}>
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-[420px]">
                          <div className="flex items-center gap-3">
                            <ProductThumb product={p} />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/produtos/${p.id}`}
                                className="block truncate font-medium hover:text-primary"
                              >
                                {p.name}
                              </Link>
                              <ProductTags product={p} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <PriceCell product={p} />
                        </TableCell>
                        <TableCell className="text-right">
                          <StockCell product={p} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={STATUS_TONE[p.status]}>
                            {PRODUCT_STATUS_LABEL[p.status]}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/admin/produtos/${p.id}`}>
                                Editar
                              </Link>
                            </Button>
                            <ProductStatusToggle
                              productId={p.id}
                              productName={p.name}
                              active={p.status !== "INACTIVE"}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        {products.length}{" "}
        {products.length === 1 ? "produto listado" : "produtos listados"}
        {q ? ` para a busca “${q}”` : ""}
      </p>
    </div>
  );
}
