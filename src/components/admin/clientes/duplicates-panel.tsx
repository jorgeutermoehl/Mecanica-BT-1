"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { findDuplicatesAction } from "@/app/actions/admin";
import { formatBRL } from "@/lib/format";

type Duplicate = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  ordersCount: number;
  totalSpent: number;
};

/**
 * "Buscar duplicados" SÓ sob demanda (ESPEC-V2): compara apenas documento,
 * e-mail e telefone normalizados — nunca similaridade de nome, nunca a cada render.
 */
export function DuplicatesPanel({ customerId }: { customerId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Duplicate[] | null>(null);

  async function search() {
    setLoading(true);
    const r = await findDuplicatesAction(customerId);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error ?? "Não foi possível buscar duplicados.");
      return;
    }
    setResult(r.duplicates ?? []);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Possíveis duplicados</p>
          <p className="text-xs text-muted-foreground">
            Compara documento, e-mail e telefone — não roda sozinho, só quando você pedir.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={search} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
          Buscar duplicados
        </Button>
      </div>

      {result !== null ? (
        result.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-success">
            <UserCheck className="size-4" />
            Nenhum duplicado pelos identificadores fortes.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {result.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/clientes/${d.id}`}
                    className="truncate text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {d.name}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">
                    {[d.document, d.email, d.phone].filter(Boolean).join(" · ") || "sem contatos"}
                  </p>
                </div>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  {d.ordersCount} {d.ordersCount === 1 ? "pedido" : "pedidos"} ·{" "}
                  {formatBRL(d.totalSpent)}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
