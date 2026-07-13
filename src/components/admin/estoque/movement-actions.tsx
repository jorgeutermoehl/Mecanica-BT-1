"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { correctMovementAction, reverseMovementAction } from "@/app/actions/admin";

/**
 * Ações por lançamento: Corrigir (estorna + relança) e Estornar (lançamento
 * reverso). O histórico é append-only — nada é apagado.
 */
export type MovementForActions = {
  id: string;
  type: string;
  quantity: number;
  unitCost: number;
  reason: string | null;
  sku: string;
  canModify: boolean;
  isReversal: boolean;
  isReversed: boolean;
  orderNumber: string | null;
};

function blockedReason(m: MovementForActions): string {
  if (m.orderNumber) return `Vinculada ao pedido ${m.orderNumber} — cancele o pedido para repor o estoque.`;
  if (m.isReversal) return "Lançamento de estorno — não pode ser alterado.";
  if (m.isReversed) return "Já estornada.";
  return "Não editável.";
}

export function MovementActions({ movement }: { movement: MovementForActions }) {
  const router = useRouter();
  const [correctOpen, setCorrectOpen] = React.useState(false);
  const [reverseOpen, setReverseOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [quantity, setQuantity] = React.useState(String(movement.quantity));
  const [unitCost, setUnitCost] = React.useState(movement.unitCost.toFixed(2));
  const [reason, setReason] = React.useState("");

  const isEntry = movement.type === "ENTRY";

  if (!movement.canModify) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex gap-1 opacity-40" aria-label={blockedReason(movement)}>
              <Button variant="ghost" size="icon" className="size-8" disabled>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" disabled>
                <Undo2 className="size-3.5" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{blockedReason(movement)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  async function submitCorrection(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await correctMovementAction(movement.id, {
      quantity: Number(quantity),
      unitCost: isEntry ? Number(unitCost) : undefined,
      reason: reason || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Lançamento corrigido", {
        description: "O original foi estornado e o novo valor lançado.",
      });
      setCorrectOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível corrigir.");
    }
  }

  async function submitReversal() {
    setSubmitting(true);
    const result = await reverseMovementAction(movement.id);
    setSubmitting(false);
    if (result.ok) {
      toast.success("Lançamento estornado", {
        description: "O saldo foi devolvido e o histórico preservado.",
      });
      setReverseOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível estornar.");
    }
  }

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <span className="inline-flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Corrigir lançamento"
                onClick={() => setCorrectOpen(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Corrigir (estorna e relança)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                aria-label="Estornar lançamento"
                onClick={() => setReverseOpen(true)}
              >
                <Undo2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Estornar (devolve o saldo)</TooltipContent>
          </Tooltip>
        </span>
      </TooltipProvider>

      {/* Corrigir */}
      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Corrigir lançamento</DialogTitle>
            <DialogDescription>
              {movement.sku} — a correção estorna o lançamento original e cria um novo
              com os valores corrigidos (auditoria preservada).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCorrection} className="grid gap-4">
            <div className={isEntry ? "grid grid-cols-2 gap-4" : "grid gap-4"}>
              <div className="grid gap-1.5">
                <Label htmlFor={`fix-qty-${movement.id}`}>Quantidade</Label>
                <Input
                  id={`fix-qty-${movement.id}`}
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              {isEntry ? (
                <div className="grid gap-1.5">
                  <Label htmlFor={`fix-cost-${movement.id}`}>Custo unitário (R$)</Label>
                  <Input
                    id={`fix-cost-${movement.id}`}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`fix-reason-${movement.id}`}>Motivo da correção (opcional)</Label>
              <Input
                id={`fix-reason-${movement.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: quantidade digitada errada"
              />
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={() => setCorrectOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Corrigindo..." : "Corrigir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Estornar */}
      <AlertDialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Cria um lançamento reverso de {movement.quantity} un de {movement.sku} e
              devolve o saldo — nada é apagado do histórico (auditoria). Se a compra
              gerou despesa no financeiro, ela também é revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                void submitReversal();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? "Estornando..." : "Estornar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
