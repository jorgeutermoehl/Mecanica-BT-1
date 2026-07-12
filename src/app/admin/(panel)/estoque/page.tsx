import type { Metadata } from "next";
import { ArrowDownToLine, ArrowUpFromLine, Info } from "lucide-react";
import { listMovements, listProductOptions, type MovementRow } from "@/server/inventory";
import { MOVEMENT_TYPE_LABEL, type MovementType } from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockDialogs } from "@/components/admin/stock-dialogs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estoque",
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function movementLabel(type: string): string {
  return MOVEMENT_TYPE_LABEL[type as MovementType] ?? type;
}

function MovementBadge({ movement }: { movement: MovementRow }) {
  const isIn = movement.direction === "IN";
  const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isIn
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <Icon aria-hidden />
      {movementLabel(movement.type)}
    </Badge>
  );
}

export default async function EstoquePage() {
  const [movements, products] = await Promise.all([listMovements(), listProductOptions()]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho + ações */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Estoque
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Movimentações de entrada, saída e ajuste — o histórico completo do seu inventário.
          </p>
        </div>
        <StockDialogs products={products} />
      </div>

      {/* Banner: livro-razão append-only */}
      <div className="flex items-center gap-2.5 rounded-lg border border-info/30 bg-info/5 px-4 py-2.5 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0 text-info" aria-hidden />
        <p>
          Movimentações são permanentes — correções geram lançamento de ajuste.
        </p>
      </div>

      {/* Tabela de movimentações */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Data/hora</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="text-right">Custo unit.</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  Nenhuma movimentação registrada ainda. Use “Registrar entrada” para dar
                  entrada nas primeiras peças.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => {
                const isIn = m.direction === "IN";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {dateTimeFormat.format(new Date(m.createdAt))}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px]">
                        <p className="truncate text-sm font-medium" title={m.productName}>
                          {m.productName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{m.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MovementBadge movement={m} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-sm font-semibold",
                        isIn ? "text-success" : "text-destructive",
                      )}
                    >
                      {isIn ? "+" : "−"}
                      {m.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatBRL(m.unitCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <span className="text-muted-foreground">{m.balanceBefore}</span>
                      <span aria-hidden className="px-1 text-muted-foreground/60">→</span>
                      <span className="font-semibold">{m.balanceAfter}</span>
                    </TableCell>
                    <TableCell>
                      <p
                        className="max-w-[240px] truncate text-sm text-muted-foreground"
                        title={m.reason ?? undefined}
                      >
                        {m.reason ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.userName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.orderNumber ?? <span className="text-muted-foreground/60">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {movements.length > 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          Exibindo as {movements.length} movimentações mais recentes.
        </p>
      ) : null}
    </div>
  );
}
