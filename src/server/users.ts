import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/server/audit";
import type { ChangePasswordInput, UserCreateInput, UserUpdateInput } from "@/lib/validations";

/**
 * Usuários do painel (staff). Regras:
 *  - nunca exclusão física (desativar = isActive false);
 *  - sempre sobra ao menos 1 administrador ativo;
 *  - troca/redefinição de senha grava passwordChangedAt → derruba sessões antigas.
 */

export type StaffUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function listStaffUsers(): Promise<StaffUserRow[]> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, role: { slug: { not: "cliente" } } },
    include: { role: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  const lastLogins = await prisma.auditLog.groupBy({
    by: ["userId"],
    where: { action: "USER_LOGIN", userId: { in: users.map((u) => u.id) } },
    _max: { createdAt: true },
  });
  const lastBy = new Map(lastLogins.map((l) => [l.userId, l._max.createdAt]));
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role?.slug ?? "",
    isActive: u.isActive,
    lastLoginAt: lastBy.get(u.id)?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));
}

async function roleId(slug: string): Promise<string> {
  const role = await prisma.role.findUnique({ where: { slug } });
  if (!role) throw new Error("Papel não encontrado — rode o seed de papéis.");
  return role.id;
}

export async function createStaffUser(input: UserCreateInput, actorId: string) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new Error("Já existe um usuário com esse e-mail.");
  const passwordHash = await hashPassword(input.password);
  const rid = await roleId(input.role);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash, roleId: rid, passwordChangedAt: new Date() },
    });
    await logAudit(tx, {
      userId: actorId,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
      description: `Usuário ${user.email} criado (${input.role})`,
    });
    return user.id;
  });
}

export async function updateStaffUser(id: string, input: UserUpdateInput, actorId: string) {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user || user.deletedAt) throw new Error("Usuário não encontrado.");

  const losingAdmin = user.role?.slug === "admin" && (input.role !== "admin" || !input.isActive);
  if (losingAdmin) {
    const otherAdmins = await prisma.user.count({
      where: { id: { not: id }, isActive: true, deletedAt: null, role: { slug: "admin" } },
    });
    if (otherAdmins === 0) throw new Error("É preciso manter pelo menos um administrador ativo.");
  }
  if (id === actorId && !input.isActive) throw new Error("Você não pode desativar o próprio usuário.");

  const rid = await roleId(input.role);
  const newPassword = input.newPassword || undefined;
  const passwordHash = newPassword ? await hashPassword(newPassword) : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        roleId: rid,
        isActive: input.isActive,
        ...(passwordHash ? { passwordHash, passwordChangedAt: new Date() } : {}),
        // Desativar também invalida sessões abertas.
        ...(!input.isActive && user.isActive ? { passwordChangedAt: new Date() } : {}),
      },
    });
    await logAudit(tx, {
      userId: actorId,
      action: user.role?.slug !== input.role ? "USER_ROLE_CHANGE" : "USER_UPDATE",
      entity: "User",
      entityId: id,
      description: `Usuário ${user.email} atualizado${passwordHash ? " (senha redefinida)" : ""}`,
      before: { role: user.role?.slug, isActive: user.isActive },
      after: { role: input.role, isActive: input.isActive },
    });
  });
}

export async function changeOwnPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) throw new Error("Usuário não encontrado.");
  const ok = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!ok) throw new Error("Senha atual incorreta.");
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash, passwordChangedAt: new Date() } });
    await logAudit(tx, {
      userId,
      action: "USER_PASSWORD_CHANGE",
      entity: "User",
      entityId: userId,
      description: "Senha alterada pelo próprio usuário",
    });
  });
}
