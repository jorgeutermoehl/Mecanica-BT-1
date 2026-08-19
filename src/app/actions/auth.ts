"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";
import { loginSchema } from "@/lib/validations";

export type ActionResult = { ok: boolean; error?: string };

/** IP e user-agent — permitidos no audit APENAS por ser ação de staff (segurança do painel). */
async function staffRequestInfo() {
  const h = await headers();
  return {
    ip: h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

export async function loginAction(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  const info = await staffRequestInfo();
  if (!user) {
    await logAudit(prisma, {
      userId: null,
      action: "USER_LOGIN_FAIL",
      entity: "User",
      description: `Tentativa de login falhou para ${parsed.data.email}`,
      ...info,
    });
    return { ok: false, error: "E-mail ou senha incorretos." };
  }

  await createSession(user);
  await logAudit(prisma, {
    userId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: user.id,
    description: "Login no painel",
    ...info,
  });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
