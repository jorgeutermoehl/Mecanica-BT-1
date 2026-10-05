import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaffUser } from "@/lib/auth";
import { listStaffUsers } from "@/server/users";
import { ROLE_LABEL } from "@/components/admin/admin-nav";
import { EditUserDialog, NewUserDialog } from "@/components/admin/usuarios/user-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Usuários do painel" };

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function UsersPage() {
  const me = await getStaffUser();
  if (!me || me.role !== "admin") notFound();
  const users = await listStaffUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Usuários do painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quem acessa o painel e com qual papel. Usuários nunca são excluídos — só desativados.
          </p>
        </div>
        <NewUserDialog />
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Último login</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name}
                    {u.id === me.id && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{u.email}</TableCell>
                  <TableCell>{ROLE_LABEL[u.role] ?? u.role}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "secondary" : "outline"}>
                      {u.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {u.lastLoginAt ? dateTime.format(new Date(u.lastLoginAt)) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={u} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
