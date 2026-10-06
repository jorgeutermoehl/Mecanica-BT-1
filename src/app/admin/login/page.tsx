import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth";
import { CHECKOUT_ENABLED } from "@/lib/constants";
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
  // Revalida no banco: token antigo (senha trocada/usuário desativado) NÃO
  // redireciona para o painel — senão o layout devolve para cá em loop.
  const session = await getStaffUser();
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
              {CHECKOUT_ENABLED
                ? "Entre com suas credenciais para gerenciar catálogo, estoque e pedidos."
                : "Entre com suas credenciais para gerenciar os anúncios da loja."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LoginForm />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
