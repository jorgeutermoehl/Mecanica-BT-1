import type { Metadata } from "next";
import { BadgePercent, Info, TicketPercent } from "lucide-react";
import { listCoupons, listPromotionProducts } from "@/server/promotions";
import { formatBRL, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CouponForm } from "@/components/admin/promocoes/coupon-form";
import { CouponToggle } from "@/components/admin/promocoes/coupon-toggle";
import {
  ApplyPromoDialog,
  RemovePromoButton,
} from "@/components/admin/promocoes/promo-price-dialog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promoções e cupons",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default async function PromocoesPage() {
  const [coupons, products] = await Promise.all([listCoupons(), listPromotionProducts()]);

  // Produtos com promoção ativa primeiro (sort estável mantém ordem alfabética dentro dos grupos).
  const sortedProducts = [...products].sort(
    (a, b) => Number(b.promoPrice !== null) - Number(a.promoPrice !== null),
  );
  const activePromos = products.filter((p) => p.promoPrice !== null).length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Promoções e cupons
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeCoupons} {activeCoupons === 1 ? "cupom ativo" : "cupons ativos"} ·{" "}
          {activePromos} {activePromos === 1 ? "produto em promoção" : "produtos em promoção"}.
        </p>
      </div>

      {/* Seção A — Cupons de desconto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 uppercase tracking-wide">
            <TicketPercent className="size-4 text-primary" />
            Cupons de desconto
          </CardTitle>
          <CardAction>
            <CouponForm />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {coupons.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum cupom cadastrado ainda. Clique em “Novo cupom” para criar o primeiro.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Pedido mínimo</TableHead>
                    <TableHead className="text-right">Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-0 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm font-bold">{c.code}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {c.minOrderValue !== null && c.minOrderValue > 0 ? (
                          formatBRL(c.minOrderValue)
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {c.usageCount} / {c.usageLimit ?? "∞"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            c.isActive
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {c.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {dateFormat.format(new Date(c.createdAt))}
                      </TableCell>
                      <TableCell className="text-right">
                        <CouponToggle id={c.id} code={c.code} isActive={c.isActive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-info" aria-hidden />
            Cupons ativos são aceitos no checkout da loja e na página /promocoes.
          </p>
        </CardContent>
      </Card>

      {/* Seção B — Produtos em promoção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 uppercase tracking-wide">
            <BadgePercent className="size-4 text-primary" />
            Produtos em promoção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum produto disponível para promoção.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Preço normal</TableHead>
                    <TableHead className="text-right">Preço promocional</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="w-0 text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.map((p) => {
                    const hasPromo = p.promoPrice !== null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="max-w-[260px]">
                            <p className="truncate text-sm font-medium" title={p.name}>
                              {p.name}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono text-sm",
                            hasPromo && "text-muted-foreground line-through",
                          )}
                        >
                          {formatBRL(p.salePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {hasPromo ? (
                            <span className="text-primary">{formatBRL(p.promoPrice!)}</span>
                          ) : (
                            <span className="font-normal text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasPromo ? (
                            <Badge variant="secondary" className="bg-primary/15 font-mono text-primary">
                              −{discountPercent(p.salePrice, p.promoPrice!)}%
                            </Badge>
                          ) : (
                            <span className="font-mono text-sm text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono text-sm",
                            p.stock === 0 && "text-destructive",
                          )}
                        >
                          {p.stock} un
                        </TableCell>
                        <TableCell className="text-right">
                          {hasPromo ? (
                            <RemovePromoButton
                              productId={p.id}
                              productName={p.name}
                              salePrice={p.salePrice}
                            />
                          ) : (
                            <ApplyPromoDialog
                              productId={p.id}
                              productName={p.name}
                              sku={p.sku}
                              salePrice={p.salePrice}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-info" aria-hidden />
            Produtos com preço promocional entram automaticamente na vitrine de promoções da
            loja com selo de desconto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
