"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setProductStatusAction } from "@/app/actions/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ProductStatusToggleProps {
  productId: string;
  productName: string;
  active: boolean;
}

/**
 * Ativa/desativa o anúncio na loja (soft delete = INACTIVE).
 * Desativação pede confirmação via AlertDialog; reativação é direta.
 */
export function ProductStatusToggle({
  productId,
  productName,
  active,
}: ProductStatusToggleProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(nextActive: boolean) {
    setPending(true);
    const result = await setProductStatusAction(productId, nextActive);
    if (result.ok) {
      toast.success(
        nextActive
          ? "Produto reativado — voltou ao ar na loja."
          : "Produto desativado — removido da loja.",
      );
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível alterar o status.");
    }
    setPending(false);
  }

  if (!active) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => toggle(true)}
      >
        {pending ? "Reativando..." : "Reativar"}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={pending}>
          {pending ? "Desativando..." : "Desativar"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar produto?</AlertDialogTitle>
          <AlertDialogDescription>
            “{productName}” sai do ar na loja imediatamente. O histórico de
            movimentações e o estoque são preservados, e você pode reativar o
            anúncio quando quiser.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => toggle(false)}>
            Desativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
