"use server";

import { revalidatePath } from "next/cache";
import { createSession, requireRole, requireStaff } from "@/lib/auth";
import { changePasswordSchema, userCreateSchema, userUpdateSchema } from "@/lib/validations";
import { changeOwnPassword, createStaffUser, updateStaffUser } from "@/server/users";

export type UserActionResult = { ok: boolean; error?: string };

function fail(e: unknown): UserActionResult {
  if (e instanceof Error) {
    if (e.message === "NOT_AUTHENTICATED" || e.message === "NOT_AUTHORIZED") {
      return { ok: false, error: "Sem permissão ou sessão expirada — faça login novamente." };
    }
    return { ok: false, error: e.message };
  }
  return { ok: false, error: "Erro inesperado." };
}

/** Troca a própria senha (qualquer staff) e reemite a sessão deste aparelho. */
export async function changeOwnPasswordAction(input: unknown): Promise<UserActionResult> {
  try {
    const user = await requireStaff();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await changeOwnPassword(user.id, parsed.data);
    // Outras sessões caem (passwordChangedAt); esta continua com token novo.
    await createSession(user);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createUserAction(input: unknown): Promise<UserActionResult> {
  try {
    const actor = await requireRole("admin");
    const parsed = userCreateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await createStaffUser(parsed.data, actor.id);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateUserAction(id: string, input: unknown): Promise<UserActionResult> {
  try {
    const actor = await requireRole("admin");
    if (!id) return { ok: false, error: "Usuário inválido." };
    const parsed = userUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    await updateStaffUser(id, parsed.data, actor.id);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
