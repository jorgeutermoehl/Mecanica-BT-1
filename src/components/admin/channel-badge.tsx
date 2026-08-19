import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { SALE_CHANNEL_LABEL, type SaleChannel } from "@/lib/validations";

/**
 * Canal de venda sobre o StatusBadge único:
 * SITE = info · INSTAGRAM = primary · WHATSAPP = success · LOJA = secondary.
 */
const CHANNEL_TONE: Record<SaleChannel, StatusTone> = {
  SITE: "info",
  INSTAGRAM: "primary",
  WHATSAPP: "success",
  LOJA: "secondary",
};

export function ChannelBadge({
  channel,
  className,
}: {
  channel: SaleChannel;
  className?: string;
}) {
  return (
    <StatusBadge tone={CHANNEL_TONE[channel] ?? "muted"} className={className}>
      {SALE_CHANNEL_LABEL[channel] ?? channel}
    </StatusBadge>
  );
}
