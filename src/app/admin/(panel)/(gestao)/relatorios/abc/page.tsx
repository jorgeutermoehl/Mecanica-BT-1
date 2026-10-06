import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";
import { getAbcReport, ABC_PERIODS, type AbcClass, type AbcPeriod } from "@/server/reports/abc";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SALE_CHANNELS, SALE_CHANNEL_LABEL, type SaleChannel } from "@/lib/validations";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Curva ABC" };

/** Badge por classe — sempre TEXTO + cor (nunca cor sozinha). */
const CLASS_TONE: Record<AbcClass, StatusTone> = { A: "success", B: "info", C: "muted" };
const CLASS_LABEL: Record<AbcClass, string> = { A: "Classe A", B: "Classe B", C: "Classe C" };

function formatPercent(n: number): string {
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function makeHref(params: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) q.set(key, value);
  const s = q.toString();
  return s ? `/admin/relatorios/abc?${s}` : "/admin/relatorios/abc";
}

function Thumb({ image, name }: { image: string | null; name: string }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
      <Package className="size-4" aria-hidden />
    </span>
  );
}

export default async function AbcReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const periodDays: AbcPeriod = ((): AbcPeriod => {
    const n = Number(first(params.periodo));
    return (ABC_PERIODS as readonly number[]).includes(n) ? (n as AbcPeriod) : 90;
  })();
  const canalRaw = first(params.canal);
  const channel = (SALE_CHANNELS as readonly string[]).includes(canalRaw)
    ? (canalRaw as SaleChannel)
    : undefined;

  const report = await getAbcReport(periodDays, channel);

  const summaryCards = [
    {
      label: `Receita (${periodDays} dias)`,
      value: formatBRL(report.totals.netRevenue),
      detail: `${report.totals.qtySold} un vendidas · ${report.totals.products} ${report.totals.products === 1 ? "produto" : "produtos"}`,
      highlight: true,
    },
    {
      label: "Classe A (até 80% da receita)",
      value: String(report.totals.countA),
      detail: formatBRL(report.totals.revenueA),
    },
    {
      label: "Classe B (80–95%)",
      value: String(report.totals.countB),
      detail: formatBRL(report.totals.revenueB),
    },
    {
      label: "Classe C (restante)",
      value: String(report.totals.countC),
      detail: formatBRL(report.totals.revenueC),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/relatorios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Relatórios
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Curva ABC</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Onde está o dinheiro do estoque: produtos ordenados pela receita do período, com
          participação acumulada. Classe A concentra até 80% da receita, B até 95%, C o restante.
        </p>
      </div>

      {/* Filtros: período e canal (links — funcionam server-side) */}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Período
            </span>
            {ABC_PERIODS.map((p) => (
              <Button
                key={p}
                asChild
                size="sm"
                variant={periodDays === p ? "default" : "outline"}
              >
                <Link href={makeHref({ periodo: String(p), canal: canalRaw })}>{p} dias</Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Canal
            </span>
            <Button asChild size="sm" variant={!channel ? "default" : "outline"}>
              <Link href={makeHref({ periodo: String(periodDays) })}>Todos</Link>
            </Button>
            {SALE_CHANNELS.map((c) => (
              <Button key={c} asChild size="sm" variant={channel === c ? "default" : "outline"}>
                <Link href={makeHref({ periodo: String(periodDays), canal: c })}>
                  {SALE_CHANNEL_LABEL[c]}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards-resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label} size="sm" className={cn(c.highlight && "ring-primary/40")}>
            <CardContent>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">{c.value}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{c.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd vendida</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Participação</TableHead>
              <TableHead className="text-right">% acumulada</TableHead>
              <TableHead>Classe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhuma venda registrada no período{channel ? " para este canal" : ""}. Ajuste os
                  filtros acima.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {report.rows.map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Thumb image={r.image} name={r.name} />
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate text-sm font-medium" title={r.name}>
                            {r.name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {r.qtySold}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                      {formatBRL(r.netRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                      {formatPercent(r.sharePercent)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {formatPercent(r.cumulativePercent)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={CLASS_TONE[r.class]}>{CLASS_LABEL[r.class]}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Linha de total */}
                <TableRow className="border-t-2 border-border bg-muted/40 font-semibold hover:bg-muted/40">
                  <TableCell className="text-xs uppercase tracking-wider">
                    Total — {report.totals.products}{" "}
                    {report.totals.products === 1 ? "produto" : "produtos"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {report.totals.qtySold}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatBRL(report.totals.netRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">100%</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">100%</TableCell>
                  <TableCell />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
