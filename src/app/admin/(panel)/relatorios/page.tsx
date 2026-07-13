import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  Filter,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { getCurrentStockReport, getMovementsReport } from "@/server/reports";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  MOVEMENT_TYPE_LABEL,
  SALE_CHANNEL_LABEL,
  type MovementType,
  type SaleChannel,
} from "@/lib/validations";
import { Badge } from "@/components/ui/badge";
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
import { CsvButton, type CsvCell } from "@/components/admin/relatorios/csv-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Relatórios" };

type Direction = "ALL" | "IN" | "OUT";

const DIRECTION_LABEL: Record<Direction, string> = {
  ALL: "todos os movimentos",
  IN: "só entradas",
  OUT: "só saídas",
};

/** Cores por canal de venda (SITE=info, INSTAGRAM=primary, WHATSAPP=success, LOJA=secondary). */
const CHANNEL_BADGE: Record<SaleChannel, string> = {
  SITE: "bg-info/15 text-info",
  INSTAGRAM: "bg-primary/15 text-primary",
  WHATSAPP: "bg-success/15 text-success",
  LOJA: "bg-secondary text-secondary-foreground",
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const stampFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

/** yyyy-mm-dd no fuso local (o dono filtra pelo dia do relógio dele, não UTC). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** yyyy-mm-dd → dd/mm/yyyy (sem criar Date, evita surpresa de fuso). */
function brDate(iso: string): string {
  return iso.split("-").reverse().join("/");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function makeHref(params: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) q.set(key, value);
  const s = q.toString();
  return s ? `/admin/relatorios?${s}` : "/admin/relatorios";
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

function MovementBadge({ type, direction }: { type: MovementType; direction: "IN" | "OUT" }) {
  const isIn = direction === "IN";
  const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isIn
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <Icon aria-hidden />
      {MOVEMENT_TYPE_LABEL[type] ?? type}
    </Badge>
  );
}

function ChannelBadge({ channel }: { channel: SaleChannel }) {
  return (
    <Badge variant="secondary" className={CHANNEL_BADGE[channel]}>
      {SALE_CHANNEL_LABEL[channel] ?? channel}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const tab = first(params.tab) === "estoque" ? "estoque" : "lancamentos";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(first(params.from)) ? first(params.from) : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(first(params.to)) ? first(params.to) : "";
  const dirRaw = first(params.direction);
  const direction: Direction = dirRaw === "IN" || dirRaw === "OUT" ? dirRaw : "ALL";
  const generated = first(params.gerar) === "1";

  // Períodos rápidos calculados no servidor.
  const now = new Date();
  const today = toISODate(now);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // segunda-feira desta semana
  const presets = [
    { label: "Hoje", from: today, to: today },
    { label: "Esta semana", from: toISODate(monday), to: today },
    { label: "Este mês", from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today },
    { label: "Tudo", from: "", to: "" },
  ];

  const keepDirection = direction === "ALL" ? "" : direction;
  const keepGenerate = generated ? "1" : "";

  const movements =
    tab === "lancamentos" ? await getMovementsReport({ from, to, direction }) : null;
  const stock = tab === "estoque" && generated ? await getCurrentStockReport() : null;

  const periodLabel =
    !from && !to
      ? "todo o histórico"
      : from && to
        ? `${brDate(from)} até ${brDate(to)}`
        : from
          ? `a partir de ${brDate(from)}`
          : `até ${brDate(to)}`;

  // ---- Dados do CSV (linhas já filtradas, geradas no servidor) ----
  const movementsCsvHeaders = [
    "Data/hora",
    "Produto",
    "SKU",
    "Movimento",
    "Direção",
    "Qtd",
    "Custo unit. (R$)",
    "Valor movimentado (R$)",
    "Saldo antes",
    "Saldo depois",
    "Pedido",
    "Canal",
    "Motivo",
    "Usuário",
  ];
  const movementsCsvRows: CsvCell[][] = (movements?.rows ?? []).map((r) => [
    dateTimeFormat.format(new Date(r.createdAt)),
    r.productName,
    r.sku,
    MOVEMENT_TYPE_LABEL[r.type] ?? r.type,
    r.direction === "IN" ? "Entrada" : "Saída",
    r.direction === "IN" ? r.quantity : -r.quantity,
    round2(r.unitCost),
    round2(r.totalValue),
    r.balanceBefore,
    r.balanceAfter,
    r.orderNumber ?? "",
    r.channel ? (SALE_CHANNEL_LABEL[r.channel] ?? r.channel) : "",
    r.reason ?? "",
    r.userName,
  ]);

  const stockCsvHeaders = [
    "SKU",
    "Peça",
    "Categoria",
    "Marca",
    "Qtd",
    "Estoque mín.",
    "Custo unit. (R$)",
    "Valor em custo (R$)",
    "Preço venda (R$)",
    "Valor potencial (R$)",
  ];
  const stockCsvRows: CsvCell[][] = (stock?.rows ?? []).map((r) => [
    r.sku,
    r.name,
    r.category,
    r.brand,
    r.quantity,
    r.minStock,
    round2(r.unitCost),
    round2(r.totalCost),
    round2(r.unitSale),
    round2(r.totalSale),
  ]);

  const tabs = [
    { key: "lancamentos", label: "Lançamentos", icon: ClipboardList },
    { key: "estoque", label: "Estoque atual", icon: Boxes },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Relatórios de estoque
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lançamentos do período e posição atual do inventário — com totais e exportação para
          Excel (CSV).
        </p>
      </div>

      {/* Abas (links — funcionam server-side) */}
      <nav className="flex gap-1 border-b border-border" aria-label="Abas do relatório">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={makeHref({ tab: t.key, from, to, direction: keepDirection, gerar: keepGenerate })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-4" aria-hidden />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* ============================== ABA A: LANÇAMENTOS ============================== */}
      {tab === "lancamentos" && movements ? (
        <div className="space-y-4">
          {/* Barra de filtros */}
          <Card size="sm">
            <CardContent className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {presets.map((p) => {
                  const active = from === p.from && to === p.to;
                  return (
                    <Button key={p.label} asChild size="sm" variant={active ? "default" : "outline"}>
                      <Link
                        href={makeHref({
                          tab: "lancamentos",
                          from: p.from,
                          to: p.to,
                          direction: keepDirection,
                        })}
                      >
                        {p.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>

              <form method="get" action="/admin/relatorios" className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="tab" value="lancamentos" />
                <div className="grid gap-1">
                  <label
                    htmlFor="report-from"
                    className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    De
                  </label>
                  <Input
                    id="report-from"
                    type="date"
                    name="from"
                    defaultValue={from}
                    className="w-38 font-mono"
                  />
                </div>
                <div className="grid gap-1">
                  <label
                    htmlFor="report-to"
                    className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Até
                  </label>
                  <Input
                    id="report-to"
                    type="date"
                    name="to"
                    defaultValue={to}
                    className="w-38 font-mono"
                  />
                </div>
                <div className="grid gap-1">
                  <label
                    htmlFor="report-direction"
                    className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Movimento
                  </label>
                  <select
                    id="report-direction"
                    name="direction"
                    defaultValue={direction}
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="ALL">Todos os movimentos</option>
                    <option value="IN">Só entradas</option>
                    <option value="OUT">Só saídas</option>
                  </select>
                </div>
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
              Exibindo <span className="font-medium text-foreground">{periodLabel}</span> ·{" "}
              <span className="font-medium text-foreground">{DIRECTION_LABEL[direction]}</span> ·{" "}
              <span className="font-mono font-medium text-foreground">{movements.rows.length}</span>{" "}
              {movements.rows.length === 1 ? "lançamento" : "lançamentos"}
            </p>
            <CsvButton
              filename={`lancamentos-${from || "inicio"}_a_${to || today}`}
              headers={movementsCsvHeaders}
              rows={movementsCsvRows}
            />
          </div>

          {/* Tabela de lançamentos */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data/hora</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Movimento</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo unit.</TableHead>
                  <TableHead className="text-right">Valor movimentado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Nenhum lançamento no período selecionado. Ajuste os filtros acima ou
                      registre movimentações na tela de Estoque.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.rows.map((m) => {
                    const isIn = m.direction === "IN";
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {dateTimeFormat.format(new Date(m.createdAt))}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[220px]">
                            <p className="truncate text-sm font-medium" title={m.productName}>
                              {m.productName}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">{m.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <MovementBadge type={m.type} direction={m.direction} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono text-sm font-semibold",
                            isIn ? "text-success" : "text-destructive",
                          )}
                        >
                          {isIn ? "+" : "−"}
                          {m.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatBRL(m.unitCost)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono text-sm font-medium",
                            isIn ? "text-success" : "text-destructive",
                          )}
                        >
                          {formatBRL(m.totalValue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono text-sm">
                          <span className="text-muted-foreground">{m.balanceBefore}</span>
                          <span aria-hidden className="px-1 text-muted-foreground/60">
                            →
                          </span>
                          <span className="font-semibold">{m.balanceAfter}</span>
                        </TableCell>
                        <TableCell>
                          {m.orderNumber ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-mono text-xs font-medium">{m.orderNumber}</span>
                              {m.channel ? <ChannelBadge channel={m.channel} /> : null}
                            </div>
                          ) : (
                            <p
                              className="max-w-[180px] truncate text-xs text-muted-foreground"
                              title={m.reason ?? undefined}
                            >
                              {m.reason ?? "—"}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.userName}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Rodapé de totais */}
          {movements.rows.length > 0 ? (
            <div className="grid gap-4 border-t-2 border-border pt-4 sm:grid-cols-3">
              <Card>
                <CardContent>
                  <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <ArrowDownToLine className="size-3.5 text-success" aria-hidden />
                    Total entradas
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-success">
                    {formatBRL(movements.totals.entriesValue)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {movements.totals.entriesQty} un ·{" "}
                    {movements.totals.entriesCount}{" "}
                    {movements.totals.entriesCount === 1 ? "lançamento" : "lançamentos"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <ArrowUpFromLine className="size-3.5 text-destructive" aria-hidden />
                    Total saídas
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-destructive">
                    {formatBRL(movements.totals.outsValue)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {movements.totals.outsQty} un ·{" "}
                    {movements.totals.outsCount}{" "}
                    {movements.totals.outsCount === 1 ? "lançamento" : "lançamentos"}
                  </p>
                </CardContent>
              </Card>
              <Card className="ring-primary/40">
                <CardContent>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Resultado do período
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-display text-3xl font-bold tracking-tight",
                      movements.totals.netValue >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {movements.totals.netValue > 0 ? "+" : ""}
                    {formatBRL(movements.totals.netValue)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {movements.totals.netQty > 0 ? "+" : ""}
                    {movements.totals.netQty} un no período (entradas − saídas, a custo)
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ============================== ABA B: ESTOQUE ATUAL ============================== */}
      {tab === "estoque" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-muted-foreground">
              Fotografia do estoque neste exato momento: quantidade, valor imobilizado a custo e
              potencial de venda de cada peça cadastrada.
            </p>
            <div className="flex items-center gap-2">
              {stock ? (
                <CsvButton
                  filename={`estoque-atual-${toISODate(new Date(stock.generatedAt))}`}
                  headers={stockCsvHeaders}
                  rows={stockCsvRows}
                />
              ) : null}
              <Button asChild size="sm" className="gap-1.5">
                <Link href={makeHref({ tab: "estoque", gerar: "1" })}>
                  <RefreshCw className="size-3.5" aria-hidden />
                  {stock ? "Gerar novamente" : "Gerar relatório"}
                </Link>
              </Button>
            </div>
          </div>

          {!stock ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Boxes className="size-8 text-muted-foreground/60" aria-hidden />
                <p className="text-sm font-medium">Relatório ainda não gerado</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Clique em “Gerar relatório” para tirar a fotografia do estoque com os saldos e
                  valores deste exato momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="font-mono text-xs text-muted-foreground">
                Gerado em {stampFormat.format(new Date(stock.generatedAt))}
              </p>

              {/* Tabela de posição de estoque */}
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>SKU</TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Estoque mín.</TableHead>
                      <TableHead className="text-right">Custo unit.</TableHead>
                      <TableHead className="text-right">Valor em custo</TableHead>
                      <TableHead className="text-right">Preço venda</TableHead>
                      <TableHead className="text-right">Valor potencial venda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stock.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                          Nenhuma peça cadastrada ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {stock.rows.map((r) => {
                          const low = r.quantity <= r.minStock;
                          return (
                            <TableRow key={r.id} className={cn(low && "bg-warning/5")}>
                              <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                              <TableCell>
                                <p className="max-w-[240px] truncate text-sm font-medium" title={r.name}>
                                  {r.name}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {r.category}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{r.brand}</TableCell>
                              <TableCell
                                className={cn(
                                  "text-right font-mono text-sm font-semibold",
                                  low && "text-warning",
                                )}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {low ? <TriangleAlert className="size-3.5" aria-hidden /> : null}
                                  {r.quantity}
                                </span>
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right font-mono text-sm",
                                  low ? "text-warning" : "text-muted-foreground",
                                )}
                              >
                                {r.minStock}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatBRL(r.unitCost)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-medium">
                                {formatBRL(r.totalCost)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatBRL(r.unitSale)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-medium">
                                {formatBRL(r.totalSale)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Linha de totais */}
                        <TableRow className="border-t-2 border-border bg-muted/40 font-semibold hover:bg-muted/40">
                          <TableCell colSpan={4} className="text-xs uppercase tracking-wider">
                            Totais — {stock.totals.products}{" "}
                            {stock.totals.products === 1 ? "peça" : "peças"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {stock.totals.units}
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right font-mono text-sm">
                            {formatBRL(stock.totals.totalCost)}
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right font-mono text-sm">
                            {formatBRL(stock.totals.totalSale)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Rodapé de totais em destaque */}
              <div className="grid grid-cols-2 gap-4 border-t-2 border-border pt-4 xl:grid-cols-5">
                <Card size="sm">
                  <CardContent>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Peças
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                      {stock.totals.products}
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Unidades
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                      {stock.totals.units}
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm" className="ring-primary/40">
                  <CardContent>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Valor em estoque (custo)
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                      {formatBRL(stock.totals.totalCost)}
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Potencial de venda
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                      {formatBRL(stock.totals.totalSale)}
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Lucro potencial
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-success">
                      {formatBRL(stock.totals.potentialProfit)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
