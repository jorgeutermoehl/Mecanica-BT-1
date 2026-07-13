"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injeta um <script> anti-FOUC dentro de um Client Component.
// React 19 / Next 16.2 emite um erro de console para qualquer <script>
// renderizado no client — é falso positivo: o script roda no SSR e o tema
// funciona. Como o next-themes está sem manutenção, silenciamos SÓ esse erro.
if (typeof window !== "undefined") {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    original(...args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}