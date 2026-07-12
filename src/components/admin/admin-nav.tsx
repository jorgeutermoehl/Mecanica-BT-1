"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Marca ativo apenas quando o pathname é exatamente igual (raiz do painel). */
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
];

/** Rótulos pt-BR dos papéis staff (slug → exibição). */
export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
  estoquista: "Estoquista",
  financeiro: "Financeiro",
};

/**
 * Navegação lateral do painel. Client component: usa usePathname para
 * destacar o item ativo. `onNavigate` permite fechar o Sheet no mobile.
 */
export function AdminNav({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Navegação do painel">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" strokeWidth={active ? 2.4 : 2} />
            {item.label}
          </Link>
        );
      })}

      <div aria-hidden className="my-2 h-px bg-sidebar-border" />

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      >
        <ExternalLink className="size-4" />
        Ver loja
      </a>
    </nav>
  );
}
