import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Search, Users } from "lucide-react";
import { listCustomers } from "@/server/customers";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChannelBadge } from "@/components/admin/channel-badge";
import { CustomerDialog } from "@/components/admin/customer-dialog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clientes",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || undefined;
  const customers = await listCustomers(query);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro de clientes com histórico de compras e canais de venda.
          </p>
        </div>
        <CustomerDialog />
      </div>

      {/* Busca (GET ?q=) */}
      <div className="flex flex-wrap items-center gap-3">
        <Form action="/admin/clientes" className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              name="q"
              defaultValue={query ?? ""}
              placeholder="Buscar por nome, e-mail ou documento…"
              className="w-full pl-9 sm:w-72"
              aria-label="Buscar clientes"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
          {query ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/clientes">Limpar busca</Link>
            </Button>
          ) : null}
        </Form>
        {query ? (
          <p className="text-sm text-muted-foreground">
            {customers.length}{" "}
            {customers.length === 1 ? "resultado" : "resultados"} para{" "}
            <span className="font-medium text-foreground">“{query}”</span>
          </p>
        ) : null}
      </div>

      <Card>
        <CardContent>
          {customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users className="size-6" />
              </span>
              <p className="font-display text-base font-semibold">
                {query ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {query
                  ? `Nada por “${query}”. Tente outro nome, e-mail ou documento.`
                  : "Cadastre o primeiro cliente pelo botão acima — compras pelo site criam o cadastro automaticamente."}
              </p>
              {query ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/clientes">Limpar busca</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Total comprado</TableHead>
                    <TableHead>Última compra</TableHead>
                    <TableHead>Canais</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="max-w-[240px]">
                          <p className="truncate font-medium" title={customer.name}>
                            {customer.name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {customer.document ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[240px]">
                          <p
                            className="truncate text-sm text-muted-foreground"
                            title={customer.email ?? undefined}
                          >
                            {customer.email ?? "—"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {customer.phone ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {customer.ordersCount}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {formatBRL(customer.totalSpent)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {customer.lastPurchaseAt
                          ? dateFormat.format(new Date(customer.lastPurchaseAt))
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {customer.channels.length === 0 ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {customer.channels.map((channel) => (
                              <ChannelBadge key={channel} channel={channel} />
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <p className="mt-4 border-t-2 border-border pt-3 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {customers.length} {customers.length === 1 ? "cliente" : "clientes"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
