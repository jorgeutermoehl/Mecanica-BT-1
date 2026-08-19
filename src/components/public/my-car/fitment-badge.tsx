"use client";

import { BadgeCheck, MessageCircle, TriangleAlert } from "lucide-react";
import { useMyCar } from "@/components/public/my-car/my-car-provider";
import { productMatchesVehicle, type StoreProduct } from "@/types/store";
import { whatsappLink } from "@/lib/constants";

/**
 * Badge de compatibilidade da PDP: cruza o produto com o "Meu Carro" do
 * contexto. Sempre texto + cor (tokens success/warning), nunca só cor.
 */

export function FitmentBadge({ product }: { product: StoreProduct }) {
  const { car, hydrated } = useMyCar();

  // Política UNKNOWN (legado): não dá para afirmar nada — manda pro WhatsApp.
  if (product.fitmentType === "UNKNOWN") {
    return (
      <p className="mt-4 text-sm">
        <a
          href={whatsappLink(
            `Olá! Quero confirmar a compatibilidade da peça ${product.name} (SKU ${product.sku}) com o meu carro.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-medium text-warning underline underline-offset-4 hover:opacity-80"
        >
          <MessageCircle aria-hidden className="size-4 shrink-0" />
          Consulte compatibilidade pelo WhatsApp
        </a>
      </p>
    );
  }

  // Sem veículo selecionado (ou antes da hidratação) não há o que afirmar.
  if (!hydrated || !car) return null;

  const compatible = productMatchesVehicle(product, car.versionId);

  return compatible ? (
    <p className="mt-4 flex items-start gap-2 text-sm font-medium text-success">
      <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>
        Compatível com seu {car.label}
        {product.fitmentType === "UNIVERSAL" && " (peça universal)"}
      </span>
    </p>
  ) : (
    <p className="mt-4 flex items-start gap-2 text-sm font-medium text-warning">
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>Verifique a compatibilidade — não listamos seu {car.label} nas aplicações</span>
    </p>
  );
}
