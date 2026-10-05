"use client";

import * as React from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { changeOwnPasswordAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Troca da própria senha — derruba as sessões de outros aparelhos. */
export function ChangePasswordForm() {
  const [values, setValues] = React.useState(EMPTY);
  const [submitting, setSubmitting] = React.useState(false);

  function set(key: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (values.newPassword !== values.confirmPassword) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    setSubmitting(true);
    const r = await changeOwnPasswordAction(values);
    setSubmitting(false);
    if (r.ok) {
      toast.success("Senha alterada", {
        description: "Sessões abertas em outros aparelhos foram encerradas.",
      });
      setValues(EMPTY);
    } else {
      toast.error(r.error ?? "Não foi possível alterar a senha.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Senha atual</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={(e) => set("currentPassword", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(e) => set("newPassword", e.target.value)}
            minLength={10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            minLength={10}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Mínimo de 10 caracteres, com pelo menos uma letra e um número.
      </p>
      <Button type="submit" disabled={submitting} className="gap-2">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        Alterar senha
      </Button>
    </form>
  );
}
