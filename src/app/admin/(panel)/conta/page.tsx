import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/components/admin/admin-nav";
import { ChangePasswordForm } from "@/components/admin/usuarios/change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await getStaffUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.name} · <span className="font-mono">{user.email}</span> ·{" "}
          {ROLE_LABEL[user.role] ?? user.role}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">Alterar senha</CardTitle>
          <CardDescription>
            Ao trocar a senha, as sessões abertas em outros aparelhos são encerradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
