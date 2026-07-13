import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SALE_CHANNEL_LABEL, type SaleChannel } from "@/lib/validations";

/**
 * Badge de canal de venda com as cores semânticas do painel:
 * SITE = info · INSTAGRAM = primary · WHATSAPP = success · LOJA = secondary.
 */
const CHANNEL_CLASS: Record<SaleChannel, string> = {
  SITE: "bg-info/15 text-info",
  INSTAGRAM: "bg-primary/15 text-primary",
  WHATSAPP: "bg-success/15 text-success",
  LOJA: "bg-secondary text-secondary-foreground",
};

export function ChannelBadge({
  channel,
  className,
}: {
  channel: SaleChannel;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        CHANNEL_CLASS[channel] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {SALE_CHANNEL_LABEL[channel] ?? channel}
    </Badge>
  );
}
