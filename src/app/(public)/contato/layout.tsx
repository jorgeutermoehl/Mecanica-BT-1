import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com um especialista da FullBoost Race Parts. Tire dúvidas de compatibilidade, potência e instalação.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
