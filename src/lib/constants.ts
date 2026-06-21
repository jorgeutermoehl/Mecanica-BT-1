/**
 * Configuração central da loja. Valores sensíveis (telefone real, etc.)
 * podem ser sobrescritos por variáveis de ambiente em produção.
 */
export const SITE = {
  name: "Diógenes Auto Peças",
  shortName: "Diógenes",
  description:
    "Loja de peças mecânicas e componentes automotivos. Qualidade, garantia e entrega para todo o Brasil. Encontre a peça certa para o seu veículo.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Número no formato internacional, somente dígitos (ex.: 5547999999999)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5500000000000",
  email: "contato@diogenesautopecas.com.br",
  phone: "(00) 0000-0000",
  address: "Rua Example, 123 — Centro",
} as const;

/** Navegação principal da loja pública. */
export const PUBLIC_NAV = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
] as const;

/** Mensagem padrão ao abrir o WhatsApp. */
export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Vim pelo site e gostaria de tirar uma dúvida sobre peças.";

export function whatsappLink(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
