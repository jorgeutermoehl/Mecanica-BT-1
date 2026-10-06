import { notFound } from "next/navigation";
import { CHECKOUT_ENABLED } from "@/lib/constants";

/**
 * Gestão de vendas (pedidos, estoque, clientes, promoções, financeiro,
 * relatórios, mensagens). No modo WhatsApp o painel é só cadastro de produtos.
 */
export default function SalesManagementLayout({ children }: { children: React.ReactNode }) {
  if (!CHECKOUT_ENABLED) notFound();
  return children;
}
