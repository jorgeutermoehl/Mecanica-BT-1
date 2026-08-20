import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, RefreshCw } from "lucide-react";
import {
  GATEWAY_METHOD_LABEL,
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABEL,
  TRANSACTION_STATUSES,
  TRANSACTION_STATUS_LABEL,
  listTransactions,
  type GatewayMethod,
  type PaymentProvider,
  type TransactionStatus,
} from "@/server/payments";
import { reprocessWebhookEventAction } from "@/app/actions/payments";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Transações" };

/** Tom do badge por status — sempre TEXTO + cor (nunca cor sozinha). */
const STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  CREATED: "muted",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  REFUNDED: "info",
  PARTIALLY_REFUNDED: "info",
  CHARGED_BACK: "destructive",
  CANCELLED: "muted",
  EXPIRED: "muted",
};

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

/**
 * Formulário da ação "Reprocessar" (server action com requireRole admin).
 * O wrapper inline existe só para adaptar o retorno { ok, error } da action ao
 * contrato void do form — a regra continua toda em actions/payments.ts.
 */
function ReprocessForm({ eventId }: { eventId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await reprocessWebhookEventAction(eventId);
      }}
    >
      <Button type="submit" size="sm" variant="outline">
        <RefreshCw className="size-3.5" aria-hidden />
        Reprocessar
      </Button>
    </form>
  );
}

function makeHref(params: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) q.set(key, value);
  const s = q.toString();
  return s ? `/admin/financeiro/transacoes?${s}` : "/admin/financeiro/transacoes";
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const statusRaw = first(params.status);
  const providerRaw = first(params.provedor);
  const status = (TRANSACTION_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as TransactionStatus)
    : undefined;
  const provider = (PAYMENT_PROVIDERS as readonly string[]).includes(providerRaw)
    ? (providerRaw as PaymentProvider)
    : undefined;

  const { rows, summary } = await listTransactions({ status, provider });

  const summaryCards = [
    {
      label: "Aprovado (bruto)",
      value: formatBRL(summary.approvedGross),
      detail: `${summary.approvedCount} ${summary.approvedCount === 1 ? "transação" : "transações"} · líquido ${formatBRL(summary.approvedNet)}`,
      highlight: true,
    },
    {
      label: "Taxas de gateway",
      value: formatBRL(summary.approvedFees),
      detail: "destacadas no caixa (TAXA_GATEWAY)",
    },
    {
      label: "Pendentes",
      value: String(summary.pendingCount),
      detail: formatBRL(summary.pendingAmount),
    },
    {
      label: "Expiradas",
      value: String(summary.expiredCount),
      detail: "liberadas pelo cron de expiração",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-xl font-bold uppercase tracking-tight">Transações</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conciliação do gateway de pagamento: tentativas, taxas destacadas e reprocessamento de
          webhooks com erro. Sem credenciais configuradas, os eventos ficam registrados como
          ignorados.
        </p>
      </div>

      {/* Filtros: status e provedor (links — funcionam server-side) */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <Button asChild size="sm" variant={!status ? "default" : "outline"}>
              <Link href={makeHref({ provedor: providerRaw })}>Todos</Link>
            </Button>
            {TRANSACTION_STATUSES.map((s) => (
              <Button key={s} asChild size="sm" variant={status === s ? "default" : "outline"}>
                <Link href={makeHref({ status: s, provedor: providerRaw })}>
                  {TRANSACTION_STATUS_LABEL[s]}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Provedor
            </span>
            <Button asChild size="sm" variant={!provider ? "default" : "outline"}>
              <Link href={makeHref({ status: statusRaw })}>Todos</Link>
            </Button>
            {PAYMENT_PROVIDERS.map((p) => (
              <Button key={p} asChild size="sm" variant={provider === p ? "default" : "outline"}>
                <Link href={makeHref({ status: statusRaw, provedor: p })}>
                  {PAYMENT_PROVIDER_LABEL[p]}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards-resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label} size="sm" className={cn(c.highlight && "ring-primary/40")}>
            <CardContent>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight">
                {c.value}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{c.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de conciliação */}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <CreditCard className="size-6" aria-hidden />
              </span>
              <p className="font-display text-base font-semibold">Nenhuma transação registrada</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                As tentativas de pagamento do gateway aparecerão aqui assim que as credenciais do
                provedor forem configuradas (veja docs/PAGAMENTOS-SETUP.md).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className={TABLE_CLASS}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={TH_CLASS}>Data</TableHead>
                    <TableHead className={TH_CLASS}>Pedido</TableHead>
                    <TableHead className={TH_CLASS}>Provedor</TableHead>
                    <TableHead className={TH_CLASS}>Método</TableHead>
                    <TableHead className={TH_CLASS}>Status</TableHead>
                    <TableHead className={cn(TH_CLASS, "text-right")}>Bruto</TableHead>
                    <TableHead className={cn(TH_CLASS, "text-right")}>Taxa</TableHead>
                    <TableHead className={cn(TH_CLASS, "text-right")}>Líquido</TableHead>
                    <TableHead className={cn(TH_CLASS, "text-right")}>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {dateFormat.format(new Date(row.createdAt))}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Link
                          href={`/admin/pedidos/${row.orderId}`}
                          className="font-mono text-sm font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {row.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 text-sm text-muted-foreground">
                        {PAYMENT_PROVIDER_LABEL[row.provider]}
                      </TableCell>
                      <TableCell className="py-2.5 text-sm text-muted-foreground">
                        {GATEWAY_METHOD_LABEL[row.method as GatewayMethod] ?? row.method}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge tone={STATUS_TONE[row.status]}>
                          {TRANSACTION_STATUS_LABEL[row.status]}
                        </StatusBadge>
                        {row.errorEvent && (
                          <p
                            className="mt-1 max-w-[220px] truncate text-xs text-destructive"
                            title={row.errorEvent.errorMessage ?? undefined}
                          >
                            Webhook com erro ({row.errorEvent.attempts}{" "}
                            {row.errorEvent.attempts === 1 ? "tentativa" : "tentativas"})
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-sm font-medium tabular-nums">
                        {formatBRL(row.amount)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-sm tabular-nums text-muted-foreground">
                        {row.feeAmount > 0 ? `− ${formatBRL(row.feeAmount)}` : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-sm tabular-nums">
                        {formatBRL(row.netAmount)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        {row.errorEvent ? <ReprocessForm eventId={row.errorEvent.id} /> : null}
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
  );
}
