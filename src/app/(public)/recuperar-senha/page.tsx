"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    toast.info("Recuperação de senha em breve", {
      description: `Enviaremos as instruções para ${email}.`,
    });
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-8">
        <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-24" />
        <div className="relative">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Recuperar senha
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <Button type="submit" className="h-11 w-full gap-2">
              <Mail className="size-4" />
              Enviar instruções
            </Button>
          </form>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao login
          </Link>
        </div>
      </div>
    </Container>
  );
}
