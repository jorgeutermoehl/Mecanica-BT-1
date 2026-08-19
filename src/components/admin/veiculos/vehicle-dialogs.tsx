"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createVehicleMakeAction,
  createVehicleModelAction,
  createVehicleVersionAction,
} from "@/app/actions/admin";
import { FUEL_TYPES, FUEL_TYPE_LABEL, type FuelType } from "@/lib/validations";

/**
 * Dialogs de cadastro do catálogo de veículos (/admin/veiculos).
 * As listas de marcas/modelos chegam do server component (página força
 * dynamic), então não há fetch no client — só as mutações via actions.
 */

export type MakeOption = { id: string; name: string };
export type MakeWithModels = MakeOption & { models: { id: string; name: string }[] };

// ---------------------------------------------------------------------------
// Nova marca
// ---------------------------------------------------------------------------

export function NewMakeDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [name, setName] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createVehicleMakeAction({ name });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Marca cadastrada", {
        description: `${name.trim()} já está disponível para modelos e versões.`,
      });
      setOpen(false);
      setName("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível cadastrar a marca.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setName("");
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        Nova marca
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova marca</DialogTitle>
          <DialogDescription>
            Fabricante do veículo (ex.: Volkswagen, Chevrolet, Fiat).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="make-name">Nome da marca</Label>
            <Input
              id="make-name"
              required
              minLength={2}
              maxLength={60}
              placeholder="Ex.: Volkswagen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Cadastrando…" : "Cadastrar marca"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Novo modelo
// ---------------------------------------------------------------------------

export function NewModelDialog({ makes }: { makes: MakeOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [makeId, setMakeId] = React.useState("");
  const [name, setName] = React.useState("");

  function reset() {
    setMakeId("");
    setName("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createVehicleModelAction({ makeId, name });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Modelo cadastrado", {
        description: `${name.trim()} já pode receber versões.`,
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível cadastrar o modelo.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        Novo modelo
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo modelo</DialogTitle>
          <DialogDescription>
            Modelo dentro de uma marca (ex.: Golf, Onix, Uno).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="model-make">Marca</Label>
            <Select value={makeId} onValueChange={setMakeId} disabled={submitting}>
              <SelectTrigger id="model-make" className="w-full">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent position="popper">
                {makes.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {makes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma marca cadastrada — cadastre uma marca primeiro.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model-name">Nome do modelo</Label>
            <Input
              id="model-name"
              required
              maxLength={60}
              placeholder="Ex.: Golf"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || !makeId}>
              {submitting ? "Cadastrando…" : "Cadastrar modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Nova versão (ação primária da página)
// ---------------------------------------------------------------------------

export function NewVersionDialog({ makes }: { makes: MakeWithModels[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [makeId, setMakeId] = React.useState("");
  const [modelId, setModelId] = React.useState("");
  const [name, setName] = React.useState("");
  const [yearStart, setYearStart] = React.useState("");
  const [yearEnd, setYearEnd] = React.useState("");
  const [engine, setEngine] = React.useState("");
  const [fuel, setFuel] = React.useState<FuelType | "">("");
  const [chassis, setChassis] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const models = makes.find((m) => m.id === makeId)?.models ?? [];

  function reset() {
    setMakeId("");
    setModelId("");
    setName("");
    setYearStart("");
    setYearEnd("");
    setEngine("");
    setFuel("");
    setChassis("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createVehicleVersionAction({
      modelId,
      name,
      yearStart,
      yearEnd,
      engine,
      ...(fuel ? { fuel } : {}),
      chassis,
      notes,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Versão cadastrada", {
        description: `${name.trim()} já pode ser vinculada a produtos.`,
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível cadastrar a versão.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nova versão
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova versão</DialogTitle>
          <DialogDescription>
            Versão de um modelo com faixa de anos — é o nível vinculado aos produtos
            (ex.: GTI Mk7 2014–2019).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="version-make">Marca</Label>
              <Select
                value={makeId}
                onValueChange={(v) => {
                  setMakeId(v);
                  setModelId("");
                }}
                disabled={submitting}
              >
                <SelectTrigger id="version-make" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {makes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version-model">Modelo</Label>
              <Select
                value={modelId}
                onValueChange={setModelId}
                disabled={submitting || !makeId}
              >
                <SelectTrigger id="version-model" className="w-full">
                  <SelectValue placeholder={makeId ? "Selecione" : "Escolha a marca"} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {makeId && models.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Essa marca ainda não tem modelos.
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="version-name">Nome da versão</Label>
            <Input
              id="version-name"
              required
              maxLength={80}
              placeholder="Ex.: GTI Mk7"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="version-year-start">Ano inicial</Label>
              <Input
                id="version-year-start"
                type="number"
                required
                min={1950}
                max={2100}
                placeholder="2014"
                value={yearStart}
                onChange={(e) => setYearStart(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version-year-end">Ano final (opcional)</Label>
              <Input
                id="version-year-end"
                type="number"
                min={1950}
                max={2100}
                placeholder="Em linha"
                value={yearEnd}
                onChange={(e) => setYearEnd(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="version-engine">Motor (opcional)</Label>
              <Input
                id="version-engine"
                maxLength={60}
                placeholder="Ex.: 2.0 TSI EA888"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version-fuel">Combustível (opcional)</Label>
              <Select
                value={fuel}
                onValueChange={(v) => setFuel(v as FuelType)}
                disabled={submitting}
              >
                <SelectTrigger id="version-fuel" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FUEL_TYPE_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="version-chassis">Chassi/geração (opcional)</Label>
            <Input
              id="version-chassis"
              maxLength={40}
              placeholder="Ex.: Mk7 / 5G"
              value={chassis}
              onChange={(e) => setChassis(e.target.value)}
              disabled={submitting}
              className="font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="version-notes">Observações (opcional)</Label>
            <Textarea
              id="version-notes"
              rows={2}
              maxLength={300}
              placeholder="Detalhes de aplicação, restrições…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || !modelId}>
              {submitting ? "Cadastrando…" : "Cadastrar versão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
