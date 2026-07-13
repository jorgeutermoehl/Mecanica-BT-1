import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, User } from "lucide-react";
import { getOrder } from "@/server/orders";
import { PAYMENT_METHOD_LABEL, ORDER_STATUS_LABEL, type PaymentMethod } from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrderStatusBadge } from "@/components/admin/pedidos/order-status-badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { ChannelBadge } from "@/components/admin/channel-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalhe do pedido",
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const paymentLabel =
    PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Pedido <span className="font-mono normal-case">{order.number}</span>
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Realizado em {dateTimeFormat.format(new Date(order.createdAt))}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ===================== Coluna esquerda ===================== */}
        <div className="min-w-0 space-y-6">
          {/* Itens do pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do pedido</CardTitle>
              <CardDescription>
                {order.items.length} {order.items.length === 1 ? "item" : "itens"} — custos
                congelados no momento da venda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço unit.</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-[260px] truncate font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatBRL(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help font-mono text-xs tabular-nums text-muted-foreground underline decoration-dotted underline-offset-2">
                                {formatBRL(item.unitCostAtSale)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>custo no momento da venda</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {formatBRL(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Totais */}
          <Card>
            <CardHeader>
              <CardTitle>Totais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">{formatBRL(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  Desconto
                  {order.couponCode && (
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {order.couponCode}
                    </Badge>
                  )}
                </span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    order.discount > 0 && "text-success",
                  )}
                >
                  {order.discount > 0 ? `− ${formatBRL(order.discount)}` : formatBRL(0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    order.shippingCost === 0 && "font-medium text-success",
                  )}
                >
                  {order.shippingCost === 0 ? "Grátis" : formatBRL(order.shippingCost)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold uppercase tracking-wide">
                  Total
                </span>
                <span className="font-display text-2xl font-bold tabular-nums">
                  {formatBRL(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de status */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico do pedido</CardTitle>
              <CardDescription>Linha do tempo de todas as mudanças de status.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol>
                {order.history.map((event, index) => {
                  const isCurrent = index === order.history.length - 1;
                  return (
                    <li
                      key={`${event.status}-${event.createdAt}`}
                      className="relative border-l border-border pb-6 pl-6 last:border-transparent last:pb-0"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-1 -left-[5px] size-2.5 rounded-full",
                          isCurrent
                            ? "bg-primary ring-4 ring-primary/15"
                            : "bg-muted-foreground/40",
                        )}
                      />
                      <p className="text-sm font-semibold leading-none">
                        {ORDER_STATUS_LABEL[event.status]}
                      </p>
                      <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                        {dateTimeFormat.format(new Date(event.createdAt))}
                      </p>
                      {event.note && (
                        <p className="mt-1.5 text-sm text-muted-foreground">{event.note}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* ===================== Coluna direita ===================== */}
        <div className="space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="font-semibold">{order.customerName}</p>
              <p className="break-all text-muted-foreground">{order.customerEmail}</p>
              <p className="font-mono text-muted-foreground">{order.customerPhone}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {order.customerDocument
                  ? `Documento: ${order.customerDocument}`
                  : "Documento não informado"}
              </p>
            </CardContent>
          </Card>

          {/* Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">
                {order.shipping.street}, {order.shipping.number}
                {order.shipping.complement ? ` — ${order.shipping.complement}` : ""}
              </p>
              {order.shipping.district && (
                <p className="text-muted-foreground">{order.shipping.district}</p>
              )}
              <p className="text-muted-foreground">
                {order.shipping.city} / {order.shipping.state}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                CEP {order.shipping.zipCode}
              </p>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">{paymentLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Canal</span>
                <ChannelBadge channel={order.channel} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </CardContent>
          </Card>

          {/* Atualizar status */}
          <Card>
            <CardHeader>
              <CardTitle>Atualizar status</CardTitle>
              <CardDescription>
                Avance o pedido para a próxima etapa ou registre cancelamento/devolução.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
