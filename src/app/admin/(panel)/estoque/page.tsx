import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  FileBarChart,
  Info,
  Warehouse,
} from "lucide-react";
import { getMovementsReport, getCurrentStockReport } from "@/server/reports";
import { listMovements, listProductOptions, type MovementRow } from "@/server/inventory";
import {
  MOVEMENT_TYPE_LABEL,
  type MovementType,
} from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdjustDialog,
  EntryDialog,
  OutDialog,
  SaleDialog,
} from "@/components/admin/stock-dialogs";
import { MovementActions } from "@/components/admin/estoque/movement-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Estoque" };

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function movementLabel(type: string): string {
  return MOVEMENT_TYPE_LABEL[type as MovementType] ?? type;
}

/* ------------------------------------------------------------------ */
/* Card grande de seção (Entradas | Saídas) — seletor da listagem      */
/* ------------------------------------------------------------------ */

function SectionCard({
  section,
  selected,
  monthQty,
  monthValue,
  children,
}: {
  section: "entradas" | "saidas";
  selected: boolean;
  monthQty: number;
  monthValue: number;
  children: React.ReactNode; // botões de registrar
}) {
  const isIn = section === "entradas";
  const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <Card
      className={cn(
        "relative transition-all",
        selected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:border-primary/40 hover:shadow-md",
      )}
    >
      {/* Área clicável do card (atrás dos botões) */}
      <Link
        href={`/admin/estoque?secao=${section}`}
        aria-label={`Ver lançamentos de ${isIn ? "entrada" : "saída"}`}
        className="absolute inset-0 rounded-xl"
      />
      <CardContent className="relative flex flex-col gap-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl",
                isIn ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
              )}
            >
              <Icon className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                {isIn ? "Entradas" : "Saídas"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isIn ? "Compras e reposições" : "Vendas e baixas"}
              </p>
            </div>
          </div>
          {selected ? (
            <Badge className="pointer-events-none font-mono text-[10px] uppercase">
              Selecionado
            </Badge>
          ) : null}
        </div>

        <p className="font-mono text-sm text-muted-foreground">
          Este mês:{" "}
          <span className={cn("font-semibold", isIn ? "text-success" : "text-destructive")}>
            {isIn ? "+" : "−"}
            {monthQty} un
          </span>{" "}
          · {formatBRL(monthValue)}
        </p>

        {/* Botões acima da área clicável */}
        <div className="relative z-10 grid grid-cols-1 gap-2 sm:grid-cols-2 [&_button]:w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Listagem compacta (estilo ERP denso) da seção selecionada           */
/* ------------------------------------------------------------------ */

