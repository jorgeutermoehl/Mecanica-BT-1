import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  Info,
} from "lucide-react";
import {
  getCurrentStockReport,
  getMovementsReport,
  type MovementsReport,
} from "@/server/reports";
import { listProductOptions } from "@/server/inventory";
import {
  MOVEMENT_TYPE_LABEL,
  SALE_CHANNEL_LABEL,
  type MovementType,
  type SaleChannel,
} from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockDialogs } from "@/components/admin/stock-dialogs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estoque",
};

type ReportRow = MovementsReport["rows"][number];

/** Limite visual por card — o histórico completo fica em Relatórios. */
const VISIBLE_LIMIT = 50;

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Cores por canal de venda (tokens do design system). */
const CHANNEL_BADGE: Record<SaleChannel, string> = {
  SITE: "bg-info/15 text-info",
  INSTAGRAM: "bg-primary/15 text-primary",
  WHATSAPP: "bg-success/15 text-success",
  LOJA: "bg-secondary text-secondary-foreground",
};

function movementLabel(type: string): string {
  return MOVEMENT_TYPE_LABEL[type as MovementType] ?? type;
}

/* ------------------------------------------------------------------ */
/* KPI do mês                                                          */
/* ------------------------------------------------------------------ */

const KPI_TONE = {
  success: { icon: "bg-success/10 text-success", value: "text-success" },
  destructive: { icon: "bg-destructive/10 text-destructive", value: "text-destructive" },
  info: { icon: "bg-info/10 text-info", value: "" },
} as const;

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof KPI_TONE;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 truncate font-display text-3xl font-bold tracking-tight",
              KPI_TONE[tone].value,
            )}
          >
            {value}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{hint}</p>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            KPI_TONE[tone].icon,
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Card de movimentações (entradas OU saídas)                          */
/* ------------------------------------------------------------------ */

function MovementsCard({
  direction,
  rows,
  totalQty,
  totalValue,
}: {
  direction: "IN" | "OUT";
  rows: ReportRow[];
  totalQty: number;
  totalValue: number;
}) {
  const isIn = direction === "IN";
  const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine;
  const sign = isIn ? "+" : "−";
  const signColor = isIn ? "text-success" : "text-destructive";
  const visible = rows.slice(0, VISIBLE_LIMIT);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wide">
          <Icon className={cn("size-4", signColor)} aria-hidden />
          {isIn ? "Entradas de estoque" : "Saídas de estoque"}
        </CardTitle>
        <CardAction>
          <span className="font-mono text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "lançamento" : "lançamentos"}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Data/hora</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Custo un.</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Quem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                    {isIn
                      ? "Nenhuma entrada registrada ainda. Use “Registrar entrada” para dar entrada nas primeiras peças."
                      : "Nenhuma saída registrada ainda — vendas e baixas aparecem aqui."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {dateTimeFormat.format(new Date(m.createdAt))}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px]">
                        <p className="truncate text-sm font-medium" title={m.productName}>
                          {m.productName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{m.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1",
                          isIn
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-destructive/30 bg-destructive/10 text-destructive",
                        )}
                      >
                        {movementLabel(m.type)}
                      </Badge>
                      {m.orderNumber ? (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {m.orderNumber}
                          </span>
                          {m.channel ? (
                            <Badge
                              variant="secondary"
                              className={cn("px-1.5 py-0 text-[10px]", CHANNEL_BADGE[m.channel])}
                            >
                              {SALE_CHANNEL_LABEL[m.channel]}
                            </Badge>
                          ) : null}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-sm font-semibold",
                        signColor,
                      )}
                    >
                      {sign}
                      {m.quantity}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-xs text-muted-foreground">
                      {formatBRL(m.unitCost)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-sm font-medium">
                      {formatBRL(m.totalValue)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                      <span className="text-muted-foreground">{m.balanceBefore}</span>
                      <span aria-hidden className="px-1 text-muted-foreground/60">→</span>
                      <span className="font-semibold">{m.balanceAfter}</span>
                    </TableCell>
                    <TableCell
                      className="max-w-[90px] truncate text-xs text-muted-foreground"
                      title={m.userName}
                    >
                      {m.userName}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {rows.length > 0 ? (
              <TableFooter className="border-t-2">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="text-sm font-semibold uppercase tracking-wide">
                    Total {isIn ? "de entradas" : "de saídas"}
                  </TableCell>
                  <TableCell
                    className={cn("text-right font-mono text-base font-bold", signColor)}
                  >
                    {sign}
                    {totalQty} un
                  </TableCell>
                  <TableCell />
                  <TableCell className="whitespace-nowrap text-right font-mono text-base font-bold">
                    {formatBRL(totalValue)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
        {rows.length > VISIBLE_LIMIT ? (
          <p className="border-t border-border px-4 pt-3 font-mono text-xs text-muted-foreground">
            Exibindo os {VISIBLE_LIMIT} lançamentos mais recentes — veja tudo em{" "}
            <Link
              href="/admin/relatorios"
              className="text-primary underline-offset-2 hover:underline"
            >
              Relatórios
            </Link>
            .
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function EstoquePage() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const [monthReport, report, stockReport, products] = await Promise.all([
    getMovementsReport({ from: monthStart }),
    getMovementsReport(),
    getCurrentStockReport(),
    listProductOptions(),
  ]);

  const entries = report.rows.filter((r) => r.direction === "IN");
  const outs = report.rows.filter((r) => r.direction === "OUT");

  return (
    <div className="space-y-6">
      {/* Cabeçalho + barra de ações */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Estoque
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entradas, saídas, vendas manuais e ajustes — o livro-razão completo do seu
            inventário.
          </p>
        </div>
        <StockDialogs products={products} />
      </div>

      {/* KPIs do mês */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Resumo de {monthLabel}
          </h2>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link href="/admin/relatorios">
              Ver relatórios
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Entradas do mês"
            value={formatBRL(monthReport.totals.entriesValue)}
            hint={`${monthReport.totals.entriesQty} un em ${monthReport.totals.entriesCount} ${monthReport.totals.entriesCount === 1 ? "lançamento" : "lançamentos"}`}
            icon={ArrowDownToLine}
            tone="success"
          />
          <KpiCard
            label="Saídas do mês"
            value={formatBRL(monthReport.totals.outsValue)}
            hint={`${monthReport.totals.outsQty} un em ${monthReport.totals.outsCount} ${monthReport.totals.outsCount === 1 ? "lançamento" : "lançamentos"}`}
            icon={ArrowUpFromLine}
            tone="destructive"
          />
          <KpiCard
            label="Valor em estoque"
            value={formatBRL(stockReport.totals.totalCost)}
            hint={`${stockReport.totals.units} un em ${stockReport.totals.products} produtos (a custo)`}
            icon={Boxes}
            tone="info"
          />
        </div>
      </section>

      {/* Banner: livro-razão append-only */}
      <div className="flex items-center gap-2.5 rounded-lg border border-info/30 bg-info/5 px-4 py-2.5 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0 text-info" aria-hidden />
        <p>Movimentações são permanentes — correções geram lançamento de ajuste.</p>
      </div>

      {/* Entradas e saídas lado a lado */}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <MovementsCard
          direction="IN"
          rows={entries}
          totalQty={report.totals.entriesQty}
          totalValue={report.totals.entriesValue}
        />
        <MovementsCard
          direction="OUT"
          rows={outs}
          totalQty={report.totals.outsQty}
          totalValue={report.totals.outsValue}
        />
      </div>
    </div>
  );
}
