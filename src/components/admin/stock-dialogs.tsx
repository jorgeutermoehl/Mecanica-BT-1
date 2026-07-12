"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
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
import { stockAdjustAction, stockEntryAction, stockOutAction } from "@/app/actions/admin";

/** Opção de produto vinda de listProductOptions() (src/server/inventory). */
export type ProductOption = {
  id: string;
  label: string;
  stock: number;
  costPrice: number;
};

const OUT_TYPES = [
  { value: "MANUAL_OUT", label: "Saída manual" },
  { value: "LOSS", label: "Perda/avaria" },
  { value: "SUPPLIER_RETURN", label: "Devolução a fornecedor" },
] as const;

/* ------------------------------------------------------------------ */
/* Select de produto (mostra saldo atual em cada opção)               */
/* ------------------------------------------------------------------ */

function ProductSelect({
  id,
  products,
  value,
  onChange,
  disabled,
}: {
  id: string;
  products: ProductOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Selecione o produto" />
      </SelectTrigger>
      <SelectContent position="popper">
        {products.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{p.label}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {p.stock} un
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog: Registrar entrada                                          */
/* ------------------------------------------------------------------ */

function EntryDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unitCost, setUnitCost] = React.useState("");
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [supplierName, setSupplierName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function reset() {
    setProductId("");
    setQuantity("");
    setUnitCost("");
    setInvoiceNumber("");
    setSupplierName("");
    setNotes("");
  }

  function handleProduct(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    // Pré-preenche o custo unitário com o custo atual do produto.
    if (product) setUnitCost(product.costPrice.toFixed(2));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productId) {
      toast.error("Selecione o produto.");
      return;
    }
    setSubmitting(true);
    const result = await stockEntryAction({
      productId,
      quantity,
      unitCost,
      invoiceNumber,
      supplierName,
      notes,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Entrada registrada", {
        description: "O saldo e o custo médio do produto foram atualizados.",
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível registrar a entrada.");
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
        <ArrowDownToLine className="size-4" />
        Registrar entrada
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar entrada</DialogTitle>
          <DialogDescription>
            Entrada de mercadoria no estoque. O custo médio do produto é recalculado
            automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="entry-product">Produto</Label>
            <ProductSelect
              id="entry-product"
              products={products}
              value={productId}
              onChange={handleProduct}
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="entry-quantity">Quantidade</Label>
              <Input
                id="entry-quantity"
                type="number"
                min={1}
                step={1}
                required
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-unit-cost">Custo unitário (R$)</Label>
              <Input
                id="entry-unit-cost"
                type="number"
                min={0}
                step="0.01"
                required
                placeholder="0,00"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="entry-invoice">Nota fiscal (opcional)</Label>
              <Input
                id="entry-invoice"
                placeholder="Nº da NF"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-supplier">Fornecedor (opcional)</Label>
              <Input
                id="entry-supplier"
                placeholder="Nome do fornecedor"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-notes">Observações (opcional)</Label>
            <Textarea
              id="entry-notes"
              rows={2}
              placeholder="Detalhes da compra, condições, lote…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando…" : "Registrar entrada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog: Registrar saída                                            */
/* ------------------------------------------------------------------ */

function OutDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [type, setType] = React.useState<string>("MANUAL_OUT");
  const [reason, setReason] = React.useState("");

  const selected = products.find((p) => p.id === productId);

  function reset() {
    setProductId("");
    setQuantity("");
    setType("MANUAL_OUT");
    setReason("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productId) {
      toast.error("Selecione o produto.");
      return;
    }
    setSubmitting(true);
    const result = await stockOutAction({ productId, quantity, type, reason });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Saída registrada", {
        description: "O saldo do produto foi atualizado.",
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível registrar a saída.");
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
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <ArrowUpFromLine className="size-4" />
        Registrar saída
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar saída</DialogTitle>
          <DialogDescription>
            Baixa manual de estoque — saída avulsa, perda/avaria ou devolução a fornecedor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="out-product">Produto</Label>
            <ProductSelect
              id="out-product"
              products={products}
              value={productId}
              onChange={setProductId}
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="out-quantity">Quantidade</Label>
                {selected ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    Saldo: {selected.stock} un
                  </span>
                ) : null}
              </div>
              <Input
                id="out-quantity"
                type="number"
                min={1}
                step={1}
                required
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="out-type">Tipo de saída</Label>
              <Select value={type} onValueChange={setType} disabled={submitting}>
                <SelectTrigger id="out-type" className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {OUT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="out-reason">Motivo</Label>
            <Textarea
              id="out-reason"
              rows={2}
              required
              placeholder="Ex.: peça danificada no manuseio, uso interno na oficina…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando…" : "Registrar saída"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog: Ajuste de inventário                                       */
/* ------------------------------------------------------------------ */

function AdjustDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [newQuantity, setNewQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");

  const selected = products.find((p) => p.id === productId);

  function reset() {
    setProductId("");
    setNewQuantity("");
    setReason("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productId) {
      toast.error("Selecione o produto.");
      return;
    }
    setSubmitting(true);
    const result = await stockAdjustAction({ productId, newQuantity, reason });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Ajuste registrado", {
        description: "O saldo do produto foi corrigido com lançamento de ajuste.",
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível registrar o ajuste.");
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
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" />
        Ajuste de inventário
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste de inventário</DialogTitle>
          <DialogDescription>
            Corrige o saldo para a quantidade contada. O histórico anterior é preservado —
            o ajuste vira um novo lançamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="adjust-product">Produto</Label>
            <ProductSelect
              id="adjust-product"
              products={products}
              value={productId}
              onChange={setProductId}
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="adjust-quantity">Nova quantidade</Label>
              {selected ? (
                <span className="font-mono text-xs text-muted-foreground">
                  Saldo atual: {selected.stock} un
                </span>
              ) : null}
            </div>
            <Input
              id="adjust-quantity"
              type="number"
              min={0}
              step={1}
              required
              placeholder="Quantidade contada no inventário"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              disabled={submitting}
              className="font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="adjust-reason">Motivo do ajuste</Label>
            <Textarea
              id="adjust-reason"
              rows={2}
              required
              placeholder="Ex.: contagem física de julho, divergência identificada…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando…" : "Registrar ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Barra de ações do estoque                                          */
/* ------------------------------------------------------------------ */

export function StockDialogs({ products }: { products: ProductOption[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <EntryDialog products={products} />
      <OutDialog products={products} />
      <AdjustDialog products={products} />
    </div>
  );
}
