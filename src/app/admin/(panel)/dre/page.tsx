import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, PiggyBank, Receipt, ShoppingCart } from "lucide-react";
import { getDreReport } from "@/server/reports";
import { formatBRL } from "@/lib/format";
import { SALE_CHANNEL_LABEL, type SaleChannel } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CsvButton } from "@/components/admin/dre/csv-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DRE Gerencial",
};

/* ------------------------------------------------------------------ */
/* Helpers de data e formatação                                        */
/* ------------------------------------------------------------------ */

/** Data local no formato yyyy-mm-dd (para links e inputs type=date). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "12 de julho de 2026" a partir de yyyy-mm-dd. */
function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

/** Número em formato Excel pt-BR (vírgula decimal) para o CSV. */
function csvMoney(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function periodLabel(from?: string, to?: string): string {
  if (!from && !to) return "Período completo — todas as vendas registradas";
  if (from && to && from === to) return `Vendas de ${longDate(from)}`;
  if (from && to) return `De ${longDate(from)} até ${longDate(to)}`;
  if (from) return `De ${longDate(from)} em diante`;
  return `Até ${longDate(to as string)}`;
}

/* ------------------------------------------------------------------ */
/* Badges por canal de venda (tokens do design system)                 */
/* ------------------------------------------------------------------ */

const CHANNEL_BADGE: Record<SaleChannel, string> = {
  SITE: "bg-info/15 text-info",
  INSTAGRAM: "bg-primary text-primary-foreground",
  WHATSAPP: "bg-success/15 text-success",
  LOJA: "bg-secondary text-secondary-foreground",
};

/* ------------------------------------------------------------------ */
/* Blocos visuais                                                      */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate font-display text-3xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

/** Linha da tabela DRE clássica: rótulo à esquerda, valor mono à direita. */
function DreLine({
  label,
  value,
  subtotal = false,
  muted = false,
}: {
  label: string;
  value: string;
  subtotal?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-3 py-2",
        subtotal && "border-t border-border",
      )}
    >
      <p
        className={cn(
          "text-sm",
          subtotal ? "font-semibold" : muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "shrink-0 font-mono text-sm tabular-nums",
          subtotal && "text-base font-semibold",
          muted && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const sp = await searchParams;
  const rawFrom = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const rawTo = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  // Presets calculados no servidor (semana pt-BR começa na segunda).
  const now = new Date();
  const todayIso = toISODate(now);
  const monthStartIso = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStartIso = toISODate(weekStart);

  // Sem params → padrão "Este mês". Params vazios (?from=&to=) → "Tudo".
  const hasParams = rawFrom !== undefined || rawTo !== undefined;
  const from = hasParams ? rawFrom || undefined : monthStartIso;
  const to = hasParams ? rawTo || undefined : todayIso;

  const presets: { label: string; from?: string; to?: string }[] = [
    { label: "Hoje", from: todayIso, to: todayIso },
    { label: "Esta semana", from: weekStartIso, to: todayIso },
    { label: "Este mês", from: monthStartIso, to: todayIso },
    { label: "Tudo" },
  ];

  const report = await getDreReport({ from, to });
  const s = report.summary;
  const profitPositive = s.grossProfit >= 0;

  // Totais do DRE por peça (rodapé da tabela).
  const productTotals = report.perProduct.reduce(
    (acc, p) => ({
      units: acc.units + p.units,
      revenue: acc.revenue + p.revenue,
      cogs: acc.cogs + p.cogs,
      profit: acc.profit + p.profit,
    }),
    { units: 0, revenue: 0, cogs: 0, profit: 0 },
  );
  const totalMargin = productTotals.revenue > 0 ? (productTotals.profit / productTotals.revenue) * 100 : 0;

  // CSV do DRE por peça (linhas já formatadas para Excel pt-BR).
  const csvHeader = ["Peça", "SKU", "Un vendidas", "Receita (R$)", "CMV (R$)", "Lucro (R$)", "Margem (%)"];
  const csvRows = report.perProduct.map((p) => [
    p.name,
    p.sku,
    p.units,
    csvMoney(p.revenue),
    csvMoney(p.cogs),
    csvMoney(p.profit),
    p.margin.toFixed(1).replace(".", ","),
  ]);

  const channelRevenueMax = Math.max(1, ...report.perChannel.map((c) => c.revenue));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">DRE Gerencial</h1>
        <p className="mt-1 text-sm text-muted-foreground">{periodLabel(from, to)}.</p>
      </div>

      {/* Filtro de período (GET) */}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2">
          {presets.map((p) => {
            const active = (from ?? "") === (p.from ?? "") && (to ?? "") === (p.to ?? "");
            return (
              <Button
                key={p.label}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
              >
                <Link href={`/admin/dre?from=${p.from ?? ""}&to=${p.to ?? ""}`}>{p.label}</Link>
              </Button>
            );
          })}
          <form action="/admin/dre" method="GET" className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Input
              type="date"
              name="from"
              defaultValue={from ?? ""}
              aria-label="Data inicial"
              className="w-[150px] font-mono text-xs"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              name="to"
              defaultValue={to ?? ""}
              aria-label="Data final"
              className="w-[150px] font-mono text-xs"
            />
            <Button type="submit" size="sm" variant="outline">
              Aplicar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cards grandes */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Receita bruta"
          value={formatBRL(s.grossRevenue)}
          hint={`${s.ordersCount} venda${s.ordersCount === 1 ? "" : "s"} no período`}
          icon={Receipt}
        />
        <KpiCard
          label="CMV — custo das peças vendidas"
          value={formatBRL(s.cogs)}
          hint="Custo congelado no momento de cada venda"
          icon={Boxes}
        />
        {/* Lucro bruto em destaque */}
        <Card className={profitPositive ? "ring-success/50" : "ring-destructive/50"}>
          <CardContent className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Lucro bruto
              </p>
              <p
                className={cn(
                  "mt-2 truncate font-display text-3xl font-bold tracking-tight",
                  profitPositive ? "text-success" : "text-destructive",
                )}
              >
                {formatBRL(s.grossProfit)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Margem de {formatPct(s.grossMargin)}
              </p>
            </div>
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                profitPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              <PiggyBank className="size-5" />
            </span>
          </CardContent>
        </Card>
        <KpiCard
          label="Compras no período"
          value={formatBRL(s.purchasesValue)}
          hint={`${s.purchasesUnits} un compradas (informativo — não entra no DRE)`}
          icon={ShoppingCart}
        />
      </div>

      {/* Tabela DRE clássica */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase tracking-wide">Demonstrativo do resultado</CardTitle>
          <CardDescription>Resultado bruto das vendas no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto max-w-3xl">
            <DreLine label="Receita bruta de vendas" value={formatBRL(s.grossRevenue)} />
            <DreLine label="(−) Descontos concedidos" value={`− ${formatBRL(s.discounts)}`} />
            <DreLine label="(=) Receita líquida" value={formatBRL(s.netRevenue)} subtotal />
            <DreLine
              label="(−) CMV — custo congelado no momento de cada venda"
              value={`− ${formatBRL(s.cogs)}`}
            />
            <div
              className={cn(
                "mt-1 flex items-center justify-between gap-4 rounded-lg px-3 py-3",
                profitPositive ? "bg-success/10" : "bg-destructive/10",
              )}
            >
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                (=) Lucro bruto
              </p>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "font-display text-2xl font-bold tracking-tight",
                    profitPositive ? "text-success" : "text-destructive",
                  )}
                >
                  {formatBRL(s.grossProfit)}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  margem de {formatPct(s.grossMargin)}
                </p>
              </div>
            </div>

            {/* Linhas informativas (não entram no cálculo acima) */}
            <div className="mt-4 border-t border-border pt-2">
              <DreLine label="Frete cobrado do cliente" value={formatBRL(s.shipping)} muted />
              <DreLine
                label="Devoluções e cancelamentos no período"
                value={formatBRL(s.returnsValue)}
                muted
              />
              <DreLine
                label="Compras de estoque no período"
                value={`${formatBRL(s.purchasesValue)} · ${s.purchasesUnits} un`}
                muted
              />
            </div>

            <p className="mt-3 px-3 text-xs text-muted-foreground">
              CMV calculado pelo custo congelado em cada item vendido
              (order_items.unit_cost_at_sale).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DRE por peça */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase tracking-wide">DRE por peça</CardTitle>
          <CardDescription>
            Todas as peças vendidas no período, ordenadas pelo lucro gerado.
          </CardDescription>
          <CardAction>
            <CsvButton
              filename={`dre-por-peca_${from ?? "inicio"}_a_${to ?? "hoje"}.csv`}
              header={csvHeader}
              rows={csvRows}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          {report.perProduct.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma peça vendida no período selecionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Peça</TableHead>
                  <TableHead className="text-right">Un vendidas</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">CMV</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.perProduct.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell>
                      <p className="max-w-[280px] truncate text-sm font-medium" title={p.name}>
                        {p.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{p.units}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatBRL(p.revenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatBRL(p.cogs)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-sm font-semibold",
                        p.profit >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatBRL(p.profit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPct(p.margin)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="border-t-2 border-border hover:bg-transparent">
                  <TableCell className="font-display text-sm font-semibold uppercase tracking-wide">
                    Totais
                  </TableCell>
                  <TableCell className="text-right font-mono text-base font-semibold">
                    {productTotals.units}
                  </TableCell>
                  <TableCell className="text-right font-mono text-base font-semibold">
                    {formatBRL(productTotals.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-base font-semibold">
                    {formatBRL(productTotals.cogs)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-base font-semibold",
                      productTotals.profit >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatBRL(productTotals.profit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-base font-semibold">
                    {formatPct(totalMargin)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resultado por canal de venda */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase tracking-wide">Resultado por canal de venda</CardTitle>
          <CardDescription>Onde as vendas aconteceram no período, por receita.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.perChannel.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma venda no período selecionado.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {report.perChannel.map((c) => (
                <div key={c.channel} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className={CHANNEL_BADGE[c.channel] ?? ""}>
                      {SALE_CHANNEL_LABEL[c.channel] ?? c.channel}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.orders} pedido{c.orders === 1 ? "" : "s"}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-muted-foreground">Receita</dt>
                      <dd className="font-mono text-sm font-semibold">{formatBRL(c.revenue)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-muted-foreground">Lucro</dt>
                      <dd
                        className={cn(
                          "font-mono text-sm font-semibold",
                          c.profit >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {formatBRL(c.profit)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (c.revenue / channelRevenueMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
