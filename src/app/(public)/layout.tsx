import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { WhatsappButton } from "@/components/public/whatsapp-button";
import { CookieConsent } from "@/components/public/cookie-consent";
import { CartProvider } from "@/components/cart/cart-provider";

/** Layout da loja pública (tema controlado globalmente pelo next-themes). */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsappButton />
        <CookieConsent />
      </div>
    </CartProvider>
  );
}
