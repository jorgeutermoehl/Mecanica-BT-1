"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  addAllModelVersionsAction,
  addProductApplicationAction,
  copyProductApplicationsAction,
  getVehicleOptionsAction,
  removeProductApplicationAction,
} from "@/app/actions/admin";

/**
 * Editor de compatibilidade (fitment) do produto: cascata Marca→Modelo→Versão,
 * aplicações vinculadas e ações em lote. Opções carregadas sob demanda via
 * getVehicleOptionsAction; toda mutação passa pelas actions + router.refresh().
 */

type Option = { id: string; label: string };

export type FitmentApplication = {
  id: string;
  label: string;
  pending: boolean;
  yearStart: number | null;
  yearEnd: number | null;
  engine: string | null;
  notes: string | null;
};

function appYears(app: FitmentApplication): string {
  if (app.yearStart && app.yearEnd) return `${app.yearStart}–${app.yearEnd}`;
  if (app.yearStart) return `${app.yearStart}+`;
  return "—";
}

export function FitmentEditor({
  productId,
  applications,
  products,
}: {
  productId: string;
  applications: FitmentApplication[];
  /** Produtos (exceto o atual) para "copiar aplicações de outro produto". */
  products: Option[];
}) {
  const router = useRouter();

  // Cascata Marca→Modelo→Versão
  const [makes, setMakes] = React.useState<Option[]>([]);
  const [models, setModels] = React.useState<Option[]>([]);
  const [versions, setVersions] = React.useState<Option[]>([]);
  const [makeId, setMakeId] = React.useState("");
  const [modelId, setModelId] = React.useState("");
  const [versionId, setVersionId] = React.useState("");
  const [loadingLevel, setLoadingLevel] = React.useState<"models" | "versions" | null>(null);
  /** Anúncio para leitores de tela quando uma etapa da cascata carrega. */
  const [liveMessage, setLiveMessage] = React.useState("");
  const modelTriggerRef = React.useRef<HTMLButtonElement>(null);
  const versionTriggerRef = React.useRef<HTMLButtonElement>(null);
  /**
   * Foco programático adiado para depois do commit do React: no instante em que
   * as opções chegam, o select seguinte ainda está desabilitado no DOM — focar
   * direto no handler seria um no-op.
   */
  const [pendingFocus, setPendingFocus] = React.useState<{
    target: "model" | "version";
  } | null>(null);

  React.useEffect(() => {
    if (!pendingFocus) return;
    const ref = pendingFocus.target === "model" ? modelTriggerRef : versionTriggerRef;
    ref.current?.focus();
  }, [pendingFocus]);

  // Campos opcionais da aplicação
  const [yearStart, setYearStart] = React.useState("");
  const [yearEnd, setYearEnd] = React.useState("");
  const [engine, setEngine] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  // Remoção com confirmação
  const [toRemove, setToRemove] = React.useState<FitmentApplication | null>(null);
  const [removing, setRemoving] = React.useState(false);

  // Ações em lote
  const [copyFrom, setCopyFrom] = React.useState("");
  const [copying, setCopying] = React.useState(false);
  const [addingAll, setAddingAll] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getVehicleOptionsAction("makes");
      if (!cancelled && result.ok && result.options) setMakes(result.options);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMakeChange(id: string) {
    setMakeId(id);
    setModelId("");
    setVersionId("");
    setModels([]);
    setVersions([]);
    setLoadingLevel("models");
    const result = await getVehicleOptionsAction("models", id);
    setLoadingLevel(null);
    if (result.ok && result.options) {
      setModels(result.options);
      setLiveMessage(
        `${result.options.length} ${result.options.length === 1 ? "modelo carregado" : "modelos carregados"}`,
      );
      // A11y: confirmou a marca → foco segue para o próximo select da cascata.
      setPendingFocus({ target: "model" });
    } else {
      toast.error(result.error ?? "Não foi possível carregar os modelos.");
    }
  }

  async function handleModelChange(id: string) {
    setModelId(id);
    setVersionId("");
    setVersions([]);
    setLoadingLevel("versions");
    const result = await getVehicleOptionsAction("versions", id);
    setLoadingLevel(null);
    if (result.ok && result.options) {
      setVersions(result.options);
      setLiveMessage(
        `${result.options.length} ${result.options.length === 1 ? "versão carregada" : "versões carregadas"}`,
      );
      setPendingFocus({ target: "version" });
    } else {
      toast.error(result.error ?? "Não foi possível carregar as versões.");
    }
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!versionId) return;
    setAdding(true);
    const result = await addProductApplicationAction({
      productId,
      vehicleVersionId: versionId,
      yearStart,
      yearEnd,
      engine,
      notes,
    });
    setAdding(false);
    if (result.ok) {
      toast.success("Aplicação adicionada", {
        description: versions.find((v) => v.id === versionId)?.label,
      });
      // Mantém marca/modelo para vincular outras versões em sequência.
      setVersionId("");
      setYearStart("");
      setYearEnd("");
      setEngine("");
      setNotes("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível adicionar a aplicação.");
    }
  }

  async function handleRemove() {
    if (!toRemove) return;
    setRemoving(true);
    const result = await removeProductApplicationAction(toRemove.id);
    setRemoving(false);
    if (result.ok) {
      toast.success("Aplicação removida", { description: toRemove.label });
      setToRemove(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível remover a aplicação.");
    }
  }

  async function handleCopy() {
    if (!copyFrom) return;
    setCopying(true);
    const result = await copyProductApplicationsAction(copyFrom, productId);
    setCopying(false);
    if (result.ok) {
      const n = result.copied ?? 0;
      toast.success("Aplicações copiadas", {
        description: `${n} ${n === 1 ? "aplicação copiada" : "aplicações copiadas"} do produto de origem.`,
      });
      setCopyFrom("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível copiar as aplicações.");
    }
  }

  async function handleAddAllVersions() {
    if (!modelId) return;
    setAddingAll(true);
    const result = await addAllModelVersionsAction(productId, modelId);
    setAddingAll(false);
    if (result.ok) {
      const n = result.added ?? 0;
      toast.success("Versões vinculadas em lote", {
        description: `${n} ${n === 1 ? "versão vinculada" : "versões vinculadas"} ao produto.`,
      });
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível vincular as versões.");
    }
  }

  const selectedModelLabel = models.find((m) => m.id === modelId)?.label;

  return (
    <div className="space-y-4">
      {/* Anúncio de carregamento da cascata (a11y) */}
      <p aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </p>

      {/* Nova aplicação */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar aplicação</CardTitle>
          <CardDescription>
            Escolha a versão do veículo na cascata — os campos de ano/motor refinam a
            aplicação quando ela não vale para a versão inteira.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="fitment-make">Marca</Label>
                <Select
                  value={makeId}
                  onValueChange={handleMakeChange}
                  disabled={adding}
                >
                  <SelectTrigger id="fitment-make" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {makes.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fitment-model">Modelo</Label>
                <Select
                  value={modelId}
                  onValueChange={handleModelChange}
                  disabled={adding || !makeId || loadingLevel === "models"}
                >
                  <SelectTrigger
                    id="fitment-model"
                    ref={modelTriggerRef}
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={
                        loadingLevel === "models"
                          ? "Carregando…"
                          : makeId
                            ? "Selecione"
                            : "Escolha a marca"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fitment-version">Versão</Label>
                <Select
                  value={versionId}
                  onValueChange={setVersionId}
                  disabled={adding || !modelId || loadingLevel === "versions"}
                >
                  <SelectTrigger
                    id="fitment-version"
                    ref={versionTriggerRef}
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={
                        loadingLevel === "versions"
                          ? "Carregando…"
                          : modelId
                            ? "Selecione"
                            : "Escolha o modelo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="fitment-year-start">Ano inicial (opcional)</Label>
                <Input
                  id="fitment-year-start"
                  type="number"
                  min={1950}
                  max={2100}
                  placeholder="—"
                  value={yearStart}
                  onChange={(e) => setYearStart(e.target.value)}
                  disabled={adding}
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fitment-year-end">Ano final (opcional)</Label>
                <Input
                  id="fitment-year-end"
                  type="number"
                  min={1950}
                  max={2100}
                  placeholder="—"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(e.target.value)}
                  disabled={adding}
                  className="font-mono"
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="fitment-engine">Motor (opcional)</Label>
                <Input
                  id="fitment-engine"
                  maxLength={60}
                  placeholder="Ex.: 2.0 TSI EA888"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  disabled={adding}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fitment-notes">Observações (opcional)</Label>
              <Input
                id="fitment-notes"
                maxLength={300}
                placeholder="Ex.: somente câmbio manual"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="gap-2" disabled={adding || !versionId}>
                <Plus className="size-4" />
                {adding ? "Adicionando…" : "Adicionar aplicação"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Aplicações vinculadas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Aplicações vinculadas{" "}
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              ({applications.length})
            </span>
          </CardTitle>
          <CardDescription>
            Veículos em que este produto se aplica — é o que a loja mostra na busca
            por compatibilidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma aplicação vinculada — adicione acima ou use as ações em lote.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Anos</TableHead>
                    <TableHead>Motor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <p className="max-w-[320px] truncate font-medium" title={app.label}>
                          {app.label}
                        </p>
                        {app.notes ? (
                          <p className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {app.notes}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        {appYears(app)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {app.engine ?? "—"}
                      </TableCell>
                      <TableCell>
                        {app.pending ? (
                          <StatusBadge tone="warning">Fitment pendente</StatusBadge>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          aria-label={`Remover aplicação ${app.label}`}
                          onClick={() => setToRemove(app)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações em lote */}
      <Card>
        <CardHeader>
          <CardTitle>Ações em lote</CardTitle>
          <CardDescription>
            Atalhos para famílias de peças que compartilham a mesma compatibilidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor="fitment-copy-from">
                Copiar aplicações de outro produto
              </Label>
              <div className="flex flex-wrap gap-2">
                <Select value={copyFrom} onValueChange={setCopyFrom} disabled={copying}>
                  <SelectTrigger id="fitment-copy-from" className="w-full sm:flex-1">
                    <SelectValue placeholder="Produto de origem" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={copying || !copyFrom}
                  onClick={() => void handleCopy()}
                >
                  <Copy className="size-4" />
                  {copying ? "Copiando…" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Duplicadas são ignoradas — só entram os veículos que ainda não estão
                vinculados.
              </p>
            </div>
            <div className="grid content-start gap-2">
              <p className="text-sm font-medium">Adicionar todas as versões do modelo</p>
              <Button
                type="button"
                variant="outline"
                className="w-fit gap-2"
                disabled={addingAll || !modelId}
                onClick={() => void handleAddAllVersions()}
              >
                <Layers className="size-4" />
                {addingAll
                  ? "Vinculando…"
                  : selectedModelLabel
                    ? `Vincular todas as versões de ${selectedModelLabel}`
                    : "Vincular todas as versões"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Usa a marca e o modelo selecionados na cascata acima — escolha-os
                primeiro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmação de remoção */}
      <AlertDialog
        open={toRemove !== null}
        onOpenChange={(o) => {
          if (!o) setToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover aplicação?</AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove
                ? `${toRemove.label} deixará de aparecer como compatível com este produto. A remoção fica registrada na auditoria.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {removing ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
