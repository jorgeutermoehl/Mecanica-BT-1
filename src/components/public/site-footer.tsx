import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { SITE } from "@/lib/constants";

const TRUST = [
  { icon: Truck, label: "Entrega para todo o Brasil" },
  { icon: ShieldCheck, label: "Garantia em todas as peças" },
  { icon: CreditCard, label: "Pagamento 100% seguro" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card">
      <Container className="py-12">
        {/* Bloco de confiança */}
        <div className="grid gap-4 border-b border-border/60 pb-8 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-8 py-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <Logo />
            <p className="text-sm text-muted-foreground">{SITE.description}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Loja</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/catalogo" className="hover:text-foreground">Catálogo</Link></li>
              <li><Link href="/promocoes" className="hover:text-foreground">Promoções</Link></li>
              <li><Link href="/carrinho" className="hover:text-foreground">Carrinho</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Institucional</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sobre" className="hover:text-foreground">Sobre nós</Link></li>
              <li><Link href="/contato" className="hover:text-foreground">Fale conosco</Link></li>
              <li><Link href="/privacidade" className="hover:text-foreground">Política de Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Contato</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="size-4 shrink-0" />{SITE.phone}</li>
              <li className="flex items-center gap-2"><Mail className="size-4 shrink-0" />{SITE.email}</li>
              <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0" />{SITE.address}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</p>
          <p>CNPJ 00.000.000/0001-00</p>
        </div>
      </Container>
    </footer>
  );
}
