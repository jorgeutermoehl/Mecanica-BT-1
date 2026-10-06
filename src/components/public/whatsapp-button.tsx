"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Botão flutuante de contato via WhatsApp, fixo no canto inferior direito.
 * Na página da peça, no celular, cede lugar à barra fixa de compra.
 */
export function WhatsappButton() {
  const pathname = usePathname();
  const onProductPage = pathname.startsWith("/produtos/");
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        onProductPage && "max-lg:hidden",
      )}
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Fale conosco</span>
    </a>
  );
}

/**
 * Espaço no fim da página da peça (celular) para a barra fixa de compra não
 * cobrir o rodapé. Fica depois do rodapé no layout.
 */
export function StickyBarSpacer() {
  const pathname = usePathname();
  if (!pathname.startsWith("/produtos/")) return null;
  return <div aria-hidden className="h-[76px] lg:hidden" />;
}
