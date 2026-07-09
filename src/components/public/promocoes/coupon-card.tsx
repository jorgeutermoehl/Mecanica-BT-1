"use client";

import { useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type Coupon = {
  /** Código digitado no carrinho (mono, caixa alta). */
  code: string;
  /** Chamada curta do benefício, ex.: "15% OFF" ou "FRETE GRÁTIS". */
  highlight: string;
  /** Título da campanha do cupom. */
  title: string;
  /** Explicação do benefício em uma linha. */
  description: string;
  /** Condição de uso (valor mínimo, região, validade). */
  condition: string;
};

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard?.writeText(coupon.code);
    } catch {
      // Alguns navegadores bloqueiam a área de transferência — segue com o toast.
    }
    setCopied(true);
    toast.success("Código copiado", {
      description: `Use ${coupon.code} no carrinho antes de finalizar.`,
    });
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10">
      {/* Cabeçalho do cupom */}
      <div className="relative flex items-center justify-between gap-3 border-b border-dashed border-border p-5">
        <span aria-hidden className="boost-glow absolute inset-0 opacity-60" />
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Ticket className="size-5" />
        </span>
        <span className="relative font-display text-2xl font-bold uppercase tracking-tight text-boost">
          {coupon.highlight}
        </span>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold uppercase tracking-tight text-foreground">
          {coupon.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{coupon.description}</p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {coupon.condition}
        </p>

        <div className="mt-4 flex-1" />

        {/* Código + ação */}
        <div className="space-y-2">
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-center">
            <span className="font-mono text-base font-bold uppercase tracking-[0.3em] text-primary">
              {coupon.code}
            </span>
          </div>
          <Button
            onClick={copyCode}
            className="w-full gap-1.5"
            aria-label={`Copiar código ${coupon.code}`}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Código copiado" : "Copiar código"}
          </Button>
        </div>
      </div>
    </div>
  );
}
