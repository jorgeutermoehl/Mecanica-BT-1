import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/validations";

/**
 * Status de pedido sobre o StatusBadge único:
 * PAID/DELIVERED = success · SEPARATING/SHIPPED = info ·
 * AWAITING_PAYMENT = warning · CANCELLED = destructive · RETURNED = muted.
 */
const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  AWAITING_PAYMENT: "warning",
  PAID: "success",
  SEPARATING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "muted",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <StatusBadge tone={STATUS_TONE[status]} className={className}>
      {ORDER_STATUS_LABEL[status]}
    </StatusBadge>
  );
}
