import { notFound } from "next/navigation";
import { CHECKOUT_ENABLED } from "@/lib/constants";

/** Carrinho, checkout e confirmação só existem no modo de venda pelo site. */
export default function CheckoutGroupLayout({ children }: { children: React.ReactNode }) {
  if (!CHECKOUT_ENABLED) notFound();
  return children;
}
