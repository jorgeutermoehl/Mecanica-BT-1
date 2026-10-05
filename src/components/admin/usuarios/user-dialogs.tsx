"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, UserPlus } from "lucide-react";
import { createUserAction, updateUserAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL } from "@/components/admin/admin-nav";

const ROLES = ["admin", "gerente", "vendedor", "estoquista", "financeiro"] as const;
type Role = (typeof ROLES)[number];

function RoleSelect({ id, value, onChange }: { id: string; value: Role; onChange: (r: Role) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABEL[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Dialog "Novo usuário" do painel (somente administradores). */
export function NewUserDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("vendedor");
  const [password, setPassword] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const r = await createUserAction({ name, email, role, password });
    setSubmitting(false);
    if (r.ok) {
      toast.success("Usuário criado", { description: "Envie a senha inicial por um canal seguro." });
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("vendedor");
      router.refresh();
    } else {
      toast.error(r.error ?? "Não foi possível criar o usuário.");
    }
  }

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Novo usuário
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Novo usuário do painel</DialogTitle>
              <DialogDescription>
                Peça para a pessoa trocar a senha em “Minha conta” no primeiro acesso.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Nome</Label>
              <Input id="new-user-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">E-mail</Label>
              <Input
                id="new-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Papel</Label>
              <RoleSelect id="new-user-role" value={role} onChange={setRole} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Senha inicial</Label>
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">Mínimo 10 caracteres, com letra e número.</p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Criar usuário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Dialog de edição: papel, ativo/inativo e redefinição de senha. */
export function EditUserDialog({
  user,
}: {
  user: { id: string; name: string; email: string; role: string; isActive: boolean };
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [role, setRole] = React.useState<Role>(
    (ROLES as readonly string[]).includes(user.role) ? (user.role as Role) : "vendedor",
  );
  const [isActive, setIsActive] = React.useState(user.isActive);
  const [newPassword, setNewPassword] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const r = await updateUserAction(user.id, { role, isActive, newPassword });
    setSubmitting(false);
    if (r.ok) {
      toast.success("Usuário atualizado");
      setOpen(false);
      setNewPassword("");
      router.refresh();
    } else {
      toast.error(r.error ?? "Não foi possível salvar.");
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${user.name}`}
      >
        <Pencil className="size-3.5" />
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{user.name}</DialogTitle>
              <DialogDescription className="font-mono">{user.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`role-${user.id}`}>Papel</Label>
              <RoleSelect id={`role-${user.id}`} value={role} onChange={setRole} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`active-${user.id}`}
                checked={isActive}
                onCheckedChange={(v) => setIsActive(v === true)}
              />
              <Label htmlFor={`active-${user.id}`}>Acesso ativo</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`pwd-${user.id}`}>Redefinir senha (opcional)</Label>
              <Input
                id={`pwd-${user.id}`}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para manter"
              />
              <p className="text-xs text-muted-foreground">
                Redefinir a senha ou desativar encerra as sessões abertas do usuário.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
