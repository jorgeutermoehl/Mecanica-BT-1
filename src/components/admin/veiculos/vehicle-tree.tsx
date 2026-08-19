"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { deactivateVehicleVersionAction } from "@/app/actions/admin";
import { FUEL_TYPE_LABEL, type FuelType } from "@/lib/validations";

/**
 * Árvore Marca→Modelo→Versão do catálogo de veículos, densa e expansível.
 * Dados chegam prontos do server (getVehicleTree) — aqui só expand/collapse
 * e a desativação (soft-delete) de versões com confirmação.
 */

export type TreeVersion = {
  id: string;
  name: string;
  yearStart: number;
  yearEnd: number | null;
  engine: string | null;
  fuel: FuelType | null;
  chassis: string | null;
  notes: string | null;
  applicationsCount: number;
};

export type TreeModel = { id: string; name: string; versions: TreeVersion[] };
export type TreeMake = { id: string; name: string; models: TreeModel[] };

function yearRange(v: TreeVersion): string {
  return v.yearEnd ? `${v.yearStart}–${v.yearEnd}` : `${v.yearStart}+`;
}

export function VehicleTree({ tree }: { tree: TreeMake[] }) {
  const router = useRouter();
  // Marcas começam expandidas (visão geral); modelos, recolhidos (densidade).
  const [openMakes, setOpenMakes] = React.useState<Set<string>>(
    () => new Set(tree.map((m) => m.id)),
  );
  const [openModels, setOpenModels] = React.useState<Set<string>>(new Set());
  const [toDeactivate, setToDeactivate] = React.useState<{
    version: TreeVersion;
    label: string;
  } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function handleDeactivate() {
    if (!toDeactivate) return;
    setSubmitting(true);
    const result = await deactivateVehicleVersionAction(toDeactivate.version.id);
    setSubmitting(false);
    if (result.ok) {
      toast.success("Versão desativada", {
        description: `${toDeactivate.label} saiu do catálogo (soft-delete).`,
      });
      setToDeactivate(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível desativar a versão.");
    }
  }

  return (
    <>
      <div className="divide-y divide-border">
        {tree.map((make) => {
          const makeOpen = openMakes.has(make.id);
          const versionsCount = make.models.reduce((n, m) => n + m.versions.length, 0);
          return (
            <div key={make.id}>
              {/* Marca */}
              <button
                type="button"
                aria-expanded={makeOpen}
                onClick={() => setOpenMakes((s) => toggle(s, make.id))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <ChevronRight
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    makeOpen && "rotate-90",
                  )}
                />
                <span className="font-display text-sm font-semibold uppercase tracking-wide">
                  {make.name}
                </span>
                <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                  {make.models.length} {make.models.length === 1 ? "modelo" : "modelos"} ·{" "}
                  {versionsCount} {versionsCount === 1 ? "versão" : "versões"}
                </span>
              </button>

              {/* Modelos */}
              {makeOpen &&
                make.models.map((model) => {
                  const modelOpen = openModels.has(model.id);
                  return (
                    <div key={model.id}>
                      <button
                        type="button"
                        aria-expanded={modelOpen}
                        onClick={() => setOpenModels((s) => toggle(s, model.id))}
                        className="flex w-full items-center gap-2 rounded-md py-2 pr-2 pl-8 text-left transition-colors hover:bg-muted/50"
                      >
                        <ChevronRight
                          aria-hidden
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform",
                            modelOpen && "rotate-90",
                          )}
                        />
                        <span className="text-sm font-medium">{model.name}</span>
                        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                          {model.versions.length}{" "}
                          {model.versions.length === 1 ? "versão" : "versões"}
                        </span>
                      </button>

                      {/* Versões */}
                      {modelOpen &&
                        (model.versions.length === 0 ? (
                          <p className="py-2 pr-2 pl-14 text-sm text-muted-foreground">
                            Nenhuma versão cadastrada nesse modelo.
                          </p>
                        ) : (
                          model.versions.map((v) => {
                            const label = `${make.name} ${model.name} ${v.name} ${yearRange(v)}`;
                            return (
                              <div
                                key={v.id}
                                className="flex items-center gap-3 rounded-md py-1 pr-2 pl-14 transition-colors hover:bg-muted/30"
                              >
                                <span className="truncate text-sm" title={v.notes ?? undefined}>
                                  {v.name}
                                </span>
                                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                  {yearRange(v)}
                                </span>
                                {v.engine ? (
                                  <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
                                    {v.engine}
                                  </span>
                                ) : null}
                                {v.fuel ? (
                                  <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
                                    {FUEL_TYPE_LABEL[v.fuel]}
                                  </span>
                                ) : null}
                                <span className="ml-auto flex shrink-0 items-center gap-2">
                                  {v.applicationsCount > 0 ? (
                                    <StatusBadge
                                      tone="info"
                                      className="font-mono tabular-nums"
                                    >
                                      {v.applicationsCount}{" "}
                                      {v.applicationsCount === 1 ? "aplicação" : "aplicações"}
                                    </StatusBadge>
                                  ) : null}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-destructive hover:text-destructive"
                                    aria-label={`Desativar versão ${label}`}
                                    onClick={() => setToDeactivate({ version: v, label })}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </span>
                              </div>
                            );
                          })
                        ))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Confirmação de desativação (soft-delete) */}
      <AlertDialog
        open={toDeactivate !== null}
        onOpenChange={(o) => {
          if (!o) setToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar versão?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDeactivate ? (
                <>
                  {toDeactivate.label} sairá do catálogo e das buscas de
                  compatibilidade.{" "}
                  {toDeactivate.version.applicationsCount > 0 ? (
                    <>
                      Ela tem{" "}
                      <span className="font-mono font-semibold tabular-nums">
                        {toDeactivate.version.applicationsCount}
                      </span>{" "}
                      {toDeactivate.version.applicationsCount === 1
                        ? "aplicação vinculada"
                        : "aplicações vinculadas"}{" "}
                      a produtos — os vínculos permanecem, mas deixam de aparecer na
                      loja.
                    </>
                  ) : (
                    "Ela não tem aplicações vinculadas a produtos."
                  )}{" "}
                  Nada é apagado (soft-delete).
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeactivate();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? "Desativando…" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
