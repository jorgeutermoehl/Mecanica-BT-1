"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  SALE_CHANNELS,
  SALE_CHANNEL_LABEL,
  type PaymentMethod,
  type SaleChannel,
} from "@/lib/validations";
import { formatBRL } from "@/lib/format";
import {
  manualSaleAction,
  stockAdjustAction,
  stockEntryAction,
  stockOutAction,
} from "@/app/actions/admin";

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
/* Select de forma de pagamento                                        */
/* ------------------------------------------------------------------ */

function PaymentMethodSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as PaymentMethod)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Forma de pagamento" />
      </SelectTrigger>
      <SelectContent position="popper">
        {PAYMENT_METHODS.map((m) => (
          <SelectItem key={m} value={m}>
            {PAYMENT_METHOD_LABEL[m]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog: Registrar entrada (com financeiro da compra)                */
/* ------------------------------------------------------------------ */

export function EntryDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unitCost, setUnitCost] = React.useState("");
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [supplierName, setSupplierName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  // Financeiro da compra
  const [registerExpense, setRegisterExpense] = React.useState(true);
  const [paid, setPaid] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("PIX");

  function reset() {
    setProductId("");
    setQuantity("");
    setUnitCost("");
    setInvoiceNumber("");
    setSupplierName("");
    setNotes("");
    setRegisterExpense(true);
    setPaid(true);
    setPaymentMethod("PIX");
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
      registerExpense,
      paid,
      paymentMethod,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Entrada registrada", {
        description: registerExpense
          ? paid
            ? "Saldo atualizado e despesa paga lançada no caixa."
            : "Saldo atualizado e conta a pagar criada (vencimento em 28 dias)."
          : "O saldo e o custo médio do produto foram atualizados.",
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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

          {/* Financeiro da compra */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Financeiro
            </p>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="entry-register-expense"
                checked={registerExpense}
                onCheckedChange={(v) => setRegisterExpense(v === true)}
                disabled={submitting}
                className="mt-0.5"
              />
              <div className="grid gap-0.5">
                <Label htmlFor="entry-register-expense">
                  Lançar despesa da compra no financeiro
                </Label>
                <p className="text-xs text-muted-foreground">
                  Registra a compra como despesa junto com a entrada de estoque.
                </p>
              </div>
            </div>
            {registerExpense ? (
              <>
                <RadioGroup
                  value={paid ? "PAID" : "TERM"}
                  onValueChange={(v) => setPaid(v === "PAID")}
                  disabled={submitting}
                  className="gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <RadioGroupItem id="entry-paid-now" value="PAID" />
                    <Label htmlFor="entry-paid-now" className="font-normal">
                      Pago à vista (sai do caixa)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <RadioGroupItem id="entry-paid-term" value="TERM" />
                    <Label htmlFor="entry-paid-term" className="font-normal">
                      A prazo (contas a pagar, venc. 28 dias)
                    </Label>
                  </div>
                </RadioGroup>
                <div className="grid gap-2">
                  <Label htmlFor="entry-payment-method">Forma de pagamento</Label>
                  <PaymentMethodSelect
                    id="entry-payment-method"
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    disabled={submitting}
                  />
                </div>
              </>
            ) : null}
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

export function OutDialog({ products }: { products: ProductOption[] }) {
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
            Para venda, use “Registrar venda”.
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
/* Dialog: Registrar venda (manual — Instagram/WhatsApp/loja/site)     */
/* ------------------------------------------------------------------ */

export function SaleDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");
  const [channel, setChannel] = React.useState<SaleChannel>("LOJA");
  const [customerName, setCustomerName] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("PIX");

  const selected = products.find((p) => p.id === productId);
  const qtyNumber = Number(quantity);
  const priceNumber = Number(unitPrice);
  const saleTotal =
    qtyNumber > 0 && priceNumber > 0 ? qtyNumber * priceNumber : null;

  function reset() {
    setProductId("");
    setQuantity("");
    setUnitPrice("");
    setChannel("LOJA");
    setCustomerName("");
    setPaymentMethod("PIX");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productId) {
      toast.error("Selecione o produto.");
      return;
    }
    setSubmitting(true);
    const result = await manualSaleAction({
      productId,
      quantity,
      unitPrice,
      channel,
      customerName,
      paymentMethod,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success(
        result.orderNumber
          ? `Venda ${result.orderNumber} registrada`
          : "Venda registrada",
        {
          description: "Pedido criado, estoque baixado e recebimento lançado no caixa.",
        },
      );
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível registrar a venda.");
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
        <ShoppingCart className="size-4" />
        Registrar venda
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar venda</DialogTitle>
          <DialogDescription>
            Venda manual por Instagram, WhatsApp, balcão ou site. Gera pedido, baixa o
            estoque e lança o recebimento no caixa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sale-product">Produto</Label>
            <ProductSelect
              id="sale-product"
              products={products}
              value={productId}
              onChange={setProductId}
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sale-quantity">Quantidade</Label>
                {selected ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    Saldo: {selected.stock} un
                  </span>
                ) : null}
              </div>
              <Input
                id="sale-quantity"
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
              <Label htmlFor="sale-unit-price">Preço unitário (R$)</Label>
              <Input
                id="sale-unit-price"
                type="number"
                min={0.01}
                step="0.01"
                required
                placeholder="0,00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
              {selected ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Custo atual: {formatBRL(selected.costPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sale-channel">Canal da venda</Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as SaleChannel)}
                disabled={submitting}
              >
                <SelectTrigger id="sale-channel" className="w-full">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {SALE_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SALE_CHANNEL_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sale-payment-method">Forma de pagamento</Label>
              <PaymentMethodSelect
                id="sale-payment-method"
                value={paymentMethod}
                onChange={setPaymentMethod}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sale-customer">Cliente (opcional)</Label>
            <Input
              id="sale-customer"
              placeholder="Cliente balcão"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={submitting}
            />
          </div>
          {saleTotal !== null ? (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-right font-mono text-sm">
              Total da venda:{" "}
              <span className="text-base font-semibold">{formatBRL(saleTotal)}</span>
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando…" : "Registrar venda"}
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

export function AdjustDialog({ products }: { products: ProductOption[] }) {
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
      <SaleDialog products={products} />
      <AdjustDialog products={products} />
    </div>
  );
}
