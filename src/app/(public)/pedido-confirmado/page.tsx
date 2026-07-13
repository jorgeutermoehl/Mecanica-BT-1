import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ArrowRight, MessageCircle, Mail, PackageCheck } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { whatsappLink } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { ORDER_STATUS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  description: "Seu pedido foi registrado com sucesso na FullBoost Race Parts.",
};

/** Mensagem por status do pedido recém-criado. */
const STATUS_MESSAGE: Partial<Record<OrderStatus, string>> = {
  PAID: "Pagamento aprovado — já estamos separando suas peças.",
  AWAITING_PAYMENT:
    "Aguardando pagamento do boleto. Assim que compensar, o pedido segue para separação.",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const orderNumber = first(params.numero).trim();
  if (!orderNumber) redirect("/");

  const total = Number(first(params.total));
  const hasTotal = Number.isFinite(total) && total > 0;

  const rawStatus = first(params.status).toUpperCase();
  const status = (ORDER_STATUS as readonly string[]).includes(rawStatus)
    ? (rawStatus as OrderStatus)
    : null;

  const message =
    (status && STATUS_MESSAGE[status]) ??
    "Recebemos seu pedido e enviaremos todas as atualizações por e-mail.";

  const whatsappMessage = `Olá! Acabei de fazer o pedido ${orderNumber} na FullBoost e gostaria de acompanhar o andamento.`;

  return (
    <section className="py-10 sm:py-16 lg:py-24">
      <Container>
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card">
          <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-40" />

          <div className="relative flex flex-col items-center px-6 py-12 text-center sm:px-12">
            {/* Ícone de sucesso */}
            <span className="flex size-20 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/30">
              <CheckCircle2 className="size-10" />
            </span>

            <h1 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Pedido confirmado!
            </h1>
            <p className="mt-3 max-w-md text-pretty text-muted-foreground">{message}</p>

            {/* Número do pedido */}
            <div className="mt-8 w-full rounded-xl border border-border bg-background/60 px-6 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Número do pedido
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {orderNumber}
              </p>

              <Separator className="my-4" />

              <dl className="space-y-2 text-sm">
                {hasTotal && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Total do pedido</dt>
                    <dd className="font-display text-lg font-bold text-foreground">
                      {formatBRL(total)}
                    </dd>
                  </div>
                )}
                {status && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Situação</dt>
                    <dd>
                      <span
                        className={
                          status === "PAID"
                            ? "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide text-success"
                            : "inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide text-warning"
                        }
                      >
                        {status === "PAID" ? (
                          <PackageCheck className="size-3.5" />
                        ) : (
                          <Mail className="size-3.5" />
                        )}
                        {ORDER_STATUS_LABEL[status]}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Ações */}
            <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="gap-2">
                <Link href="/produtos">
                  Ver mais produtos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href={whatsappLink(whatsappMessage)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>

            <p className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <Mail className="size-3.5" />
              Enviamos a confirmação e o rastreio para o seu e-mail.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
