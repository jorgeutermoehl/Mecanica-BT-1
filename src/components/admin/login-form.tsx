"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Formulário de login do painel administrativo. */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const result = await loginAction({ email, password });

    if (result.ok) {
      toast.success("Login realizado. Bem-vindo ao painel!");
      router.push("/admin");
      router.refresh();
      return; // mantém o botão desabilitado durante a navegação
    }

    toast.error(result.error ?? "Não foi possível entrar. Tente novamente.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@fullboost.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando…
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            Entrar no painel
          </>
        )}
      </Button>
    </form>
  );
}
