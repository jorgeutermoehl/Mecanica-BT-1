import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  PackageOpen,
  PiggyBank,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Wallet,
} from "lucide-react";
import { getDashboardData } from "@/server/dashboard";
import { formatBRL } from "@/lib/format";
import { MOVEMENT_TYPE_LABEL, ORDER_STATUS_LABEL, type MovementType, type OrderStatus } from "@/lib/validations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/** Cores por status do pedido (tokens do design system). */
const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "bg-warning/15 text-warning",
  PAID: "bg-success/15 text-success",
  SEPARATING: "bg-info/15 text-info",
  SHIPPED: "bg-info/15 text-info",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-muted text-muted-foreground",
  RETURNED: "bg-muted text-muted-foreground",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

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

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const maxSold = Math.max(1, ...data.topSellers.map((t) => t.quantity));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral da operação em {new Date().toLocaleDateString("pt-BR")}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Faturamento hoje"
          value={formatBRL(data.revenueToday)}
          hint={`${data.ordersToday} pedido${data.ordersToday === 1 ? "" : "s"} confirmado${data.ordersToday === 1 ? "" : "s"}`}
          icon={Wallet}
        />
        <KpiCard
          label="Faturamento do mês"
          value={formatBRL(data.revenueMonth)}
          hint={`${data.ordersMonth} pedido${data.ordersMonth === 1 ? "" : "s"} no mês`}
          icon={TrendingUp}
        />
        <KpiCard
          label="Pedidos pendentes"
          value={String(data.pendingCount)}
          hint="Aguardando pagamento ou separação"
          icon={PackageOpen}
        />
        <KpiCard
          label="Lucro estimado do mês"
          value={formatBRL(data.profitMonth)}
          hint={`Margem bruta de ${data.grossMargin.toFixed(1)}%`}
          icon={PiggyBank}
        />
      </div>

      {/* Alerta de estoque baixo */}
      {data.lowStock.length > 0 ? (
        <Card className="ring-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase tracking-wide">
              <TriangleAlert className="size-4 text-warning" />
              Estoque baixo — {data.lowStock.length}{" "}
              {data.lowStock.length === 1 ? "produto" : "produtos"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y divide-border">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-medium text-warning">
                    {p.stock} un (mín. {p.minStock})
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/admin/estoque">
                Ir para o estoque
                <ArrowRight className="size-4" />
              </Link>
            </Button>
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
            <CardTitle className="uppercase tracking-wide">Últimos pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum pedido registrado ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium">{o.number}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {formatDateTime(o.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">{o.customerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={ORDER_STATUS_BADGE[o.status as OrderStatus] ?? "bg-muted text-muted-foreground"}
                        >
                          {ORDER_STATUS_LABEL[o.status as OrderStatus] ?? o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">
                        {formatBRL(o.total)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href={`/admin/pedidos/${o.id}`}>
                            Ver
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas movimentações */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wide">Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMovements.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma movimentação de estoque ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-[150px]">
                        <span className="block truncate text-sm">{m.productName}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">{m.sku}</span>
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
                        className={`text-right font-mono text-xs font-medium ${
                          m.direction === "IN" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {m.direction === "IN" ? "+" : "−"}
                        {m.quantity}
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[100px] truncate text-xs">{m.userName}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mais vendidos do mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 uppercase tracking-wide">
            <Trophy className="size-4 text-primary" />
            Mais vendidos do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topSellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma venda registrada neste mês.
            </p>
          ) : (
            <ol className="space-y-4">
              {data.topSellers.map((t, i) => (
                <li key={t.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-4">
                    <p className="min-w-0 truncate text-sm">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {t.name}
                    </p>
                    <span className="shrink-0 font-mono text-xs font-medium">
                      {t.quantity} un
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (t.quantity / maxSold) * 100)}%` }}
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
