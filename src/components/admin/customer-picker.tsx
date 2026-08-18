"use client";

import * as React from "react";
import { Check, Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CustomerOption } from "@/server/customers";

/**
 * Lupa de cliente: pesquisa entre os cadastrados e seleciona — ou oferece o
 * cadastro rápido do nome digitado. Evita redigitar o mesmo cliente a cada
 * venda: cadastrou uma vez, depois é só buscar.
 *
 * Valor emitido: { customerId } quando selecionou um existente,
 * { customerName } quando vai cadastrar um novo na hora.
 */
export function CustomerPicker({
  customers,
  value,
  onChange,
  disabled,
}: {
  customers: CustomerOption[];
  value: { customerId: string; customerName: string };
  onChange: (v: { customerId: string; customerName: string }) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value.customerId) ?? null;

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 6);
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)).slice(0, 6);
  }, [customers, query]);

  // Fecha a lista ao clicar fora.
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(c: CustomerOption) {
    onChange({ customerId: c.id, customerName: "" });
    setQuery("");
    setOpen(false);
  }

  function pickNew() {
    onChange({ customerId: "", customerName: query.trim() });
    setOpen(false);
  }

  function clear() {
    onChange({ customerId: "", customerName: "" });
    setQuery("");
  }

  // Estado "selecionado": mostra chip com X para trocar.
  if (selected || value.customerName) {
    return (
      <div className="flex h-9 items-center justify-between gap-2 rounded-lg border border-input bg-muted/30 px-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          {selected ? (
            <Check className="size-3.5 shrink-0 text-success" aria-hidden />
          ) : (
            <UserPlus className="size-3.5 shrink-0 text-primary" aria-hidden />
          )}
          <span className="truncate">
            {selected ? selected.name : `Novo cliente: ${value.customerName}`}
          </span>
          {selected?.hint ? (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{selected.hint}</span>
          ) : null}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          aria-label="Trocar cliente"
          disabled={disabled}
          onClick={clear}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={query}
        disabled={disabled}
        placeholder="Buscar cliente por nome ou telefone..."
        className="pl-8"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        aria-label="Buscar cliente"
        aria-expanded={open}
        role="combobox"
        aria-controls="customer-picker-list"
      />
      {open ? (
        <div
          id="customer-picker-list"
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => pick(c)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            >
              <span className="truncate">{c.name}</span>
              {c.hint ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.hint}</span> : null}
            </button>
          ))}
          {results.length === 0 && !query.trim() ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
          ) : null}
          {query.trim() ? (
            <button
              type="button"
              onClick={pickNew}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
              <UserPlus className="size-4" aria-hidden />
              Cadastrar novo cliente: “{query.trim()}”
            </button>
          ) : (
            <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
              Digite para buscar — ou para cadastrar um novo na hora.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
