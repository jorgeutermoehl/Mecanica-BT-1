import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { listOrders } from "@/server/orders";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/validations";
import { formatBRL } from "@/lib/format";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedidos",
};

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as vendas da loja e gerencie o status de cada pedido.
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      <Card>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormat.format(new Date(order.createdAt))}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ??
                        order.paymentMethod}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatBRL(order.total)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
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
