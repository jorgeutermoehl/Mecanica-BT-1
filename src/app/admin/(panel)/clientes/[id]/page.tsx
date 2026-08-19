import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  CalendarClock,
  MapPin,
  Phone,
  ReceiptText,
  ShoppingBag,
  Star,
  TicketPercent,
  Wallet,
} from "lucide-react";
import { getCustomer360 } from "@/server/customers";
import { formatBRL } from "@/lib/format";
import {
  PAYMENT_METHOD_LABEL,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChannelBadge } from "@/components/admin/channel-badge";
import { OrderStatusBadge } from "@/components/admin/pedidos/order-status-badge";
import { DuplicatesPanel } from "@/components/admin/clientes/duplicates-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cliente" };

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getCustomer360(id);
  if (!c) notFound();

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/clientes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Clientes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">{c.name}</h1>
          {c.acquisitionChannel ? <ChannelBadge channel={c.acquisitionChannel} /> : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {c.instagramHandle ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <AtSign className="size-3.5" />
              {c.instagramHandle}
            </span>
          ) : null}
          {c.phone || c.whatsapp ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <Phone className="size-3.5" />
              {c.phone ?? c.whatsapp}
            </span>
          ) : null}
          {c.email ? <span className="font-mono">{c.email}</span> : null}
          {c.document ? <span className="font-mono">{c.document}</span> : null}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            Cliente desde {dateFormat.format(new Date(c.createdAt))}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total comprado" value={formatBRL(c.totalSpent)} />
        <KpiCard
          label="Pedidos"
          value={String(c.ordersCount)}
          hint={c.ordersCount === 0 ? "Nenhuma compra ainda" : undefined}
        />
        <KpiCard label="Ticket médio" value={formatBRL(c.avgTicket)} />
        <KpiCard
          label="Última compra"
          value={c.lastPurchaseAt ? dateFormat.format(new Date(c.lastPurchaseAt)) : "—"}
        />
      </div>

      <DuplicatesPanel customerId={c.id} />

      {/* Abas */}
      <Tabs defaultValue="pedidos">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pedidos" className="gap-1.5">
            <ShoppingBag className="size-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="enderecos" className="gap-1.5">
            <MapPin className="size-4" />
            Endereços
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1.5">
            <Wallet className="size-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="cupons" className="gap-1.5">
            <TicketPercent className="size-4" />
            Cupons
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <ReceiptText className="size-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Pedidos */}
        <TabsContent value="pedidos">
          <Card>
            <CardContent>
              {c.orders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum pedido deste cliente ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c.orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <Link
                              href={`/admin/pedidos/${o.id}`}
                              className="font-mono font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {o.number}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {dateFormat.format(new Date(o.createdAt))}
                          </TableCell>
                          <TableCell>
                            <ChannelBadge channel={o.channel} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {o.paymentMethod
                              ? (PAYMENT_METHOD_LABEL[o.paymentMethod as PaymentMethod] ?? o.paymentMethod)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={o.status as OrderStatus} />
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold tabular-nums">
                            {formatBRL(o.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endereços */}
        <TabsContent value="enderecos">
          <Card>
            <CardContent>
              {c.addresses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum endereço salvo — o endereço do próximo checkout aparece aqui
                  automaticamente.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {c.addresses.map((a) => (
                    <li key={a.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{a.label ?? "Endereço"}</p>
                        {a.isDefault ? (
                          <StatusBadge tone="primary" className="gap-1">
                            <Star className="size-3" aria-hidden />
                            Padrão
                          </StatusBadge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {a.street}
                        {a.number ? `, ${a.number}` : ""}
                        {a.complement ? ` — ${a.complement}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[a.district, a.city].filter(Boolean).join(", ")} · {a.state}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">CEP {a.zipCode}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financeiro">
          <Card>
            <CardContent>
              {c.openReceivables.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nada em aberto — todos os recebimentos deste cliente estão quitados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c.openReceivables.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{r.description}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {dateFormat.format(new Date(r.dueDate))}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={r.status === "OVERDUE" ? "destructive" : "warning"}>
                              {r.status === "OVERDUE" ? "Vencido" : "Em aberto"}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold tabular-nums">
                            {formatBRL(r.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cupons */}
        <TabsContent value="cupons">
          <Card>
            <CardContent>
              {c.coupons.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Este cliente ainda não usou cupons.
                </p>
              ) : (
                <ul className="space-y-2">
                  {c.coupons.map((cp) => (
                    <li
                      key={cp.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold uppercase">{cp.code}</span>
                        <StatusBadge tone="primary">
                          {cp.type === "PERCENT" ? `${cp.value}% off` : `${formatBRL(cp.value)} off`}
                        </StatusBadge>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        usado em {dateFormat.format(new Date(cp.usedAt))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardContent>
              {c.timeline.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sem eventos registrados para este cliente.
                </p>
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {c.timeline.map((t) => (
                    <li key={t.id} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-[23px] top-1.5 size-2 rounded-full bg-primary"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.kind === "ORDER_STATUS" && t.status ? (
                          <OrderStatusBadge status={t.status as OrderStatus} />
                        ) : null}
                      </div>
                      {t.detail ? (
                        <p className="text-sm text-muted-foreground">{t.detail}</p>
                      ) : null}
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {dateTimeFormat.format(new Date(t.at))}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {c.notes ? (
        <Card>
          <CardContent>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Observações</p>
            <p className="mt-1 text-sm">{c.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Atalho de venda: cliente já no contexto */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/estoque?secao=saidas">Registrar venda para este cliente</Link>
        </Button>
      </div>
    </div>
  );
}