function CompactListing({ section, rows }: { section: "entradas" | "saidas"; rows: MovementRow[] }) {
  const isIn = section === "entradas";
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalValue = rows.reduce((s, r) => s + r.unitCost * r.quantity, 0);
  const sign = isIn ? "+" : "−";
  const signColor = isIn ? "text-success" : "text-destructive";

  return (
    <Card>
      <CardContent className="px-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 pb-3 sm:px-6">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide">
            Lançamentos de {isIn ? "entrada" : "saída"}
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 text-xs">Data</TableHead>
                <TableHead className="h-8 text-xs">Produto</TableHead>
                <TableHead className="h-8 text-xs">Tipo</TableHead>
                <TableHead className="h-8 text-right text-xs">Qtd.</TableHead>
                <TableHead className="h-8 text-right text-xs">Custo un.</TableHead>
                <TableHead className="h-8 text-right text-xs">Valor</TableHead>
                <TableHead className="h-8 text-right text-xs">Saldo</TableHead>
                <TableHead className="h-8 text-xs">Origem</TableHead>
                <TableHead className="h-8 text-xs">Usuário</TableHead>
                <TableHead className="h-8 text-right text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">
                    {isIn
                      ? "Nenhuma entrada ainda — registre a primeira compra de peças."
                      : "Nenhuma saída ainda — vendas e baixas aparecem aqui."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((m, i) => (
                  <TableRow
                    key={m.id}
                    className={cn(
                      i % 2 === 1 && "bg-muted/20",
                      m.isReversed && "opacity-60",
                    )}
                  >
                    <TableCell className="whitespace-nowrap py-1.5 font-mono text-xs text-muted-foreground">
                      {dateTimeFormat.format(new Date(m.createdAt))}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <p className="max-w-[200px] truncate text-xs font-medium sm:text-sm" title={m.productName}>
                        {m.productName}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">{m.sku}</p>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            isIn
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-destructive/30 bg-destructive/10 text-destructive",
                          )}
                        >
                          {movementLabel(m.type)}
                        </Badge>
                        {m.isReversal ? (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            Estorno
                          </Badge>
                        ) : null}
                        {m.isReversed ? (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
                            Estornada
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className={cn("whitespace-nowrap py-1.5 text-right font-mono text-xs font-semibold", signColor)}>
                      {sign}
                      {m.quantity}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-right font-mono text-xs text-muted-foreground">
                      {formatBRL(m.unitCost)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-right font-mono text-xs font-medium">
                      {formatBRL(m.unitCost * m.quantity)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-right font-mono text-xs">
                      <span className="text-muted-foreground">{m.balanceBefore}</span>
                      <span aria-hidden className="px-0.5 text-muted-foreground/60">→</span>
                      <span className="font-semibold">{m.balanceAfter}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 font-mono text-[10px] text-muted-foreground">
                      {m.orderNumber ?? m.invoiceNumber ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[90px] truncate py-1.5 text-xs text-muted-foreground" title={m.userName}>
                      {m.userName}
                    </TableCell>
                    <TableCell className="py-1 text-right">
                      <MovementActions
                        movement={{
                          id: m.id,
                          type: m.type,
                          quantity: m.quantity,
                          unitCost: m.unitCost,
                          reason: m.reason,
                          sku: m.sku,
                          canModify: m.canModify,
                          isReversal: m.isReversal,
                          isReversed: m.isReversed,
                          orderNumber: m.orderNumber,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {rows.length > 0 ? (
              <TableFooter className="border-t-2">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="text-xs font-semibold uppercase tracking-wide">
                    Total de {isIn ? "entradas" : "saídas"}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm font-bold", signColor)}>
                    {sign}
                    {totalQty} un
                  </TableCell>
                  <TableCell />
                  <TableCell className="whitespace-nowrap text-right font-mono text-sm font-bold">
                    {formatBRL(totalValue)}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string }>;
}) {
  const { secao } = await searchParams;
  const section: "entradas" | "saidas" = secao === "saidas" ? "saidas" : "entradas";

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [monthReport, movements, stockReport, products] = await Promise.all([
    getMovementsReport({ from: monthStart }),
    listMovements({ take: 300 }),
    getCurrentStockReport(),
    listProductOptions(),
  ]);

  const rows = movements.filter((m) => (section === "entradas" ? m.direction === "IN" : m.direction === "OUT"));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione uma seção para ver os lançamentos — {formatBRL(stockReport.totals.totalCost)} em
            estoque ({stockReport.totals.units} un).
          </p>
        </div>
        <div className="[&_button]:w-full sm:[&_button]:w-auto">
          <AdjustDialog products={products} />
        </div>
      </div>

      {/* Seletor: cards grandes Entradas | Saídas + Relatórios */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <SectionCard
          section="entradas"
          selected={section === "entradas"}
          monthQty={monthReport.totals.entriesQty}
          monthValue={monthReport.totals.entriesValue}
        >
          <EntryDialog products={products} />
        </SectionCard>
        <SectionCard
          section="saidas"
          selected={section === "saidas"}
          monthQty={monthReport.totals.outsQty}
          monthValue={monthReport.totals.outsValue}
        >
          <OutDialog products={products} />
          <SaleDialog products={products} />
        </SectionCard>
      </div>

      {/* Relatórios (ainda em Estoque) */}
      <Link
        href="/admin/relatorios"
        className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-all hover:border-primary/50 hover:shadow-md sm:px-6"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileBarChart className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-sm font-bold uppercase tracking-wide">
              Relatórios
            </span>
            <span className="block text-xs text-muted-foreground sm:text-sm">
              Lançamentos por período, filtros e posição atual do estoque
            </span>
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Link>

      {/* Aviso append-only */}
      <div className="flex items-center gap-2.5 rounded-lg border border-info/30 bg-info/5 px-4 py-2.5 text-xs text-muted-foreground sm:text-sm">
        <Info className="size-4 shrink-0 text-info" aria-hidden />
        <p>
          Movimentações são permanentes: corrigir estorna e relança; excluir gera estorno. Nada é
          apagado do histórico.
        </p>
      </div>

      {/* Listagem compacta da seção selecionada */}
      <CompactListing section={section} rows={rows} />

      {/* Valor em estoque (referência) */}
      <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Warehouse className="size-3.5" aria-hidden />
        Posição atual: {stockReport.totals.units} un · {formatBRL(stockReport.totals.totalCost)} a custo ·
        potencial de venda {formatBRL(stockReport.totals.totalSale)}
      </p>
    </div>
  );
}
