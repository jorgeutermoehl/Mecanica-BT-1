import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Badge de status ÚNICO do projeto (ESPEC-V2, Onda 1 item 1).
 * Sempre texto legível + cor via tokens do tema (claro/escuro) — cor nunca é
 * o único meio de informação (WCAG 1.4.1). Todo status novo (pedido, canal,
 * transação, classe ABC, cobertura, compatibilidade) usa este componente.
 */

export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "primary"
  | "secondary"
  | "muted";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  primary: "bg-primary/15 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone = "muted",
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", TONE_CLASS[tone], className)}
    >
      {children}
    </Badge>
  );
}
