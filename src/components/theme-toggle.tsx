"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  // Antes de montar, servidor e cliente renderizam o MESMO conteúdo neutro,
  // evitando o mismatch de hidratação. Depois de montar, mostra o estado real.
  const label = mounted
    ? isDark
      ? "Ativar tema claro"
      : "Ativar tema escuro"
    : "Alternar tema";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5" />
      )}
    </Button>
  );
}
