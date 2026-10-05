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

/** Anti força bruta: falhas recentes por e-mail OU por IP (lidas do audit log). */
const LOGIN_MAX_FAILS = 5;
const LOGIN_WINDOW_MIN = 15;

async function tooManyFailedLogins(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MIN * 60_000);
  const fails = await prisma.auditLog.count({
    where: {
      action: "USER_LOGIN_FAIL",
      createdAt: { gte: since },
      OR: [{ description: { endsWith: ` ${email}` } }, ...(ip ? [{ ip }] : [])],
    },
  });
  return fails >= LOGIN_MAX_FAILS;
}

export async function loginAction(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const info = await staffRequestInfo();
  const email = parsed.data.email.toLowerCase().trim();
  if (await tooManyFailedLogins(email, info.ip)) {
    return {
      ok: false,
      error: `Muitas tentativas de login. Aguarde ${LOGIN_WINDOW_MIN} minutos e tente novamente.`,
    };
  }

  const user = await authenticate(email, parsed.data.password);
  if (!user) {
    await logAudit(prisma, {
      userId: null,
      action: "USER_LOGIN_FAIL",
      entity: "User",
      description: `Tentativa de login falhou para ${email}`,
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
