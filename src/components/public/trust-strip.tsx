import type { LucideIcon } from "lucide-react";
import { CreditCard, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

const ITEMS: { icon: LucideIcon; text: string }[] = [
  { icon: Truck, text: "Frete grátis acima de R$ 599" },
  { icon: CreditCard, text: "Parcele em até 10x sem juros" },
  { icon: ShieldCheck, text: "Garantia em todas as peças" },
  { icon: MessageCircle, text: "Atendimento por WhatsApp" },
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
