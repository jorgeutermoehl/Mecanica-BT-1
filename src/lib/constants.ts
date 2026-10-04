/**
 * Configuração central da loja FullBoost Race Parts.
 * Valores sensíveis podem ser sobrescritos por variáveis de ambiente.
 */
export const SITE = {
  name: "FullBoost Race Parts",
  shortName: "FullBoost",
  tagline: "Race Parts",
  description:
    "Coroa e pinhão, virabrequins e gaiolas (rollcage) para rua e pista. Peças de transmissão, motor e segurança com nota fiscal e entrega para todo o Brasil.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Número no formato internacional, somente dígitos (ex.: 5547999999999)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5500000000000",
  email: "contato@fullboostraceparts.com.br",
  phone: "(00) 0000-0000",
  hours: "Seg a Sex, 8h às 18h · Sáb, 8h às 12h",
  address: "Av. das Oficinas, 1000 — Centro",
  social: {
    instagram: "https://instagram.com/fullboostraceparts",
    facebook: "https://facebook.com/fullboostraceparts",
    youtube: "https://youtube.com/@fullboostraceparts",
  },
} as const;

/** Navegação principal da loja pública. */
export const PUBLIC_NAV = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "/produtos" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Contato", href: "/contato" },
] as const;

/**
 * Linhas de produto que a loja trabalha hoje (vitrine institucional).
 * Ao anunciar uma linha nova, acrescente aqui — as categorias da loja já
 * aparecem sozinhas quando recebem o primeiro produto.
 */
export const SPECIALTIES = [
  "Coroa e pinhão",
  "Virabrequim",
  "Gaiola / Rollcage",
  "Transmissão",
  "Motor a ar",
  "Rua & pista",
] as const;

/** Mensagem padrão ao abrir o WhatsApp. */
export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Vim pelo site da FullBoost e gostaria de falar com um especialista.";

export function whatsappLink(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
