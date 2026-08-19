import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { WhatsappButton } from "@/components/public/whatsapp-button";
import { CookieConsent } from "@/components/public/cookie-consent";
import { CartProvider } from "@/components/cart/cart-provider";
import { MyCarProvider } from "@/components/public/my-car/my-car-provider";
import { getVehicleCatalog } from "@/server/catalog";

/** Layout da loja pública (tema controlado globalmente pelo next-themes). */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Árvore de veículos do seletor "Meu Carro" (cacheada por tag "catalog").
  const vehicles = await getVehicleCatalog();

  return (
    <CartProvider>
      <MyCarProvider>
        <div className="flex min-h-screen flex-col">
          <SiteHeader vehicles={vehicles} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <WhatsappButton />
          <CookieConsent />
        </div>
      </MyCarProvider>
    </CartProvider>
  );
}
