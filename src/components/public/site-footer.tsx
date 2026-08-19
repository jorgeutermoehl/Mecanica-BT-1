import Link from "next/link";
import {
  Clock,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { SITE, whatsappLink } from "@/lib/constants";
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

const INSTITUTIONAL = [
  { label: "Produtos", href: "/produtos" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Contato", href: "/contato" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos de uso", href: "/termos" },
];

const CATEGORY_LINKS = [
  { label: "Turbo", href: "/produtos?categoria=turbo" },
  { label: "Rodas", href: "/produtos?categoria=rodas" },
  { label: "Freios", href: "/produtos?categoria=freios" },
  { label: "Suspensão", href: "/produtos?categoria=suspensao" },
  { label: "Escape", href: "/produtos?categoria=escape" },
  { label: "Acessórios", href: "/produtos?categoria=acessorios" },
];

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide">
      {children}
    </h3>
  );
}

export function SiteFooter() {
  return (
    // `.dark` mantém o rodapé escuro/premium em ambos os temas.
    <footer className="dark border-t border-border bg-background text-foreground">
      <div className="racing-rule" />
      <Container className="py-12">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1.1fr_1fr]">
          {/* Marca */}
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              {SITE.description}
            </p>
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

          {/* Institucional */}
          <nav aria-label="Institucional">
            <ColumnTitle>Institucional</ColumnTitle>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {INSTITUTIONAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categorias */}
          <nav aria-label="Categorias">
            <ColumnTitle>Categorias</ColumnTitle>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {CATEGORY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Atendimento */}
          <div>
            <ColumnTitle>Atendimento</ColumnTitle>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <MessageCircle className="size-4 shrink-0" aria-hidden />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <InstagramIcon className="size-4 shrink-0" aria-hidden />
                  @fullboostraceparts
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden />
                {SITE.phone}
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                {SITE.address}
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                {SITE.hours}
              </li>
            </ul>
          </div>

          {/* Pagamento */}
          <div>
            <ColumnTitle>Pagamento</ColumnTitle>
            <PaymentMethods />
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CreditCard className="size-4 shrink-0" aria-hidden />
                Até 10x sem juros
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
                Compra 100% segura
              </li>
            </ul>
          </div>
        </div>

        {/* Barra final */}
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name} · Todos os direitos
            reservados
          </p>
          <p className="font-mono tabular-nums">CNPJ 00.000.000/0001-00</p>
        </div>
      </Container>
    </footer>
  );
}
