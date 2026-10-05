/**
 * Configuração central da loja FullBoost Race Parts.
 * Valores sensíveis podem ser sobrescritos por variáveis de ambiente.
 */
export const SITE = {
  name: "FullBoost Race Parts",
  shortName: "FullBoost",
  tagline: "Race Parts",
  description:
    "Coroa e pinhão, virabrequins e gaiolas (rollcage) para rua e pista. Peças de transmissão, motor e segurança com envio para todo o Brasil.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Número no formato internacional, somente dígitos (ex.: 5547999999999)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5500000000000",
  // Dados de contato OPCIONAIS: vazios = o bloco some do site (nada de
  // placeholder publicado). Sem CNPJ por enquanto — loja-modelo.
  email: optional(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  phone: optional(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  hours: optional(process.env.NEXT_PUBLIC_BUSINESS_HOURS),
  address: optional(process.env.NEXT_PUBLIC_ADDRESS),
  /**
   * Identificação do vendedor (Decreto 7.962/2013 exige nome e CPF OU CNPJ
   * visíveis em loja online). Opcional na fase modelo; exibido no rodapé
   * e nos termos quando configurado.
   */
  legalName: optional(process.env.NEXT_PUBLIC_LEGAL_NAME),
  legalDocument: optional(process.env.NEXT_PUBLIC_LEGAL_DOCUMENT),
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/fullboostraceparts",
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "@fullboostraceparts",
    facebook: optional(process.env.NEXT_PUBLIC_FACEBOOK_URL),
    youtube: optional(process.env.NEXT_PUBLIC_YOUTUBE_URL),
  },
} as const;

/**
 * Regras comerciais anunciadas no site — UMA fonte para vitrine, carrinho,
 * checkout e servidor (o texto nunca promete algo diferente do cálculo).
 * NEXT_PUBLIC_FREE_SHIPPING_FROM=0 desliga o frete grátis;
 * NEXT_PUBLIC_MAX_INSTALLMENTS=1 esconde o parcelamento.
 */
export const COMMERCE = {
  freeShippingFrom: numberEnv(process.env.NEXT_PUBLIC_FREE_SHIPPING_FROM, 599),
  flatShipping: numberEnv(process.env.NEXT_PUBLIC_FLAT_SHIPPING, 34.9),
  maxInstallments: Math.max(1, Math.floor(numberEnv(process.env.NEXT_PUBLIC_MAX_INSTALLMENTS, 10))),
} as const;

/** Frete do pedido pela regra simples (fixo, grátis acima do limite). */
export function shippingFor(subtotal: number): number {
  return COMMERCE.freeShippingFrom > 0 && subtotal >= COMMERCE.freeShippingFrom ? 0 : COMMERCE.flatShipping;
}

function optional(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function numberEnv(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

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
