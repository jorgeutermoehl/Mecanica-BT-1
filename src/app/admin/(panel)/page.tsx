import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  TriangleAlert,
} from "lucide-react";
import { getDashboardData } from "@/server/dashboard";
import { formatBRL } from "@/lib/format";
import { MOVEMENT_TYPE_LABEL, type MovementType, type OrderStatus } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/pedidos/order-status-badge";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

/** Padrão Stripe: cabeçalho de tabela discreto e respiro nas bordas do card. */
const TH_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TABLE_CLASS =
  "[&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:last-child]:pr-4";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const maxSold = Math.max(1, ...data.topSellers.map((t) => t.quantity));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-xl font-bold uppercase tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral da operação em {new Date().toLocaleDateString("pt-BR")}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento hoje"
          value={formatBRL(data.revenueToday)}
          hint={`${data.ordersToday} pedido${data.ordersToday === 1 ? "" : "s"} confirmado${data.ordersToday === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Faturamento do mês"
          value={formatBRL(data.revenueMonth)}
          hint={`${data.ordersMonth} pedido${data.ordersMonth === 1 ? "" : "s"} no mês`}
        />
        <KpiCard
          label="Pedidos pendentes"
          value={String(data.pendingCount)}
          hint="Aguardando pagamento ou separação"
        />
        <KpiCard
          label="Lucro estimado do mês"
          value={formatBRL(data.profitMonth)}
          hint={`Margem bruta de ${data.grossMargin.toFixed(1)}%`}
        />
      </div>

      {/* Alerta de estoque baixo */}
      {data.lowStock.length > 0 ? (
        <Card size="sm" className="ring-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide">
              <TriangleAlert className="size-4 shrink-0 text-warning" />
              Estoque baixo
              <span className="rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-warning">
                {data.lowStock.length}{" "}
                {data.lowStock.length === 1 ? "produto" : "produtos"}
              </span>
            </CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Link href="/admin/estoque">
                  Ir para o estoque
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                  </div>
                  <p className="shrink-0 font-mono text-xs tabular-nums">
                    <span className="font-medium text-warning">{p.stock} un</span>
                    <span className="text-muted-foreground"> / mín. {p.minStock}</span>
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardContent className="text-sm text-muted-foreground">
            Nenhum alerta de estoque — todos os produtos acima do mínimo.
          </CardContent>
        </Card>
      )}

      {/* Pedidos e movimentações */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Últimos pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide">Últimos pedidos</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Link href="/admin/pedidos">
                  Todos
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentOrders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum pedido registrado ainda.
              </p>
            ) : (
              <Table className={TABLE_CLASS}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={TH_CLASS}>Pedido</TableHead>
                    <TableHead className={TH_CLASS}>Cliente</TableHead>
                    <TableHead className={TH_CLASS}>Status</TableHead>
                    <TableHead className={cn(TH_CLASS, "text-right")}>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="font-mono text-xs font-medium transition-colors hover:text-primary"
                        >
                          {o.number}
                        </Link>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {formatDateTime(o.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">{o.customerName}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status as OrderStatus} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium tabular-nums">
                        {formatBRL(o.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Últimas movimentações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide">
              Últimas movimentações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentMovements.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma movimentação de estoque ainda.
              </p>
            ) : (
              <Table className={TABLE_CLASS}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={TH_CLASS}>Produto</TableHead>
                    <TableHead className={TH_CLASS}>Tipo</TableHead>
                    <TableHead className={cn(TH_CLASS, "text-right")}>Qtd</TableHead>
                    <TableHead className={TH_CLASS}>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-[150px]">
                        <span className="block truncate text-sm">{m.productName}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {m.sku}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          {m.direction === "IN" ? (
                            <ArrowDownToLine className="size-3.5 text-success" />
                          ) : (
                            <ArrowUpFromLine className="size-3.5 text-destructive" />
                          )}
                          {MOVEMENT_TYPE_LABEL[m.type as MovementType] ?? m.type}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs font-medium tabular-nums",
                          m.direction === "IN" ? "text-success" : "text-destructive",
                        )}
                      >
                        {m.direction === "IN" ? "+" : "−"}
                        {m.quantity}
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[100px] truncate text-xs">{m.userName}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mais vendidos do mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide">Mais vendidos do mês</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topSellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma venda registrada neste mês.
            </p>
          ) : (
            <ol className="space-y-3">
              {data.topSellers.map((t, i) => (
                <li key={t.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-4">
                    <p className="min-w-0 truncate text-sm">
                      <span className="mr-2 font-mono text-xs tabular-nums text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {t.name}
                    </p>
                    <span className="shrink-0 font-mono text-xs font-medium tabular-nums">
                      {t.quantity} un
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(3, (t.quantity / maxSold) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
