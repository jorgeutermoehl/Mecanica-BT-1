"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setCouponActiveAction } from "@/app/actions/admin";

/** Botão pequeno "Ativar"/"Desativar" de cupom — chama setCouponActiveAction. */
export function CouponToggle({
  id,
  code,
  isActive,
}: {
  id: string;
  code: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleToggle() {
    setPending(true);
    const result = await setCouponActiveAction(id, !isActive);
    setPending(false);
    if (result.ok) {
      toast.success(isActive ? "Cupom desativado" : "Cupom ativado", {
        description: isActive
          ? `${code} não é mais aceito no checkout.`
          : `${code} voltou a valer no checkout.`,
      });
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível alterar o status do cupom.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={pending}
    >
      {pending ? "Salvando…" : isActive ? "Desativar" : "Ativar"}
    </Button>
  );
}
