"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { whatsappLink } from "@/lib/constants";
import type { StoreProduct } from "@/types/store";

export function ProductActions({ product }: { product: StoreProduct }) {
  const outOfStock = product.stock <= 0;
  const maxQty = Math.max(1, product.stock);
  const [qty, setQty] = useState(1);
  const { addProduct } = useCart();
  const router = useRouter();

  function changeQty(delta: number) {
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  }

  function addToCart() {
    if (outOfStock) return;
    addProduct(product, qty);
  }

  function buyNow() {
    if (outOfStock) return;
    addProduct(product, qty);
    router.push("/carrinho");
  }

  const waMessage = `Olá! Tenho interesse na peça ${product.name} (SKU ${product.sku}). Pode me ajudar com uma dúvida?`;

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Seletor de quantidade + adicionar ao carrinho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div
          className="flex items-center rounded-lg border border-border bg-card"
          role="group"
          aria-label="Selecionar quantidade"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => changeQty(-1)}
            disabled={outOfStock || qty <= 1}
            aria-label="Diminuir quantidade"
          >
            <Minus className="size-4" />
          </Button>
          <span
            className="w-10 text-center font-mono text-sm font-semibold tabular-nums"
            aria-live="polite"
            aria-label={`Quantidade: ${qty}`}
          >
            {qty}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => changeQty(1)}
            disabled={outOfStock || qty >= maxQty}
            aria-label="Aumentar quantidade"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={addToCart}
          disabled={outOfStock}
          className="h-11 flex-1 gap-2"
        >
          <ShoppingCart className="size-4" />
          {outOfStock ? "Produto indisponível" : "Adicionar ao carrinho"}
        </Button>
      </div>

      {/* Comprar agora + dúvida no WhatsApp */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          variant="secondary"
          onClick={buyNow}
          disabled={outOfStock}
          className="h-11 gap-2"
        >
          Comprar agora
        </Button>
        <Button asChild size="lg" variant="outline" className="h-11 gap-2">
          <a
            href={whatsappLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" />
            Tirar dúvida no WhatsApp
          </a>
        </Button>
      </div>

      {/* A linha de confiança (frete/garantia/segurança) fica na própria PDP. */}
    </div>
  );
}
