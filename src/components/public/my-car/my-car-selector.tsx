"use client";

import * as React from "react";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyCar } from "@/components/public/my-car/my-car-provider";
import type { VehicleCatalog } from "@/server/catalog";

/**
 * Seletor "Meu Carro" do header: chip com o veículo atual + Dialog com a
 * cascata Marca → Modelo → Versão. Os dados chegam prontos por prop
 * (getVehicleCatalog no layout) — sem fetch no client.
 */

type MyCarSelectorProps = {
  vehicles: VehicleCatalog;
};

export function MyCarSelector({ vehicles }: MyCarSelectorProps) {
  const { car, hydrated, setCar, clearCar } = useMyCar();

  const [open, setOpen] = React.useState(false);
  const [makeId, setMakeId] = React.useState("");
  const [modelId, setModelId] = React.useState("");
  const [versionId, setVersionId] = React.useState("");

  const make = vehicles.find((m) => m.id === makeId);
  const model = make?.models.find((m) => m.id === modelId);
  const version = model?.versions.find((v) => v.id === versionId);

  // Ao abrir com um carro já salvo, pré-seleciona a cascata correspondente.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    if (car) {
      for (const mk of vehicles) {
        for (const md of mk.models) {
          if (md.versions.some((v) => v.id === car.versionId)) {
            setMakeId(mk.id);
            setModelId(md.id);
            setVersionId(car.versionId);
            return;
          }
        }
      }
    }
    setMakeId("");
    setModelId("");
    setVersionId("");
  }

  function handleSave() {
    if (!make || !model || !version) return;
    setCar({
      versionId: version.id,
      label: `${make.name} ${model.name} ${version.label}`,
      year: version.yearStart ?? undefined,
    });
    setOpen(false);
  }

  function handleClear() {
    clearCar();
    setOpen(false);
  }

  const hasCar = hydrated && car !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={hasCar ? "outline" : "ghost"}
          size="sm"
          aria-label={
            hasCar
              ? `Veículo selecionado: ${car!.label}, ativar para trocar`
              : "Meu Carro: selecionar veículo"
          }
          className="gap-2 px-2 sm:px-3"
        >
          <Car className="size-5 sm:size-4" />
          <span className="hidden max-w-44 truncate sm:inline">
            {hasCar ? car!.label : "Meu Carro"}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">
            Meu Carro
          </DialogTitle>
          <DialogDescription>
            Selecione seu veículo para ver só as peças compatíveis com ele.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="my-car-make">Marca</Label>
            <Select
              value={makeId}
              onValueChange={(v) => {
                setMakeId(v);
                setModelId("");
                setVersionId("");
              }}
            >
              <SelectTrigger id="my-car-make" className="w-full">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="my-car-model">Modelo</Label>
            <Select
              value={modelId}
              onValueChange={(v) => {
                setModelId(v);
                setVersionId("");
              }}
              disabled={!make}
            >
              <SelectTrigger id="my-car-model" className="w-full">
                <SelectValue
                  placeholder={make ? "Selecione o modelo" : "Escolha a marca antes"}
                />
              </SelectTrigger>
              <SelectContent>
                {make?.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="my-car-version">Versão</Label>
            <Select value={versionId} onValueChange={setVersionId} disabled={!model}>
              <SelectTrigger id="my-car-version" className="w-full">
                <SelectValue
                  placeholder={model ? "Selecione a versão" : "Escolha o modelo antes"}
                />
              </SelectTrigger>
              <SelectContent>
                {model?.versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {hasCar && (
            <Button variant="ghost" onClick={handleClear}>
              Remover veículo
            </Button>
          )}
          <Button onClick={handleSave} disabled={!version}>
            Salvar veículo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
