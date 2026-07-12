import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { LoginForm } from "@/components/admin/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Login do painel",
  description: "Acesso restrito ao painel administrativo FullBoost Race Parts.",
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="bg-carbon relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      {/* Brilho de boost no topo, assinatura visual da marca */}
      <span
        aria-hidden
        className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <CardHeader className="border-b text-center">
            <CardTitle className="font-display text-2xl font-bold uppercase tracking-tight">
              Painel FullBoost
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais de operador para gerenciar catálogo,
              estoque e pedidos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LoginForm />
          </CardContent>
        </Card>

        {/* Dica discreta das credenciais do ambiente de demonstração */}
        <div className="mt-6 rounded-lg border border-border bg-card/60 px-4 py-3 text-center">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Ambiente de demonstração
          </p>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">
            admin@fullboost.com.br <span className="text-primary">·</span>{" "}
            fullboost123
          </p>
        </div>
      </div>
    </div>
  );
}
