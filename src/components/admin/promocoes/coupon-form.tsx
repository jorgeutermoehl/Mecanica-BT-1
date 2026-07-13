"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketPercent } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createCouponAction } from "@/app/actions/admin";

type CouponType = "PERCENT" | "FIXED";

/** Dialog "Novo cupom" — cria cupom de desconto via createCouponAction. */
export function CouponForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<CouponType>("PERCENT");
  const [value, setValue] = React.useState("");
  const [minOrderValue, setMinOrderValue] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("");

  function reset() {
    setCode("");
    setType("PERCENT");
    setValue("");
    setMinOrderValue("");
    setUsageLimit("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!/^[A-Za-z0-9]{3,30}$/.test(trimmedCode)) {
      toast.error("Código inválido — use de 3 a 30 letras e números, sem espaços.");
      return;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Informe um valor de desconto maior que zero.");
      return;
    }
    if (type === "PERCENT" && numericValue > 90) {
      toast.error("Desconto percentual máximo é 90%.");
      return;
    }
    setSubmitting(true);
    const result = await createCouponAction({
      code: trimmedCode,
      type,
      value,
      minOrderValue: minOrderValue.trim() === "" ? undefined : minOrderValue,
      usageLimit: usageLimit.trim() === "" ? undefined : usageLimit,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Cupom criado", {
        description: `O cupom ${trimmedCode} já está ativo e aceito no checkout.`,
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível criar o cupom.");
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
        <TicketPercent className="size-4" />
        Novo cupom
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cupom de desconto</DialogTitle>
          <DialogDescription>
            O cupom nasce ativo e passa a valer imediatamente no checkout da loja.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="coupon-code">Código</Label>
            <Input
              id="coupon-code"
              required
              maxLength={30}
              placeholder="Ex.: TURBO10"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={submitting}
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Apenas letras e números — o cliente digita esse código no carrinho.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de desconto</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as CouponType)}
              className="grid-cols-2"
              disabled={submitting}
            >
              <Label
                htmlFor="coupon-type-percent"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value="PERCENT" id="coupon-type-percent" />
                Percentual
              </Label>
              <Label
                htmlFor="coupon-type-fixed"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value="FIXED" id="coupon-type-fixed" />
                Valor fixo
              </Label>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="coupon-value">
              {type === "PERCENT" ? "Desconto (%)" : "Desconto (R$)"}
            </Label>
            <div className="relative">
              <Input
                id="coupon-value"
                type="number"
                min={0.01}
                max={type === "PERCENT" ? 90 : undefined}
                step="0.01"
                required
                placeholder={type === "PERCENT" ? "Ex.: 10" : "Ex.: 50,00"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={submitting}
                className="pr-12 font-mono"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-sm text-muted-foreground"
              >
                {type === "PERCENT" ? "%" : "R$"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="coupon-min-order">Pedido mínimo (opcional)</Label>
              <Input
                id="coupon-min-order"
                type="number"
                min={0}
                step="0.01"
                placeholder="R$ 0,00"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coupon-usage-limit">Limite de usos (opcional)</Label>
              <Input
                id="coupon-usage-limit"
                type="number"
                min={1}
                step={1}
                placeholder="Ilimitado"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando…" : "Criar cupom"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
