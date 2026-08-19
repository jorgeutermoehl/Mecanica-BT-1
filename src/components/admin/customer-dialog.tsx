"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
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
import { createCustomerAction } from "@/app/actions/admin";
import { SALE_CHANNELS, SALE_CHANNEL_LABEL, type SaleChannel } from "@/lib/validations";

/** Dialog "Novo cliente" — cadastro manual pelo painel (balcão/Instagram/WhatsApp). */
export function CustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [document, setDocument] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [channel, setChannel] = React.useState<SaleChannel | "">("");
  const [notes, setNotes] = React.useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setDocument("");
    setInstagram("");
    setWhatsapp("");
    setChannel("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createCustomerAction({
      name,
      email,
      phone,
      document,
      instagram,
      whatsapp,
      ...(channel ? { acquisitionChannel: channel } : {}),
      notes,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Cliente cadastrado", {
        description: "O cliente já está disponível para consulta e vendas.",
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível cadastrar o cliente.");
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
      <Button className="w-full gap-2 sm:w-auto" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Novo cliente
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Cadastro manual de cliente — vendas pelo site criam o cadastro automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Nome</Label>
            <Input
              id="customer-name"
              required
              minLength={3}
              maxLength={120}
              placeholder="Nome completo ou razão social"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-email">E-mail (opcional)</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Telefone (opcional)</Label>
              <Input
                id="customer-phone"
                placeholder="(11) 99999-9999"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-document">CPF/CNPJ (opcional)</Label>
              <Input
                id="customer-document"
                placeholder="000.000.000-00"
                maxLength={20}
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                disabled={submitting}
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-instagram">Instagram (opcional)</Label>
              <Input
                id="customer-instagram"
                placeholder="@cliente"
                maxLength={40}
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={submitting}
                autoComplete="off"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-whatsapp">WhatsApp (opcional)</Label>
              <Input
                id="customer-whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                maxLength={20}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={submitting}
                autoComplete="off"
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-channel">Por onde chegou? (opcional)</Label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as SaleChannel)}
              disabled={submitting}
            >
              <SelectTrigger id="customer-channel" className="w-full">
                <SelectValue placeholder="Canal de aquisição" />
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
            <Label htmlFor="customer-notes">Observações (opcional)</Label>
            <Textarea
              id="customer-notes"
              rows={2}
              maxLength={500}
              placeholder="Preferências, veículo, referências…"
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Cadastrando…" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
