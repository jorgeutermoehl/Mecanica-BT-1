"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setContactStatusAction } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";

/** Ações rápidas de atendimento de uma mensagem de contato. */
export function ContactStatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function change(next: string) {
    setPending(true);
    const r = await setContactStatusAction(id, next);
    setPending(false);
    if (r.ok) router.refresh();
    else toast.error(r.error ?? "Não foi possível atualizar.");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ANSWERED" && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => change("ANSWERED")}>
          Marcar respondida
        </Button>
      )}
      {status !== "CLOSED" && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => change("CLOSED")}>
          Arquivar
        </Button>
      )}
      {status !== "NEW" && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => change("NEW")}>
          Reabrir
        </Button>
      )}
    </div>
  );
}
