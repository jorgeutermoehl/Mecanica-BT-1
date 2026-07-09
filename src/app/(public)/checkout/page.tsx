"use client";

import * as React from "react";
import Link from "next/link";
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
  Check,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/container";
import { PartIcon } from "@/components/shared/part-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { formatBRL, installment } from "@/lib/format";
import { getProduct } from "@/lib/mock-data";

/* ---------- Rótulo de seção (padrão da home) ---------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/* ---------- Carrinho mock ---------- */
const CART = [
  { product: getProduct("turbina-billet-050-antilag")!, qty: 1 },
  { product: getProduct("intercooler-frontal-race-600x300")!, qty: 1 },
  { product: getProduct("vela-ignicao-iridium-racing")!, qty: 4 },
];

const unitPrice = (p: (typeof CART)[number]["product"]) => p.promoPrice ?? p.price;

/* ---------- Métodos de pagamento ---------- */
type Method = "pix" | "cartao" | "boleto";

const PAYMENTS: {
  value: Method;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { value: "pix", label: "Pix", hint: "Aprovação na hora · 5% de desconto", icon: QrCode },
  { value: "cartao", label: "Cartão de crédito", hint: "Em até 12x sem juros", icon: CreditCard },
  { value: "boleto", label: "Boleto bancário", hint: "Compensação em até 3 dias úteis", icon: Barcode },
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

export default function CheckoutPage() {
  const [method, setMethod] = React.useState<Method>("pix");

  const subtotal = CART.reduce((sum, item) => sum + unitPrice(item.product) * item.qty, 0);
  const itemCount = CART.reduce((sum, item) => sum + item.qty, 0);
  const shipping = 0; // frete grátis nesta compra
  const pixDiscount = method === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + shipping - pixDiscount;

  function calcularFrete() {
    toast.success("Frete grátis para o seu CEP", {
      description: "Entrega estimada em 3 a 5 dias úteis.",
    });
  }

  function aplicarCupom() {
    toast.info("Cupom inválido ou expirado", {
      description: "Confira o código e tente novamente.",
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = PAYMENTS.find((p) => p.value === method)?.label ?? "";
    toast.success("Pedido realizado com sucesso!", {
      description: `Pagamento via ${label} · ${formatBRL(total)}. Enviaremos a confirmação por e-mail.`,
    });
  }

  return (
    <section className="py-12 lg:py-16">
      <Container>
        {/* Cabeçalho */}
        <div className="mb-8">
          <Link
            href="/produtos"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar às compras
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
                  id="nome"
                  label="Nome completo"
                  className="sm:col-span-2"
                  placeholder="Ex.: Rafael Menezes"
                  autoComplete="name"
                  required
                />
                <Field
                  id="email"
                  label="E-mail"
                  className="sm:col-span-2"
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  hint="Enviaremos a nota fiscal e o rastreio aqui."
                  required
                />
                <Field
                  id="cpf"
                  label="CPF"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  required
                />
                <Field
                  id="celular"
                  label="Celular / WhatsApp"
                  type="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  required
                />
              </div>
            </SectionCard>

            {/* 02 — Entrega */}
            <SectionCard step="02" title="Entrega" icon={Truck}>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cep"
                      inputMode="numeric"
                      placeholder="00000-000"
                      autoComplete="postal-code"
                      className="max-w-[10rem]"
                      required
                    />
                    <Button type="button" variant="outline" size="sm" onClick={calcularFrete}>
                      Calcular
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-6">
                  <Field
                    id="endereco"
                    label="Endereço"
                    className="sm:col-span-4"
                    placeholder="Rua, avenida..."
                    autoComplete="address-line1"
                    required
                  />
                  <Field
                    id="numero"
                    label="Número"
                    className="sm:col-span-2"
                    inputMode="numeric"
                    placeholder="1000"
                    required
                  />
                  <Field
                    id="complemento"
                    label="Complemento"
                    className="sm:col-span-3"
                    placeholder="Apto, bloco, referência (opcional)"
                    autoComplete="address-line2"
                  />
                  <Field
                    id="bairro"
                    label="Bairro"
                    className="sm:col-span-3"
                    placeholder="Centro"
                    required
                  />
                  <Field
                    id="cidade"
                    label="Cidade"
                    className="sm:col-span-4"
                    placeholder="Sua cidade"
                    autoComplete="address-level2"
                    required
                  />
                  <Field
                    id="uf"
                    label="UF"
                    className="sm:col-span-2"
                    placeholder="SP"
                    maxLength={2}
                    autoComplete="address-level1"
                    inputClassName="uppercase"
                    required
                  />
                </div>
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
                {PAYMENTS.map(({ value, label, hint, icon: Icon }) => {
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
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{hint}</span>
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>

              {/* Painel dinâmico por método */}
              <div className="mt-5">
                {method === "pix" && (
                  <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/40 p-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border">
                      <QrCode className="size-8" />
                    </span>
                    <div className="text-sm">
                      <p className="font-semibold">Pague com Pix e ganhe 5% de desconto</p>
                      <p className="mt-1 text-muted-foreground">
                        Ao finalizar, geramos o QR Code para pagamento imediato. A confirmação é
                        automática e o pedido segue para separação na hora.
                      </p>
                    </div>
                  </div>
                )}

                {method === "cartao" && (
                  <div className="grid gap-4 sm:grid-cols-6">
                    <Field
                      id="card-number"
                      label="Número do cartão"
                      className="sm:col-span-6"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      autoComplete="cc-number"
                    />
                    <Field
                      id="card-name"
                      label="Nome impresso no cartão"
                      className="sm:col-span-6"
                      placeholder="Como está no cartão"
                      autoComplete="cc-name"
                    />
                    <Field
                      id="card-exp"
                      label="Validade"
                      className="sm:col-span-2"
                      placeholder="MM/AA"
                      autoComplete="cc-exp"
                    />
                    <Field
                      id="card-cvv"
                      label="CVV"
                      className="sm:col-span-2"
                      inputMode="numeric"
                      placeholder="000"
                      autoComplete="cc-csc"
                    />
                    <Field
                      id="card-parcelas"
                      label="Parcelas"
                      className="sm:col-span-2"
                      defaultValue={`12x de ${installment(total, 12)}`}
                      hint="Até 12x sem juros"
                      readOnly
                    />
                  </div>
                )}

                {method === "boleto" && (
                  <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/40 p-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-background text-foreground ring-1 ring-border">
                      <Barcode className="size-8" />
                    </span>
                    <div className="text-sm">
                      <p className="font-semibold">Boleto gerado ao finalizar o pedido</p>
                      <p className="mt-1 text-muted-foreground">
                        O prazo de entrega começa a contar após a compensação, que leva até 3 dias
                        úteis. O boleto vence em 2 dias.
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
              </div>

              {/* Itens */}
              <ul className="space-y-4">
                {CART.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-carbon">
                      <PartIcon icon={product.icon} className="size-7 text-muted-foreground/50" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {product.brand} · Qtd {qty}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-medium">
                      {formatBRL(unitPrice(product) * qty)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Cupom */}
              <div className="mt-5 flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Cupom de desconto"
                    placeholder="Cupom de desconto"
                    className="pl-8"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={aplicarCupom}>
                  Aplicar
                </Button>
              </div>

              <Separator className="my-5" />

              {/* Totais */}
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono">{formatBRL(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="font-mono font-medium text-success">Grátis</dd>
                </div>
                {pixDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Desconto Pix (5%)</dt>
                    <dd className="font-mono text-success">- {formatBRL(pixDiscount)}</dd>
                  </div>
                )}
              </dl>

              <Separator className="my-5" />

              <div className="flex items-end justify-between">
                <span className="font-display text-sm font-bold uppercase tracking-tight">Total</span>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {formatBRL(total)}
                  </span>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    ou 12x de {installment(total, 12)}
                  </p>
                </div>
              </div>

              {/* Botão finalizar */}
              <Button type="submit" size="lg" className="mt-5 h-11 w-full gap-2 text-sm">
                <Lock className="size-4" />
                Finalizar pedido
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

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center font-mono text-[11px] text-muted-foreground">
                <Check className="size-3.5 text-success" />
                Dados criptografados de ponta a ponta
              </p>
            </div>
          </aside>
        </form>
      </Container>
    </section>
  );
}
