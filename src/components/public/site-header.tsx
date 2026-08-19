"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, User } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/components/cart/cart-provider";
import { MyCarSelector } from "@/components/public/my-car/my-car-selector";
import { Button } from "@/components/ui/button";
import type { VehicleCatalog } from "@/server/catalog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PUBLIC_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader({ vehicles }: { vehicles: VehicleCatalog }) {
  const pathname = usePathname();
  const { count, hydrated } = useCart();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      {/* Fio de corrida no topo */}
      <div className="racing-rule" />
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Navegação principal" className="hidden items-center gap-0.5 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100",
                isActive(item.href) && "text-foreground after:scale-x-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">
              <User className="size-4" />
              Entrar
            </Link>
          </Button>
          <MyCarSelector vehicles={vehicles} />
          <Button asChild variant="ghost" size="icon">
            <Link
              href="/carrinho"
              aria-label={
                hydrated && count > 0
                  ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}`
                  : "Carrinho"
              }
              className="relative"
            >
              <ShoppingCart className="size-5" />
              {hydrated && count > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold leading-none text-primary-foreground"
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          </Button>

          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Menu do site" className="mt-2 flex flex-col gap-1 px-4">
                {PUBLIC_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      isActive(item.href) && "bg-accent text-accent-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="mt-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Entrar / Minha conta
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
