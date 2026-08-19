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
const TH_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
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

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table className={TABLE_CLASS}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={TH_CLASS}>Produto</TableHead>
                <TableHead className={TH_CLASS}>SKU</TableHead>
                <TableHead className={TH_CLASS}>Categoria</TableHead>
                <TableHead className={cn(TH_CLASS, "text-right")}>Custo</TableHead>
                <TableHead className={cn(TH_CLASS, "text-right")}>Preço</TableHead>
                <TableHead className={cn(TH_CLASS, "text-right")}>Promo</TableHead>
                <TableHead className={cn(TH_CLASS, "text-right")}>Estoque</TableHead>
                <TableHead className={TH_CLASS}>Status</TableHead>
                <TableHead className={cn(TH_CLASS, "text-right")}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {q
                      ? `Nenhum produto encontrado para “${q}”.`
                      : "Nenhum produto cadastrado ainda — publique o primeiro anúncio."}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                  const lowStock = p.stock <= p.minStock;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} />
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-medium">
                              {p.name}
                            </p>
                            {p.brand && (
                              <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                                {p.brand}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.category}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatBRL(p.costPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {formatBRL(p.salePrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {p.promoPrice !== null ? (
                          <span className="text-primary">
                            {formatBRL(p.promoPrice)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono text-sm tabular-nums",
                            lowStock && "font-medium text-warning",
                          )}
                        >
                          {p.stock}
                        </span>
                        <span className="ml-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                          / mín. {p.minStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={STATUS_TONE[p.status]}>
                          {PRODUCT_STATUS_LABEL[p.status]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/produtos/${p.id}`}>Editar</Link>
                          </Button>
                          <ProductStatusToggle
                            productId={p.id}
                            productName={p.name}
                            active={p.status !== "INACTIVE"}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        {products.length}{" "}
        {products.length === 1 ? "produto listado" : "produtos listados"}
        {q ? ` para a busca “${q}”` : ""}
      </p>
    </div>
  );
}
