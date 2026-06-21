import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/constants";

/** Botão flutuante de contato via WhatsApp, fixo no canto inferior direito. */
export function WhatsappButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Fale conosco</span>
    </a>
  );
}
