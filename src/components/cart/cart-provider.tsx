"use client";

import * as React from "react";
import { toast } from "sonner";
import type { CartItem, StoreProduct } from "@/types/store";

/**
 * Carrinho da loja: estado em contexto + persistência em localStorage.
 * Os preços exibidos aqui são informativos — o checkout SEMPRE recalcula
 * preços e estoque no servidor (placeOrderAction).
 */

const STORAGE_KEY = "fb-cart-v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addProduct: (product: StoreProduct, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

/*
 * Store externo (localStorage) lido via useSyncExternalStore: sem setState em
 * effect, sem mismatch de hidratação (servidor sempre vê carrinho vazio) e
 * sincronizado entre abas pelo evento "storage".
 */
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function readItems(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return cache.items; // storage indisponível — segue em memória
  }
  if (raw === cache.raw) return cache.items;
  let items: CartItem[] = EMPTY;
  try {
    items = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
  } catch {
    items = EMPTY; // storage corrompido → começa vazio
  }
  cache = { raw, items };
  return items;
}

function writeItems(items: CartItem[]) {
  const raw = JSON.stringify(items);
  cache = { raw, items };
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // storage cheio/indisponível — carrinho segue em memória
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = React.useSyncExternalStore(subscribe, readItems, () => EMPTY);
  // true só no client após hidratar (servidor/hidratação = false).
  const hydrated = React.useSyncExternalStore(noopSubscribe, () => true, () => false);

  const setItems = React.useCallback((update: (prev: CartItem[]) => CartItem[]) => {
    const prev = readItems();
    const next = update(prev);
    if (next !== prev) writeItems(next);
  }, []);

  const addProduct = React.useCallback((product: StoreProduct, quantity = 1) => {
    if (product.stock <= 0) {
      toast.error("Produto esgotado", { description: product.name });
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const nextQty = Math.min((existing?.quantity ?? 0) + quantity, product.stock, 99);
      if (existing && nextQty === existing.quantity) {
        toast.warning("Limite de estoque atingido", { description: product.name });
        return prev;
      }
      toast.success("Adicionado ao carrinho", { description: product.name });
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: nextQty } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          icon: product.icon,
          image: product.image,
          price: product.promoPrice ?? product.price,
          fullPrice: product.price,
          stock: product.stock,
          quantity: nextQty,
        },
      ];
    });
  }, [setItems]);

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock, 99)) } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, [setItems]);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, [setItems]);

  const clear = React.useCallback(() => setItems(() => EMPTY), [setItems]);

  const value = React.useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, hydrated, addProduct, updateQuantity, removeItem, clear };
  }, [items, hydrated, addProduct, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
