"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/validations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Transições válidas de status (espelha a regra do servidor —
 * pedidos cancelados/devolvidos não podem ser ressuscitados).
 */
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["SEPARATING", "SHIPPED", "CANCELLED"],
  SEPARATING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const options = NEXT_STATUS[currentStatus];

  if (options.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>
          Pedido finalizado — status{" "}
          <strong className="font-medium text-foreground">
            {ORDER_STATUS_LABEL[currentStatus]}
          </strong>{" "}
          não permite novas transições.
        </span>
      </div>
    );
  }

  const willRestock = status === "CANCELLED" || status === "RETURNED";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status || pending) return;
    const nextStatus = status;

    startTransition(async () => {
      const result = await updateOrderStatusAction(
        orderId,
        nextStatus,
        note.trim() || undefined,
      );
      if (result.ok) {
        toast.success(
          `Status atualizado para "${ORDER_STATUS_LABEL[nextStatus]}".`,
        );
        setStatus("");
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível atualizar o status.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="next-status">Novo status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as OrderStatus)}
          disabled={pending}
        >
          <SelectTrigger id="next-status" className="w-full">
            <SelectValue placeholder="Selecione o próximo status" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {ORDER_STATUS_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {willRestock && (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
          <TriangleAlert />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Os itens retornarão ao estoque automaticamente.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="status-note">Observação (opcional)</Label>
        <Textarea
          id="status-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ex.: código de rastreio, motivo do cancelamento…"
          rows={3}
          maxLength={300}
          disabled={pending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!status || pending}>
        {pending ? "Atualizando…" : "Atualizar"}
      </Button>
    </form>
  );
}
