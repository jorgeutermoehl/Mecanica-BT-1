import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { WhatsappButton } from "@/components/public/whatsapp-button";

/**
 * Layout da loja pública. Envolve tudo em `.dark` para aplicar o tema
 * escuro (preto como base), mantendo a área administrativa no tema claro.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsappButton />
    </div>
  );
}
