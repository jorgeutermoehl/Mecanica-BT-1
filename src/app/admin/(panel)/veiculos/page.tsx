import type { Metadata } from "next";
import Link from "next/link";
import { Car } from "lucide-react";
import { getVehicleTree, listPendingFitment } from "@/server/vehicles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { VehicleTree } from "@/components/admin/veiculos/vehicle-tree";
import {
  NewMakeDialog,
  NewModelDialog,
  NewVersionDialog,
} from "@/components/admin/veiculos/vehicle-dialogs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veículos",
};

export default async function VehiclesPage() {
  const [tree, pending] = await Promise.all([getVehicleTree(), listPendingFitment()]);

  const modelsCount = tree.reduce((n, make) => n + make.models.length, 0);
  const versionsCount = tree.reduce(
    (n, make) => n + make.models.reduce((m, model) => m + model.versions.length, 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Veículos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo Marca → Modelo → Versão usado na compatibilidade dos produtos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NewMakeDialog />
          <NewModelDialog makes={tree.map((m) => ({ id: m.id, name: m.name }))} />
          <NewVersionDialog
            makes={tree.map((m) => ({
              id: m.id,
              name: m.name,
              models: m.models.map((model) => ({ id: model.id, name: model.name })),
            }))}
          />
        </div>
      </div>

      {/* Árvore */}
      <Card>
        <CardContent>
          {tree.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Car className="size-6" />
              </span>
              <p className="font-display text-base font-semibold">
                Nenhum veículo cadastrado
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Comece cadastrando uma marca, depois modelos e versões — as versões é
                que são vinculadas aos produtos.
              </p>
            </div>
          ) : (
            <>
              <VehicleTree tree={tree} />
              <p className="mt-4 border-t-2 border-border pt-3 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tree.length} {tree.length === 1 ? "marca" : "marcas"} · {modelsCount}{" "}
                {modelsCount === 1 ? "modelo" : "modelos"} · {versionsCount}{" "}
                {versionsCount === 1 ? "versão" : "versões"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fitment legado pendente de revisão */}
      {pending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Fitment pendente
              <StatusBadge tone="warning" className="font-mono tabular-nums">
                {pending.length}
              </StatusBadge>
            </CardTitle>
            <CardDescription>
              Aplicações legadas sem versão vinculada — abra o produto e refaça o
              vínculo pela aba Compatibilidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Texto legado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/admin/produtos/${p.productId}`}
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {p.productName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.legacyText || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
