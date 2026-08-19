"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Truck,
  CreditCard,
  QrCode,
  Barcode,
  Lock,
  ShieldCheck,
  Tag,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrderAction } from "@/app/actions/checkout";
import { PAYMENT_METHOD_LABEL, type CheckoutInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { formatBRL, installment } from "@/lib/format";
import type { CartItem } from "@/types/store";

/** Regra de frete espelhada do servidor (src/server/orders.ts). */
const FREE_SHIPPING_THRESHOLD = 599;
const FLAT_SHIPPING = 34.9;

/* ---------- Rótulo de seção (padrão da home) ---------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/* ---------- Métodos de pagamento aceitos na loja ---------- */
type Method = CheckoutInput["paymentMethod"];

const PAYMENTS: { value: Method; hint: string; icon: LucideIcon }[] = [
  { value: "PIX", hint: "Aprovação na hora — pedido segue direto para separação", icon: QrCode },
  { value: "CREDIT_CARD", hint: "Em até 10x sem juros", icon: CreditCard },
  { value: "BOLETO", hint: "Compensação em até 3 dias úteis", icon: Barcode },
];

/* ---------- Card de seção numerada ---------- */
function SectionCard({
  step,
  title,
  icon: Icon,
  children,
}: {
  step: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
          {step}
        </span>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ---------- Campo de formulário ---------- */
function Field({
  id,
  label,
  hint,
  className,
  inputClassName,
  ...props
}: React.ComponentProps<"input"> & {
  id: string;
  label: string;
  hint?: string;
  inputClassName?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={inputClassName} {...props} />
      {hint ? <p className="font-mono text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ---------- Miniatura do item no resumo ---------- */
function SummaryThumb({ item }: { item: CartItem }) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = item.image && !imgError;

  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-carbon">
      {showImage ? (
        <Image
          src={item.image!}
          alt={item.name}
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <PartIcon icon={item.icon} className="size-6 text-muted-foreground/50" />
      )}
    </span>
  );
}

/* ---------- Skeleton (antes da hidratação do carrinho) ---------- */
function CheckoutSkeleton() {
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-9 w-72" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[28rem] w-full rounded-xl" />
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- *
 * Página
 * ---------------------------------------------------------------- */

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, subtotal, hydrated, clear } = useCart();
  const [method, setMethod] = React.useState<Method>("PIX");
  const [submitting, setSubmitting] = React.useState(false);
  /** Evita o redirect para /carrinho quando o clear() acontece após a venda. */
  const placedRef = React.useRef(false);

  React.useEffect(() => {
    if (hydrated && items.length === 0 && !placedRef.current) {
      router.replace("/carrinho");
    }
  }, [hydrated, items.length, router]);

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : FLAT_SHIPPING;
  const total = subtotal + shipping;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || items.length === 0) return;

    const data = new FormData(e.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const input: CheckoutInput = {
      customer: {
        name: get("name"),
        email: get("email"),
        phone: get("phone"),
        document: get("document"),
      },
      shipping: {
        zipCode: get("zipCode"),
        street: get("street"),
        number: get("number"),
        complement: get("complement"),
        district: get("district"),
        city: get("city"),
        state: get("state").toUpperCase(),
      },
      paymentMethod: method,
      couponCode: get("couponCode").toUpperCase(),
      // Mesma sessão do banner de cookies — liga o pedido à origem da visita
      // (UTM/Instagram) respeitando o consentimento dado.
      sessionId: localStorage.getItem("fb-session-id") ?? "",
      ...(() => {
        // "Meu Carro" selecionado na loja → garagem do cliente + snapshot no pedido.
        try {
          const raw = localStorage.getItem("fullboost.myCar");
          if (!raw) return {};
          const car = JSON.parse(raw) as { versionId?: string; label?: string };
          return { myCarVersionId: car.versionId ?? "", myCarLabel: car.label ?? "" };
        } catch {
          return {};
        }
      })(),
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    setSubmitting(true);
    try {
      const r = await placeOrderAction(input);
      if (r.ok) {
        placedRef.current = true;
        clear();
        toast.success("Pedido realizado com sucesso!", {
          description: `Pedido ${r.orderNumber} · ${formatBRL(r.total)}`,
        });
        router.push(
          `/pedido-confirmado?numero=${encodeURIComponent(r.orderNumber)}&total=${r.total}&status=${r.status}`,
        );
        return; // mantém o botão travado durante a navegação
      }
      toast.error("Não foi possível concluir o pedido", { description: r.error });
    } catch {
      toast.error("Falha de conexão", { description: "Tente novamente em instantes." });
    }
    setSubmitting(false);
  }

  if (!hydrated) return <CheckoutSkeleton />;
  if (items.length === 0) return <CheckoutSkeleton />; // redirecionando para /carrinho

  return (
    <section className="py-12 lg:py-16">
      <Container>
        {/* Cabeçalho */}
        <div className="mb-8">
          <Link
            href="/carrinho"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao carrinho
          </Link>
          <Eyebrow>Checkout</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Finalizar compra
            </h1>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-success">
              <Lock className="size-3.5" />
              Ambiente seguro
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]"
        >
          {/* ============ COLUNA ESQUERDA — FORMULÁRIO ============ */}
          <div className="space-y-6">
            {/* 01 — Seus dados */}
            <SectionCard step="01" title="Seus dados" icon={UserRound}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="name"
                  name="name"
                  label="Nome completo"
                  className="sm:col-span-2"
                  placeholder="Ex.: Rafael Menezes"
                  autoComplete="name"
                  minLength={3}
                  required
                />
                <Field
                  id="email"
                  name="email"
                  label="E-mail"
                  className="sm:col-span-2"
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  hint="Enviaremos a confirmação e o rastreio aqui."
                  required
                />
                <Field
                  id="phone"
                  name="phone"
                  label="Celular / WhatsApp"
                  type="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  minLength={8}
                  required
                />
                <Field
                  id="document"
                  name="document"
                  label="CPF/CNPJ (opcional)"
                  inputMode="numeric"
                  placeholder="Somente números"
                  autoComplete="off"
                  maxLength={20}
                />
              </div>
            </SectionCard>

            {/* 02 — Entrega */}
            <SectionCard step="02" title="Entrega" icon={Truck}>
              <div className="grid gap-4 sm:grid-cols-6">
                <Field
                  id="zipCode"
                  name="zipCode"
                  label="CEP"
                  className="sm:col-span-2"
                  inputMode="numeric"
                  placeholder="00000-000"
                  autoComplete="postal-code"
                  minLength={8}
                  maxLength={9}
                  required
                />
                <Field
                  id="street"
                  name="street"
                  label="Endereço"
                  className="sm:col-span-4"
                  placeholder="Rua, avenida..."
                  autoComplete="address-line1"
                  minLength={3}
                  required
                />
                <Field
                  id="number"
                  name="number"
                  label="Número"
                  className="sm:col-span-2"
                  placeholder="1000"
                  maxLength={20}
                  required
                />
                <Field
                  id="complement"
                  name="complement"
                  label="Complemento"
                  className="sm:col-span-4"
                  placeholder="Apto, bloco, referência (opcional)"
                  autoComplete="address-line2"
                  maxLength={80}
                />
                <Field
                  id="district"
                  name="district"
                  label="Bairro"
                  className="sm:col-span-2"
                  placeholder="Centro"
                  maxLength={80}
                />
                <Field
                  id="city"
                  name="city"
                  label="Cidade"
                  className="sm:col-span-3"
                  placeholder="Sua cidade"
                  autoComplete="address-level2"
                  minLength={2}
                  required
                />
                <Field
                  id="state"
                  name="state"
                  label="UF"
                  className="sm:col-span-1"
                  placeholder="SP"
                  maxLength={2}
                  pattern="[A-Za-z]{2}"
                  title="Sigla do estado com 2 letras (ex.: SP)"
                  autoComplete="address-level1"
                  inputClassName="uppercase"
                  required
                />
              </div>
            </SectionCard>

            {/* 03 — Pagamento */}
            <SectionCard step="03" title="Pagamento" icon={CreditCard}>
              <RadioGroup
                value={method}
                onValueChange={(v) => setMethod(v as Method)}
                aria-label="Forma de pagamento"
                className="gap-3"
              >
                {PAYMENTS.map(({ value, hint, icon: Icon }) => {
                  const active = method === value;
                  return (
                    <Label
                      key={value}
                      htmlFor={`pay-${value}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      <RadioGroupItem id={`pay-${value}`} value={value} />
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {PAYMENT_METHOD_LABEL[value]}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">{hint}</span>
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                {method === "BOLETO"
                  ? "O pedido fica aguardando pagamento até a compensação do boleto."
                  : "Pagamento aprovado na hora — o pedido já entra na fila de separação."}
              </p>
            </SectionCard>
          </div>

          {/* ============ COLUNA DIREITA — RESUMO ============ */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Resumo do pedido
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {count} {count === 1 ? "item" : "itens"}
                </span>
              </div>

              {/* Itens reais do carrinho */}
              <ul className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3">
                    <SummaryThumb item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {item.quantity} × {formatBRL(item.price)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                      {formatBRL(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Cupom (desconto calculado no servidor) */}
              <div className="mt-5">
                <Label
                  htmlFor="couponCode"
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  Cupom de desconto
                </Label>
                <div className="relative mt-1.5">
                  <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="couponCode"
                    name="couponCode"
                    placeholder="Ex.: BOOST10"
                    autoComplete="off"
                    maxLength={30}
                    className="pl-8 font-mono uppercase placeholder:normal-case placeholder:tracking-normal"
                  />
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  Validado ao finalizar — o desconto é calculado no servidor.
                </p>
              </div>

              <Separator className="my-5" />

              {/* Totais */}
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatBRL(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="font-mono tabular-nums">
                    {freeShipping ? (
                      <span className="font-medium text-success">Grátis</span>
                    ) : (
                      formatBRL(FLAT_SHIPPING)
                    )}
                  </dd>
                </div>
              </dl>

              <Separator className="my-5" />

              <div className="flex items-end justify-between">
                <span className="font-display text-sm font-bold uppercase tracking-tight">
                  Total estimado
                </span>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {formatBRL(total)}
                  </span>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    ou 10x de {installment(total)} sem juros
                  </p>
                </div>
              </div>

              {/* Botão finalizar */}
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="mt-5 h-12 w-full gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processando pedido...
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    Finalizar pedido
                  </>
                )}
              </Button>

              {/* Selos de segurança */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5">
                  <Lock className="size-4 shrink-0 text-success" />
                  <span className="text-xs font-medium leading-tight">Pagamento seguro</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5">
                  <ShieldCheck className="size-4 shrink-0 text-success" />
                  <span className="text-xs font-medium leading-tight">Compra protegida</span>
                </div>
              </div>

              <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
                Preços e estoque são revalidados no servidor ao finalizar.
              </p>
            </div>
          </aside>
        </form>
      </Container>
    </section>
  );
}
