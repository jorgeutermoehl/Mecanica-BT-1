import Link from "next/link";
import { Mail, MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { SITE } from "@/lib/constants";
import { PaymentMethods } from "@/components/public/metodos-pagamento";

/* Ícones de marca (lucide removeu os brand icons) */
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.6V13h2.8v8h3.1z" />
    </svg>
  );
}
function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

const SOCIAL = [
  { icon: InstagramIcon, href: SITE.social.instagram, label: "Instagram" },
  { icon: FacebookIcon, href: SITE.social.facebook, label: "Facebook" },
  { icon: YoutubeIcon, href: SITE.social.youtube, label: "YouTube" },
];

export function SiteFooter() {
  return (
    // `.dark` mantém o rodapé escuro/premium em ambos os temas.
    <footer className="dark border-t border-border bg-background text-foreground">
      <div className="racing-rule" />
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{SITE.description}</p>
            <div className="flex gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide">Loja</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/produtos" className="hover:text-foreground">Produtos</Link></li>
              <li><Link href="/promocoes" className="hover:text-foreground">Promoções</Link></li>
              <li><Link href="/carrinho" className="hover:text-foreground">Carrinho</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide">Institucional</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/contato" className="hover:text-foreground">Contato</Link></li>
              <li><Link href="/privacidade" className="hover:text-foreground">Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-foreground">Termos de uso</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide">Contato</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-primary" />{SITE.phone}</li>
              <li className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-primary" />{SITE.email}</li>
              <li className="flex items-start gap-2"><MapPin className="size-4 shrink-0 text-primary" />{SITE.address}</li>
              <li className="flex items-start gap-2"><Clock className="size-4 shrink-0 text-primary" />{SITE.hours}</li>
            </ul>
          </div>
        </div>

{/* Pagamentos e segurança */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <PaymentMethods />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            Compra 100% segura
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</p>
          <p>CNPJ 00.000.000/0001-00</p>
        </div>
      </Container>
    </footer>
  );
}
