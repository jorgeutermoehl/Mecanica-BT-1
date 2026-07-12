import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/validations";

/**
 * Badge de status de pedido com as cores semânticas do painel:
 * PAID/DELIVERED = success · SEPARATING/SHIPPED = info ·
 * AWAITING_PAYMENT = warning · CANCELLED = destructive · RETURNED = muted.
 */
const STATUS_CLASS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "bg-warning/15 text-warning",
  PAID: "bg-success/15 text-success",
  SEPARATING: "bg-info/15 text-info",
  SHIPPED: "bg-info/15 text-info",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  RETURNED: "bg-muted text-muted-foreground",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", STATUS_CLASS[status], className)}
    >
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}
