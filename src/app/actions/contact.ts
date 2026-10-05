"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { CONTACT_STATUSES, setContactStatus } from "@/server/contacts";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { notifyStoreNewContact } from "@/server/email";

export type ContactResult = { ok: boolean; error?: string };

/** Máximo de mensagens por e-mail por hora (anti-spam simples, sem IP — LGPD). */
const MAX_PER_HOUR = 3;

export async function sendContactMessageAction(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;
  // Robô preencheu o honeypot: finge sucesso e descarta.
  if (data.site) return { ok: true };

  const email = data.email.toLowerCase();
  const recent = await prisma.contactMessage.count({
    where: { email, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recent >= MAX_PER_HOUR) {
    return { ok: false, error: "Você já enviou várias mensagens agora há pouco — fale com a gente pelo WhatsApp." };
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: data.nome,
      phone: data.telefone,
      email,
      subject: data.assunto,
      message: data.mensagem,
    },
  });
  revalidatePath("/admin/notificacoes");
  revalidatePath("/admin/mensagens");
  // E-mail para a loja é best-effort: falha de envio não perde a mensagem.
  await notifyStoreNewContact(message).catch(() => undefined);
  return { ok: true };
}

/** Painel: muda o status de atendimento de uma mensagem. */
export async function setContactStatusAction(id: string, status: string): Promise<ContactResult> {
  try {
    const user = await requireStaff();
    const parsed = z.enum(CONTACT_STATUSES).safeParse(status);
    if (!id || !parsed.success) return { ok: false, error: "Status inválido." };
    await setContactStatus(id, parsed.data, user.id);
    revalidatePath("/admin/mensagens");
    revalidatePath("/admin/notificacoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada — faça login novamente." };
  }
}
