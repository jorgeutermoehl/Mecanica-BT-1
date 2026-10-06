import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Filter, Package, PackagePlus } from "lucide-react";
import { getReplenishmentReport } from "@/server/replenishment";
import type { AbcClass } from "@/server/reports/abc";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
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
import { CsvButton, type CsvCell } from "@/components/admin/relatorios/csv-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reposição" };

/** Badge por classe ABC — mesmo padrão da tela de Curva ABC (texto + cor). */
const CLASS_TONE: Record<AbcClass, StatusTone> = { A: "success", B: "info", C: "muted" };
const CLASS_LABEL: Record<AbcClass, string> = { A: "Classe A", B: "Classe B", C: "Classe C" };

type ClassFilter = "ab" | "a" | "todas";

const CLASS_FILTER_LABEL: Record<ClassFilter, string> = {
  ab: "Classes A e B",
  a: "Só classe A",
  todas: "Todas as classes",
};

const decimal = (n: number, digits: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const round2 = (n: number) => Math.round(n * 100) / 100;

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

export default async function ReplenishmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const report = await getReplenishmentReport();

  // Opções dos filtros derivadas das próprias linhas (sem consulta extra).
  const suppliers = [
    ...new Map(
      report.rows
        .filter((r) => r.supplierId && r.supplierName)
        .map((r) => [r.supplierId as string, r.supplierName as string]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const categories = [
    ...new Map(report.rows.map((r) => [r.categoryId, r.category])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]));

  const fornecedor = suppliers.some(([id]) => id === first(params.fornecedor))
    ? first(params.fornecedor)
    : "";
  const categoria = categories.some(([id]) => id === first(params.categoria))
    ? first(params.categoria)
    : "";
  const classesRaw = first(params.classes);
  // Default: classes A e B (é onde está o dinheiro — veto às telas divergentes).
  const classes: ClassFilter =
    classesRaw === "a" || classesRaw === "todas" ? classesRaw : "ab";
  const onlyBelow = first(params.abaixo) === "1";

  const rows = report.rows.filter((r) => {
    if (fornecedor && r.supplierId !== fornecedor) return false;
    if (categoria && r.categoryId !== categoria) return false;
    if (classes === "ab" && r.abcClass === "C") return false;
    if (classes === "a" && r.abcClass !== "A") return false;
    if (onlyBelow && !r.belowReorderPoint) return false;
    return true;
  });

  // Totais do que está NA TELA (mesma base do CSV).
  const totals = {
    products: rows.length,
    belowReorderPoint: rows.filter((r) => r.belowReorderPoint).length,
    suggestionUnits: rows.reduce((s, r) => s + r.suggestion, 0),
    suggestionCost: rows.reduce((s, r) => s + r.suggestionCost, 0),
  };

  const csvHeaders = [
    "Produto",
    "SKU",
    "Categoria",
    "Físico",
    "Reservado",
    "Disponível",
    "Em trânsito",
    "Demanda/dia (90d)",
    "Cobertura (dias)",
    "Classe ABC",
    "Lead time (dias)",
    "Ponto de reposição",
    "Abaixo do ponto",
    "Sugestão (un)",
    "Custo unit. (R$)",
    "Valor sugerido (R$)",
    "Fornecedor",
  ];
  const csvRows: CsvCell[][] = rows.map((r) => [
    r.name,
    r.sku,
    r.category,
    r.physical,
    r.reserved,
    r.available,
    r.inTransit,
    round2(r.avgDailySales),
    r.coverageDays !== null ? round2(r.coverageDays) : "",
    r.abcClass,
    r.leadTimeDays,
    r.reorderPoint,
    r.belowReorderPoint ? "Sim" : "Não",
    r.suggestion,
    round2(r.costPrice),
    round2(r.suggestionCost),
    r.supplierName ?? "",
  ]);

  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Reposição</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          O que comprar, de quem e quanto: sugestão por peça a partir da demanda dos últimos 90
          dias, cobertura alvo, lead time do fornecedor e o que já está em trânsito.
        </p>
      </div>

      {/* Filtros (GET — funcionam server-side) */}
      <Card size="sm">
        <CardContent>
          <form
            method="get"
            action="/admin/relatorios/reposicao"
            className="flex flex-wrap items-end gap-3"
          >
            <div className="grid w-full gap-1 sm:w-auto">
              <label
                htmlFor="filter-fornecedor"
                className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Fornecedor
              </label>
              <select
                id="filter-fornecedor"
                name="fornecedor"
                defaultValue={fornecedor}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 sm:w-48"
              >
                <option value="">Todos</option>
                {suppliers.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid w-full gap-1 sm:w-auto">
              <label
                htmlFor="filter-categoria"
                className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Categoria
              </label>
              <select
                id="filter-categoria"
                name="categoria"
                defaultValue={categoria}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 sm:w-44"
              >
                <option value="">Todas</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid w-full gap-1 sm:w-auto">
              <label
                htmlFor="filter-classes"
                className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Classe ABC
              </label>
              <select
                id="filter-classes"
                name="classes"
                defaultValue={classes}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 sm:w-44"
              >
                {(Object.keys(CLASS_FILTER_LABEL) as ClassFilter[]).map((key) => (
                  <option key={key} value={key}>
                    {CLASS_FILTER_LABEL[key]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex h-8 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="abaixo"
                value="1"
                defaultChecked={onlyBelow}
                className="size-4 accent-primary"
              />
              Apenas abaixo do ponto
            </label>
            <Button type="submit" size="sm" variant="secondary" className="gap-1.5">
              <Filter className="size-3.5" aria-hidden />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Estado do filtro + exportação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Exibindo{" "}
          <span className="font-medium text-foreground">{CLASS_FILTER_LABEL[classes]}</span>
          {onlyBelow ? (
            <>
              {" "}
              · <span className="font-medium text-foreground">apenas abaixo do ponto</span>
            </>
          ) : null}{" "}
          · <span className="font-mono font-medium text-foreground">{rows.length}</span>{" "}
          {rows.length === 1 ? "peça" : "peças"}
        </p>
        <CsvButton filename={`reposicao-${stamp}`} headers={csvHeaders} rows={csvRows} />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Físico</TableHead>
              <TableHead className="text-right">Reservado</TableHead>
              <TableHead className="text-right">Disponível</TableHead>
              <TableHead className="text-right">Demanda/dia (90d)</TableHead>
              <TableHead className="text-right">Cobertura</TableHead>
              <TableHead>Classe ABC</TableHead>
              <TableHead className="text-right">Lead time</TableHead>
              <TableHead className="text-right">Sugestão</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="sr-only">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                  Nenhuma peça encontrada com os filtros atuais. Inclua a classe C ou desmarque
                  “apenas abaixo do ponto”.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.productId} className={cn(r.belowReorderPoint && "bg-destructive/5")}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Thumb image={r.image} name={r.name} />
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-medium" title={r.name}>
                          {r.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {r.physical}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                    {r.reserved}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold tabular-nums",
                        r.belowReorderPoint && "text-destructive",
                      )}
                    >
                      {r.available}
                    </span>
                    {r.belowReorderPoint ? (
                      <p className="text-[11px] text-destructive">
                        abaixo do ponto ({r.reorderPoint})
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {decimal(r.avgDailySales, 2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {r.coverageDays !== null ? `${decimal(r.coverageDays, 1)} d` : "sem giro"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={CLASS_TONE[r.abcClass]}>
                      {CLASS_LABEL[r.abcClass]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {r.leadTimeDays} d
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-bold tabular-nums",
                        r.suggestion > 0 ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {r.suggestion} un
                    </span>
                    {r.suggestion > 0 ? (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {formatBRL(r.suggestionCost)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                    {r.supplierName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href="/admin/estoque?secao=entradas">
                        <PackagePlus className="size-3.5" aria-hidden />
                        Gerar entrada
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Nota da fórmula (transparência da sugestão) */}
      <p className="text-xs text-muted-foreground">
        Sugestão = demanda diária × (cobertura alvo + lead time) − disponível − em trânsito
        (entradas com financeiro em aberto), nunca negativa. Ponto de reposição = demanda diária ×
        lead time + estoque de segurança (sem histórico de venda, vale o estoque mínimo).
      </p>

      {/* Rodapé com totais do que está na tela */}
      <div className="grid grid-cols-1 gap-3 border-t-2 border-border pt-4 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Peças listadas
            </p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight">{totals.products}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Abaixo do ponto
            </p>
            <p
              className={cn(
                "mt-1 font-display text-2xl font-bold tracking-tight",
                totals.belowReorderPoint > 0 && "text-destructive",
              )}
            >
              {totals.belowReorderPoint}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Sugestão total
            </p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight">
              {totals.suggestionUnits} un
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="ring-primary/40">
          <CardContent>
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Valor estimado (custo)
            </p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight">
              {formatBRL(totals.suggestionCost)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
