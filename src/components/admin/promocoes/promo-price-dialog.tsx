"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgePercent, X } from "lucide-react";
import { formatBRL, discountPercent } from "@/lib/format";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearPromoPriceAction, setPromoPriceAction } from "@/app/actions/admin";

/** Dialog "Aplicar promoção" — define promoPrice do produto. */
export function ApplyPromoDialog({
  productId,
  productName,
  sku,
  salePrice,
}: {
  productId: string;
  productName: string;
  sku: string;
  salePrice: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [promoPrice, setPromoPrice] = React.useState("");

  const parsed = Number(promoPrice);
  const isValid = Number.isFinite(parsed) && parsed > 0 && parsed < salePrice;
  const preview = isValid ? discountPercent(salePrice, parsed) : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) {
      toast.error("O preço promocional deve ser maior que zero e menor que o preço normal.");
      return;
    }
    setSubmitting(true);
    const result = await setPromoPriceAction({ productId, promoPrice: parsed });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Promoção aplicada", {
        description: `${productName} agora aparece na vitrine de promoções da loja.`,
      });
      setOpen(false);
      setPromoPrice("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível aplicar a promoção.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setPromoPrice("");
      }}
    >
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <BadgePercent className="size-3.5" />
        Aplicar promoção
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Aplicar promoção</DialogTitle>
          <DialogDescription>
            {productName} <span className="font-mono text-xs">({sku})</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">Preço normal</span>
            <span className="font-mono text-sm font-semibold">{formatBRL(salePrice)}</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`promo-price-${productId}`}>Preço promocional (R$)</Label>
            <Input
              id={`promo-price-${productId}`}
              type="number"
              min={0.01}
              step="0.01"
              required
              autoFocus
              placeholder="0,00"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              disabled={submitting}
              className="font-mono"
            />
            {promoPrice !== "" && !isValid ? (
              <p className="text-xs text-destructive">
                O preço promocional deve ser menor que {formatBRL(salePrice)}.
              </p>
            ) : preview !== null ? (
              <p className="text-xs text-muted-foreground">
                Desconto de <span className="font-mono font-semibold text-primary">{preview}%</span>{" "}
                sobre o preço normal — o selo aparece automaticamente na loja.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? "Aplicando…" : "Aplicar promoção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Botão "Remover" promoção com confirmação (AlertDialog) — limpa o promoPrice. */
export function RemovePromoButton({
  productId,
  productName,
  salePrice,
}: {
  productId: string;
  productName: string;
  salePrice: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleRemove() {
    setPending(true);
    const result = await clearPromoPriceAction(productId);
    setPending(false);
    if (result.ok) {
      toast.success("Promoção removida", {
        description: `${productName} voltou ao preço normal de ${formatBRL(salePrice)}.`,
      });
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível remover a promoção.");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={pending}>
          <X className="size-3.5" />
          {pending ? "Removendo…" : "Remover"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover promoção?</AlertDialogTitle>
          <AlertDialogDescription>
            {productName} sai da vitrine de promoções e volta ao preço normal de{" "}
            {formatBRL(salePrice)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleRemove}>
            Remover promoção
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
