import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { AdminNav, ROLE_LABEL } from "@/components/admin/admin-nav";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";

/**
 * Layout do painel administrativo — TODAS as rotas do grupo (panel)
 * exigem sessão staff válida (guard abaixo). Sidebar fixa no desktop;
 * no mobile vira header com menu em Sheet.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Coluna da sidebar (desktop) — o conteúdo real é fixo na viewport */}
      <aside className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
            <Logo href="/admin" />
          </div>

          <AdminNav className="flex-1 overflow-y-auto p-3" />

          <div className="shrink-0 border-t border-sidebar-border p-4">
            <p className="truncate text-sm font-medium">{session.name}</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              {ROLE_LABEL[session.role] ?? session.role}
            </p>
            <form action={logoutAction} className="mt-3">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 px-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-h-svh flex-col">
        <AdminMobileHeader userName={session.name} userRole={session.role} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
