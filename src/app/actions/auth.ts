"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export type ActionResult = { ok: boolean; error?: string };

export async function loginAction(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }

  await createSession(user);
  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id, description: "Login no painel" },
  });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
