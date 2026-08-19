"use client";

import * as React from "react";
import type { MyCar } from "@/types/store";

/**
 * "Meu Carro": veículo escolhido pelo cliente, em contexto + persistência.
 * Grava em localStorage (fonte da verdade no client) E em cookie "myCar"
 * (JSON via encodeURIComponent) para permitir SSR sem flash no futuro.
 */

const STORAGE_KEY = "fullboost.myCar";
const COOKIE_NAME = "myCar";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

type MyCarContextValue = {
  car: MyCar | null;
  hydrated: boolean;
  setCar: (car: MyCar) => void;
  clearCar: () => void;
};

const MyCarContext = React.createContext<MyCarContextValue | null>(null);

function isMyCar(value: unknown): value is MyCar {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.versionId === "string" && typeof v.label === "string";
}

function writeCookie(car: MyCar | null) {
  try {
    document.cookie = car
      ? `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(car))}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
      : `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // cookies indisponíveis — segue só com localStorage/memória
  }
}

export function MyCarProvider({ children }: { children: React.ReactNode }) {
  const [car, setCarState] = React.useState<MyCar | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  // Hidratação segura: só lê storage no client, depois do primeiro render.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isMyCar(parsed)) setCarState(parsed);
      }
    } catch {
      // storage corrompido/indisponível → começa sem veículo
    }
    setHydrated(true);
  }, []);

  const setCar = React.useCallback((next: MyCar) => {
    setCarState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage cheio/indisponível — seleção segue em memória
    }
    writeCookie(next);
  }, []);

  const clearCar = React.useCallback(() => {
    setCarState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage indisponível — nada a remover
    }
    writeCookie(null);
  }, []);

  const value = React.useMemo<MyCarContextValue>(
    () => ({ car, hydrated, setCar, clearCar }),
    [car, hydrated, setCar, clearCar],
  );

  return <MyCarContext.Provider value={value}>{children}</MyCarContext.Provider>;
}

export function useMyCar(): MyCarContextValue {
  const ctx = React.useContext(MyCarContext);
  if (!ctx) throw new Error("useMyCar deve ser usado dentro de <MyCarProvider>");
  return ctx;
}
