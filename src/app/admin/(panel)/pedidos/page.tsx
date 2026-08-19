import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { listOrders } from "@/server/orders";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
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
import { OrderStatusBadge } from "@/components/admin/pedidos/order-status-badge";
import { ChannelBadge } from "@/components/admin/channel-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedidos",
};

/** Padrão Stripe: cabeçalho de tabela discreto e respiro nas bordas do card. */
const TH_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const TABLE_CLASS =
  "[&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:last-child]:pr-4";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OrdersPage() {
  const orders = await listOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-tight">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as vendas da loja e gerencie o status de cada pedido.
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wide tabular-nums text-muted-foreground">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageSearch className="size-6" />
              </span>
              <p className="font-display text-base font-semibold">
                Nenhum pedido registrado
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Assim que a loja receber vendas, os pedidos aparecerão aqui para
                acompanhamento e atualização de status.
              </p>
            </div>
          ) : (
            <Table className={TABLE_CLASS}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={TH_CLASS}>Pedido</TableHead>
                  <TableHead className={TH_CLASS}>Data</TableHead>
                  <TableHead className={TH_CLASS}>Cliente</TableHead>
                  <TableHead className={TH_CLASS}>Canal</TableHead>
                  <TableHead className={cn(TH_CLASS, "text-right")}>Itens</TableHead>
                  <TableHead className={TH_CLASS}>Pagamento</TableHead>
                  <TableHead className={cn(TH_CLASS, "text-right")}>Total</TableHead>
                  <TableHead className={TH_CLASS}>Status</TableHead>
                  <TableHead className={cn(TH_CLASS, "text-right")}>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="py-2.5">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-sm font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                      {dateFormat.format(new Date(order.createdAt))}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate py-2.5">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <ChannelBadge channel={order.channel} />
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono tabular-nums">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground">
                      {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ??
                        order.paymentMethod}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono font-medium tabular-nums">
                      {formatBRL(order.total)}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/pedidos/${order.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
