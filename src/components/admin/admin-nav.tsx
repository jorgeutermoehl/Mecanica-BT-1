"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Bell,
  Boxes,
  Calculator,
  ExternalLink,
  FileBarChart,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Marca ativo apenas quando o pathname é exatamente igual (raiz do painel). */
  exact?: boolean;
  /** Exibe o badge de notificações (contagem via prop). */
  showBadge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/promocoes", label: "Promoções", icon: BadgePercent },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/admin/dre", label: "DRE", icon: Calculator },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell, showBadge: true },
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
  notificationCount = 0,
}: {
  className?: string;
  onNavigate?: () => void;
  /** Contagem exibida no badge de Notificações (vem do layout server). */
  notificationCount?: number;
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
            <span className="flex-1">{item.label}</span>
            {item.showBadge && notificationCount > 0 && (
              <span
                aria-label={`${notificationCount} notificações`}
                className="flex size-5 items-center justify-center rounded-full bg-sidebar-primary font-mono text-[10px] font-bold text-sidebar-primary-foreground"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
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
