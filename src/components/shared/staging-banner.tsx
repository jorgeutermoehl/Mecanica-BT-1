import { FlaskConical } from "lucide-react";
import { IS_STAGING } from "@/lib/constants";

/** Faixa no topo em homologação: deixa claro que nada ali é venda real. */
export function StagingBanner() {
  if (!IS_STAGING) return null;
  return (
    <div
      role="status"
      className="relative z-[60] flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-xs font-medium text-warning-foreground"
    >
      <FlaskConical aria-hidden className="size-3.5 shrink-0" />
      Ambiente de teste — pedidos, estoque e pagamentos aqui não são reais.
    </div>
  );
}
