import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Info, TriangleAlert } from "lucide-react";
import { getCoverageReport, type CoverageBand } from "@/server/reports/coverage";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
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

export const metadata: Metadata = { title: "Giro e cobertura" };

/** Faixas de cobertura — sempre TEXTO + cor via tokens (nunca cor sozinha). */
const BAND_TONE: Record<CoverageBand, StatusTone> = {
  CRITICO: "destructive",
  SAUDAVEL: "success",
  ATENCAO: "warning",
  ENCALHADO: "muted",
  SEM_GIRO: "secondary",
};
const BAND_LABEL: Record<CoverageBand, string> = {
  CRITICO: "Crítico",
  SAUDAVEL: "Saudável",
  ATENCAO: "Atenção",
  ENCALHADO: "Encalhado",
  SEM_GIRO: "Sem giro",
};

const decimal = (n: number, digits: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default async function CoverageReportPage() {
  const report = await getCoverageReport();

  const summaryCards: { label: string; value: number; tone: StatusTone }[] = [
    { label: "Crítico (menos de 15d)", value: report.totals.critical, tone: "destructive" },
    { label: "Saudável (15–45d)", value: report.totals.healthy, tone: "success" },
    { label: "Atenção (45–90d)", value: report.totals.attention, tone: "warning" },
    { label: "Encalhado (mais de 90d)", value: report.totals.stale, tone: "muted" },
    { label: "Sem giro", value: report.totals.noTurnover, tone: "secondary" },
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
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Giro e cobertura
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Quantos dias o estoque disponível de cada peça dura no ritmo de venda dos últimos 90
          dias (30 dias para produtos novos) — e onde a loja está perdendo caixa com encalhe.
        </p>
      </div>

      {/* Cards-resumo por faixa */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        {summaryCards.map((c) => (
          <Card key={c.label} size="sm">
            <CardContent>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">{c.value}</p>
              <div className="mt-1">
                <StatusBadge tone={c.tone}>{c.value === 1 ? "1 peça" : `${c.value} peças`}</StatusBadge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nota metodológica — VISÍVEL na tela (transparência da fórmula) */}
      <Card size="sm">
        <CardContent className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Estoque médio aproximado por 2 pontos do razão — estimativa, sem uso contábil.
            </span>{" "}
            O giro anualizado usa estoque médio ≈ (saldo atual + saldo após o movimento mais
            antigo dos últimos 90 dias) ÷ 2, projetando a demanda diária para 365 dias.
          </p>
        </CardContent>
      </Card>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Disponível</TableHead>
              <TableHead className="text-right">Demanda/dia</TableHead>
              <TableHead className="text-right">Cobertura</TableHead>
              <TableHead>Faixa</TableHead>
              <TableHead className="text-right">Giro anualizado</TableHead>
              <TableHead className="text-right">Margem média</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhum produto ativo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              report.rows.map((r) => (
                <TableRow key={r.productId} className={cn(r.band === "CRITICO" && "bg-destructive/5")}>
                  <TableCell>
                    <div className="max-w-[260px]">
                      <p className="truncate text-sm font-medium" title={r.name}>
                        {r.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                    {r.available}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {decimal(r.avgDailySales, 2)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({r.demandWindowDays}d)
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {r.coverageDays !== null ? `${decimal(r.coverageDays, 1)} d` : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={BAND_TONE[r.band]}>{BAND_LABEL[r.band]}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {r.annualTurnover !== null ? `${decimal(r.annualTurnover, 2)}×` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.marginPercent === null ? (
                      <span className="font-mono text-sm text-muted-foreground">—</span>
                    ) : (
                      <div>
                        <span
                          className={cn(
                            "font-mono text-sm font-medium tabular-nums",
                            r.belowMinMargin && "text-destructive",
                          )}
                        >
                          {r.belowMinMargin ? (
                            <TriangleAlert className="mr-1 inline size-3.5" aria-hidden />
                          ) : null}
                          {decimal(r.marginPercent, 1)}%
                        </span>
                        {r.belowMinMargin && r.minMarginPercent !== null ? (
                          <p className="text-[11px] text-destructive">
                            abaixo do mínimo ({decimal(r.minMarginPercent, 1)}%)
                          </p>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé com contexto */}
      {report.totals.belowMinMargin > 0 ? (
        <p className="text-sm text-destructive">
          <TriangleAlert className="mr-1 inline size-4" aria-hidden />
          {report.totals.belowMinMargin === 1
            ? "1 peça vendeu com margem média abaixo do mínimo cadastrado no período."
            : `${report.totals.belowMinMargin} peças venderam com margem média abaixo do mínimo cadastrado no período.`}
        </p>
      ) : null}
    </div>
  );
}
