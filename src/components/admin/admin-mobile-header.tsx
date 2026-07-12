"use client";

import * as React from "react";
import { LogOut, Menu } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNav, ROLE_LABEL } from "@/components/admin/admin-nav";

/**
 * Header do painel no mobile (a sidebar some em telas < lg):
 * logo + botão que abre a navegação em um Sheet lateral.
 */
export function AdminMobileHeader({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
      <Logo href="/admin" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu do painel"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground [&_[data-slot=sheet-close]]:text-sidebar-foreground"
        >
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle className="text-sidebar-foreground">
              <Logo href="/admin" />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navegação do painel administrativo FullBoost
            </SheetDescription>
          </SheetHeader>

          <AdminNav className="flex-1 overflow-y-auto px-3" onNavigate={() => setOpen(false)} />

          <SheetFooter className="border-t border-sidebar-border">
            <div className="px-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
                {ROLE_LABEL[userRole] ?? userRole}
              </p>
            </div>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  );
}
