import { prisma } from "@/lib/prisma";

/** Mensagens do formulário de contato (fila de atendimento do painel). */

export const CONTACT_STATUSES = ["NEW", "ANSWERED", "CLOSED"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABEL: Record<string, string> = {
  NEW: "Nova",
  IN_REVIEW: "Em análise",
  ANSWERED: "Respondida",
  CLOSED: "Arquivada",
};

export async function listContactMessages() {
  const rows = await prisma.contactMessage.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: { handledBy: { select: { name: true } } },
  });
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    status: m.status,
    handledBy: m.handledBy?.name ?? null,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function setContactStatus(id: string, status: ContactStatus, userId: string) {
  await prisma.contactMessage.update({
    where: { id },
    data: { status, handledById: status === "NEW" ? null : userId },
  });
}
