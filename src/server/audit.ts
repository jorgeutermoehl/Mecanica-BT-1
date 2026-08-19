import { z } from "zod";
import type { Prisma } from "@prisma/client";

/**
 * Contrato ÚNICO de auditoria (ESPEC-V2, Onda 1 item 2).
 * - Chamar SEMPRE dentro da mesma transação Prisma da operação auditada.
 * - Lista fechada de ações (Zod) — ação nova exige entrar aqui primeiro.
 * - before/after gravam apenas o diff dos campos alterados (nunca passwordHash).
 * - ip/userAgent SÓ para ações de staff; navegação/checkout de cliente nunca.
 */

export const AUDIT_ACTIONS = [
  "PRODUCT_CREATE",
  "PRODUCT_UPDATE",
  "PRODUCT_DEACTIVATE",
  "PRICE_CHANGE",
  "STOCK_ENTRY",
  "STOCK_OUT",
  "STOCK_ADJUSTMENT",
  "STOCK_REVERSAL",
  "STOCK_CORRECTION",
  "ORDER_CREATE",
  "ORDER_STATUS_CHANGE",
  "ORDER_CANCEL",
  "PAYMENT_REGISTER",
  "COUPON_CREATE",
  "COUPON_UPDATE",
  "COUPON_DEACTIVATE",
  "CUSTOMER_CREATE",
  "CUSTOMER_UPDATE",
  "CUSTOMER_ANONYMIZE",
  "USER_LOGIN",
  "USER_LOGIN_FAIL",
  "USER_ROLE_CHANGE",
  "EXPORT_DATA",
  "MEDIA_UPLOAD",
  "MEDIA_DELETE",
  "MERGE",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
const auditActionSchema = z.enum(AUDIT_ACTIONS);

/** Campos que NUNCA entram no diff, em nenhuma entidade. */
const REDACTED_FIELDS = new Set(["passwordHash", "password", "token", "secret"]);

type Snapshot = Record<string, unknown>;

/** Diff raso: mantém apenas os campos que mudaram (e nunca os sensíveis). */
export function diffSnapshots(
  before: Snapshot | null | undefined,
  after: Snapshot | null | undefined,
): { before: Snapshot; after: Snapshot } | null {
  if (!before && !after) return null;
  const b: Snapshot = {};
  const a: Snapshot = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const key of keys) {
    if (REDACTED_FIELDS.has(key)) continue;
    const bv = before?.[key];
    const av = after?.[key];
    if (JSON.stringify(bv) === JSON.stringify(av)) continue;
    if (bv !== undefined) b[key] = bv;
    if (av !== undefined) a[key] = av;
  }
  if (Object.keys(b).length === 0 && Object.keys(a).length === 0) return null;
  return { before: b, after: a };
}

export interface LogAuditInput {
  /** Usuário staff responsável (null só em falha de login, onde ainda não há sessão). */
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  description?: string;
  /** Estado anterior (apenas campos relevantes) — o diff é calculado aqui. */
  before?: Snapshot | null;
  /** Estado novo (apenas campos relevantes). */
  after?: Snapshot | null;
  /** Somente para ações de STAFF (segurança do painel) — nunca em fluxo de cliente. */
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Grava a trilha de auditoria dentro da transação corrente.
 * Recebe o `tx` da transação para garantir atomicidade com a operação.
 */
export async function logAudit(tx: Prisma.TransactionClient, input: LogAuditInput) {
  const action = auditActionSchema.parse(input.action);
  const diff = diffSnapshots(input.before, input.after);
  const metadata: Snapshot = {};
  if (diff) {
    metadata.before = diff.before;
    metadata.after = diff.after;
  }
  if (input.userAgent) metadata.userAgent = input.userAgent.slice(0, 400);

  await tx.auditLog.create({
    data: {
      userId: input.userId,
      action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      description: input.description ?? null,
      metadata: Object.keys(metadata).length ? JSON.stringify(metadata) : null,
      ip: input.ip ?? null,
    },
  });
}
