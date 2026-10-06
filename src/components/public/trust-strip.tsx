import type { LucideIcon } from "lucide-react";
import { CHECKOUT_ENABLED, COMMERCE } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { CreditCard, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

// Promessas derivadas da regra comercial configurada (src/lib/constants.ts).
const ITEMS: { icon: LucideIcon; text: string }[] = [
  COMMERCE.freeShippingFrom > 0
    ? { icon: Truck, text: `Frete grátis acima de ${formatBRL(COMMERCE.freeShippingFrom)}` }
    : { icon: Truck, text: "Envio para todo o Brasil" },
  ...(COMMERCE.maxInstallments > 1
    ? [{ icon: CreditCard, text: `Parcele em até ${COMMERCE.maxInstallments}x sem juros` }]
    : []),
  { icon: ShieldCheck, text: "Pagamento por Pix ou cartão" },
  {
    icon: MessageCircle,
    text: CHECKOUT_ENABLED ? "Atendimento por WhatsApp" : "Pedido direto no WhatsApp",
  },
];

/**
 * Faixa de confiança reutilizável — padrão do e-commerce de autopeças BR.
 * Usada logo abaixo do hero da home; fundo discreto, sem decoração.
 */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <section
      aria-label="Vantagens da loja"
      className={cn("border-y border-border bg-muted/30", className)}
    >
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 py-4 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 lg:justify-center">
              <Icon aria-hidden className="size-5 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground/90">{text}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
