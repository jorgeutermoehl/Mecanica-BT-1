import { z } from "zod";
import type { Prisma, PaymentTransaction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, PaymentMethod } from "@/lib/validations";
import { updateOrderStatus } from "@/server/orders";
import { logAudit } from "@/server/audit";

/**
 * Serviço de pagamentos de gateway (ESPEC-V2, Onda 3 itens 2, 4 e 6).
 *
 * - `payment_transactions` guarda as TENTATIVAS no gateway; `payments` é o
 *   registro CONTÁBIL (paymentId só é preenchido quando a transação aprova).
 * - Transições de status são MONOTÔNICAS: nunca regridem, mesmo com webhooks
 *   duplicados ou fora de ordem (REFUNDED pode chegar antes de APPROVED).
 * - Scaffolding sem credenciais: com MP_ACCESS_TOKEN ausente nada toca a rede
 *   (fetchRemoteStatus retorna null e o caller registra IGNORED).
 */

// ===========================================================================
// Valores canônicos + labels (Zod — SQLite não tem enum nativo)
// ===========================================================================

export const PAYMENT_PROVIDERS = ["MERCADO_PAGO", "PIX_CRESOL", "MANUAL"] as const;
export const TRANSACTION_STATUSES = [
  "CREATED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "CHARGED_BACK",
  "CANCELLED",
  "EXPIRED",
] as const;
export const GATEWAY_METHODS = ["PIX", "CREDIT_CARD", "BOLETO", "WALLET"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type GatewayMethod = (typeof GATEWAY_METHODS)[number];

export const PAYMENT_PROVIDER_LABEL: Record<PaymentProvider, string> = {
  MERCADO_PAGO: "Mercado Pago",
  PIX_CRESOL: "Pix Cresol",
  MANUAL: "Manual",
};

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  CREATED: "Criada",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  REFUNDED: "Estornada",
  PARTIALLY_REFUNDED: "Estorno parcial",
  CHARGED_BACK: "Chargeback",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

export const GATEWAY_METHOD_LABEL: Record<GatewayMethod, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
  WALLET: "Carteira digital",
};

const providerSchema = z.enum(PAYMENT_PROVIDERS);
const transactionStatusSchema = z.enum(TRANSACTION_STATUSES);

/**
 * `updateOrderStatus` exige `userId: string`, mas os fluxos de SISTEMA
 * (webhook e cron) não têm usuário logado. `null` é seguro em runtime: todos
 * os destinos do userId nesse caminho (OrderStatusHistory, AuditLog,
 * InventoryMovement, CashFlowEntry) aceitam nulo no schema. O cast existe só
 * para satisfazer a assinatura SEM alterar orders.ts (arquivo intocável).
 */
const SYSTEM_USER_ID = null as unknown as string;

/** Método do gateway → método contábil do model Payment (lista existente). */
const GATEWAY_TO_PAYMENT_METHOD: Record<GatewayMethod, PaymentMethod> = {
  PIX: "PIX",
  CREDIT_CARD: "CREDIT_CARD",
  BOLETO: "BOLETO",
  // Payment não tem "WALLET" — dinheiro em conta entra como transferência.
  WALLET: "BANK_TRANSFER",
};

// ===========================================================================
// Máquina de status (monotônica)
// ===========================================================================

/**
 * Rank de progressão: CREATED < PENDING < APPROVED < estornos. Transição só
 * acontece para rank MAIOR (nunca regride — REFUNDED não volta a APPROVED).
 * PARTIALLY_REFUNDED pode progredir para REFUNDED/CHARGED_BACK (estorno
 * completado), por isso fica um degrau abaixo.
 */
const STATUS_RANK: Record<TransactionStatus, number> = {
  CREATED: 0,
  PENDING: 1,
  APPROVED: 2,
  PARTIALLY_REFUNDED: 3,
  REFUNDED: 4,
  CHARGED_BACK: 4,
  // Terminais têm regra própria (abaixo) — o rank alto impede qualquer saída.
  REJECTED: 9,
  CANCELLED: 9,
  EXPIRED: 9,
};

/** Terminais: só podem ser ATINGIDOS a partir de CREATED/PENDING. */
const TERMINAL_STATUSES: ReadonlySet<TransactionStatus> = new Set(["REJECTED", "CANCELLED", "EXPIRED"]);
const REVERSAL_STATUSES: ReadonlySet<TransactionStatus> = new Set([
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "CHARGED_BACK",
]);

/** A transição current → next é permitida pela máquina monotônica? */
function canTransition(current: TransactionStatus, next: TransactionStatus): boolean {
  if (current === next) return false;
  if (TERMINAL_STATUSES.has(current)) return false; // terminal não sai
  if (TERMINAL_STATUSES.has(next)) {
    // REJECTED/CANCELLED/EXPIRED só valem para tentativa ainda não aprovada.
    return current === "CREATED" || current === "PENDING";
  }
  return STATUS_RANK[next] > STATUS_RANK[current];
}

// ===========================================================================
// createTransaction
// ===========================================================================

const createTransactionSchema = z.object({
  orderId: z.string().min(1),
  provider: providerSchema,
  providerTransactionId: z.string().min(1).max(120),
  providerPreferenceId: z.string().max(120).optional().nullable(),
  method: z.enum(GATEWAY_METHODS),
  amount: z.number().positive(),
  installments: z.number().int().positive().optional().nullable(),
  /** Transação nasce CREATED (ou já PENDING quando o provedor confirmou o registro). */
  status: z.enum(["CREATED", "PENDING"]).default("CREATED"),
  expiresAt: z.coerce.date().optional().nullable(),
  rawPayload: z.string().optional().nullable(),
});

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;

/**
 * Registra uma tentativa de pagamento no gateway. Idempotente pela unique
 * [provider, providerTransactionId]: repetir a chamada devolve a existente.
 */
export async function createTransaction(input: CreateTransactionInput) {
  const data = createTransactionSchema.parse(input);

  const existing = await prisma.paymentTransaction.findUnique({
    where: {
      provider_providerTransactionId: {
        provider: data.provider,
        providerTransactionId: data.providerTransactionId,
      },
    },
  });
  if (existing) return toTransactionJson(existing);

  const created = await prisma.paymentTransaction.create({
    data: {
      orderId: data.orderId,
      provider: data.provider,
      providerTransactionId: data.providerTransactionId,
      providerPreferenceId: data.providerPreferenceId ?? null,
      method: data.method,
      status: data.status,
      amount: data.amount,
      netAmount: data.amount,
      installments: data.installments ?? null,
      expiresAt: data.expiresAt ?? null,
      rawPayload: data.rawPayload ?? null,
    },
  });
  return toTransactionJson(created);
}

function toTransactionJson(t: PaymentTransaction) {
  return {
    id: t.id,
    orderId: t.orderId,
    provider: t.provider as PaymentProvider,
    providerTransactionId: t.providerTransactionId,
    method: t.method as GatewayMethod,
    status: t.status as TransactionStatus,
    amount: Number(t.amount),
    feeAmount: Number(t.feeAmount),
    netAmount: Number(t.netAmount),
    installments: t.installments,
    expiresAt: t.expiresAt?.toISOString() ?? null,
    approvedAt: t.approvedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

// ===========================================================================
// settleApprovedTransaction — conciliação contábil (na MESMA transação Prisma)
// ===========================================================================

/**
 * Conciliação da aprovação (ESPEC-V2, Onda 3 item 4), chamada por
 * applyProviderStatus DENTRO da mesma transação Prisma:
 *  1. accounts_receivable do pedido → PAID (paidAt = approvedAt do provedor);
 *  2. Payment contábil: reaproveita o PENDING criado no checkout (vira PAID)
 *     ou cria um novo — e liga paymentTransaction.paymentId;
 *  3. Caixa: saída da taxa (categoria TAXA_GATEWAY) com paymentTransactionId.
 *     A ENTRADA BRUTA (categoria Vendas) tem dois caminhos para nunca duplicar:
 *     - pedido AWAITING_PAYMENT: quem cria a entrada é updateOrderStatus
 *       (chamado pós-commit pelo applyProviderStatus, que depois liga o
 *       paymentTransactionId nela);
 *     - pedido já pago por outro fluxo: a entrada já existe — apenas liga o
 *       paymentTransactionId; se não existir, cria aqui.
 */
export async function settleApprovedTransaction(
  tx: Prisma.TransactionClient,
  transaction: PaymentTransaction,
) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: transaction.orderId } });
  const approvedAt = transaction.approvedAt ?? new Date();
  const feeAmount = Number(transaction.feeAmount);

  // 1. Recebível quitado.
  await tx.accountReceivable.updateMany({
    where: { orderId: order.id, status: { in: ["OPEN", "PARTIAL", "OVERDUE"] } },
    data: { status: "PAID", receivedAmount: order.total, receivedAt: approvedAt },
  });

  // 2. Payment contábil (reaproveita o PENDING do checkout; cria se faltar).
  let payment = await tx.payment.findFirst({
    where: { orderId: order.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  if (payment) {
    payment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: approvedAt },
    });
  } else {
    payment = await tx.payment.findFirst({ where: { orderId: order.id, status: "PAID" } });
    if (!payment) {
      payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: transaction.amount,
          method: GATEWAY_TO_PAYMENT_METHOD[transaction.method as GatewayMethod] ?? "PIX",
          status: "PAID",
          paidAt: approvedAt,
        },
      });
    }
  }
  await tx.paymentTransaction.update({
    where: { id: transaction.id },
    data: { paymentId: payment.id },
  });

  // 3a. Entrada bruta — só quando o pedido NÃO passará por updateOrderStatus
  //     (ver doc da função). Guarda contra duplicidade: reutiliza se existir.
  if (order.status !== "AWAITING_PAYMENT") {
    const inflow = await tx.cashFlowEntry.findFirst({
      where: { orderId: order.id, type: "INFLOW" },
      orderBy: { createdAt: "asc" },
    });
    if (inflow) {
      if (!inflow.paymentTransactionId) {
        await tx.cashFlowEntry.update({
          where: { id: inflow.id },
          data: { paymentTransactionId: transaction.id },
        });
      }
    } else {
      await tx.cashFlowEntry.create({
        data: {
          type: "INFLOW",
          category: "Vendas",
          description: `Recebimento ${order.number} (gateway)`,
          amount: transaction.amount,
          date: approvedAt,
          orderId: order.id,
          paymentTransactionId: transaction.id,
        },
      });
    }
  }

  // 3b. Taxa do gateway destacada (DRE lê TAXA_GATEWAY como despesa do canal).
  if (feeAmount > 0) {
    const feeEntry = await tx.cashFlowEntry.findFirst({
      where: { paymentTransactionId: transaction.id, category: "TAXA_GATEWAY", type: "OUTFLOW" },
    });
    if (!feeEntry) {
      await tx.cashFlowEntry.create({
        data: {
          type: "OUTFLOW",
          category: "TAXA_GATEWAY",
          description: `Taxa ${PAYMENT_PROVIDER_LABEL[transaction.provider as PaymentProvider] ?? transaction.provider} — ${order.number}`,
          amount: feeAmount,
          date: approvedAt,
          orderId: order.id,
          paymentTransactionId: transaction.id,
        },
      });
    }
  }

  await logAudit(tx, {
    userId: null,
    action: "PAYMENT_REGISTER",
    entity: "PaymentTransaction",
    entityId: transaction.id,
    description: `Pagamento aprovado no gateway (${order.number}): R$ ${Number(transaction.amount).toFixed(2)}, taxa R$ ${feeAmount.toFixed(2)}`,
  });

  return order;
}

/**
 * Estorno de transação já CONCILIADA (REFUNDED/CHARGED_BACK): lançamentos
 * inversos no caixa (saída bruta + devolução da taxa), Payment → REFUNDED e
 * recebível → CANCELLED. A reposição de estoque acontece pós-commit via
 * updateOrderStatus (fluxo CUSTOMER_RETURN existente).
 */
async function reverseSettledTransaction(
  tx: Prisma.TransactionClient,
  transaction: PaymentTransaction,
  nextStatus: TransactionStatus,
) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: transaction.orderId } });
  const feeAmount = Number(transaction.feeAmount);

  await tx.cashFlowEntry.create({
    data: {
      type: "OUTFLOW",
      category: "Estornos",
      description: `Estorno gateway ${order.number} (${TRANSACTION_STATUS_LABEL[nextStatus]})`,
      amount: transaction.amount,
      orderId: order.id,
      paymentTransactionId: transaction.id,
    },
  });
  if (feeAmount > 0) {
    await tx.cashFlowEntry.create({
      data: {
        type: "INFLOW",
        category: "TAXA_GATEWAY",
        description: `Devolução de taxa — estorno ${order.number}`,
        amount: feeAmount,
        orderId: order.id,
        paymentTransactionId: transaction.id,
      },
    });
  }
  if (transaction.paymentId) {
    await tx.payment.update({
      where: { id: transaction.paymentId },
      data: { status: "REFUNDED" },
    });
  }
  await tx.accountReceivable.updateMany({
    where: { orderId: order.id },
    data: { status: "CANCELLED" },
  });

  await logAudit(tx, {
    userId: null,
    action: "PAYMENT_REGISTER",
    entity: "PaymentTransaction",
    entityId: transaction.id,
    description: `Estorno no gateway (${order.number}): ${TRANSACTION_STATUS_LABEL[nextStatus]}, R$ ${Number(transaction.amount).toFixed(2)}`,
  });

  return order;
}

// ===========================================================================
// applyProviderStatus
// ===========================================================================

const remoteStatusSchema = z.object({
  status: transactionStatusSchema,
  feeAmount: z.number().min(0).optional(),
  approvedAt: z.coerce.date().optional().nullable(),
  rawPayload: z.string().optional().nullable(),
});

export type RemoteStatusInput = z.input<typeof remoteStatusSchema>;

/**
 * Aplica um status vindo do PROVEDOR (nunca do payload do webhook) com a
 * máquina monotônica. Em APPROVED, chama settleApprovedTransaction NA MESMA
 * transação Prisma.
 *
 * A transição do PEDIDO acontece via updateOrderStatus APÓS o commit
 * (sequencial), nunca dentro da nossa transação. Motivo: updateOrderStatus é o
 * dono da lógica canônica de consumo de reservas + movimentos SALE e abre a
 * PRÓPRIA prisma.$transaction — chamá-lo aqui dentro aninharia transações, e
 * reimplementar a lógica duplicaria a invariante "venda exige estoque".
 * Consequência aceita: se o processo cair entre o commit e o updateOrderStatus,
 * a transação fica APPROVED com pedido AWAITING_PAYMENT — o reprocessamento é
 * idempotente e repara exatamente esse caso (bloco `repair` abaixo).
 */
export async function applyProviderStatus(transactionId: string, remote: RemoteStatusInput) {
  const parsed = remoteStatusSchema.parse(remote);

  type PostCommit = { orderId: string; next: OrderStatus; note: string; linkInflow: boolean };
  type ApplyResult = { applied: boolean; status: TransactionStatus; postCommit: PostCommit | null };

  const result = await prisma.$transaction(async (tx): Promise<ApplyResult> => {
    const transaction = await tx.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { order: { select: { id: true, status: true, number: true } } },
    });
    if (!transaction) throw new Error("Transação de pagamento não encontrada.");

    const current = transaction.status as TransactionStatus;
    const next = parsed.status;

    if (!canTransition(current, next)) {
      // Reparo idempotente: transação já APPROVED mas o pedido ainda aguarda
      // (falha entre o commit anterior e o updateOrderStatus pós-commit).
      if (current === "APPROVED" && next === "APPROVED" && transaction.order.status === "AWAITING_PAYMENT") {
        return {
          applied: false,
          status: current,
          postCommit: {
            orderId: transaction.orderId,
            next: "PAID",
            note: "Pagamento aprovado pelo gateway (reprocessamento)",
            linkInflow: true,
          },
        };
      }
      return { applied: false, status: current, postCommit: null };
    }

    if (next === "APPROVED") {
      const feeAmount = parsed.feeAmount ?? Number(transaction.feeAmount);
      const updated = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "APPROVED",
          feeAmount,
          netAmount: Number(transaction.amount) - feeAmount,
          approvedAt: parsed.approvedAt ?? new Date(),
          rawPayload: parsed.rawPayload ?? transaction.rawPayload,
        },
      });
      await settleApprovedTransaction(tx, updated);
      const postCommit: PostCommit | null =
        transaction.order.status === "AWAITING_PAYMENT"
          ? {
              orderId: transaction.orderId,
              next: "PAID",
              note: "Pagamento aprovado pelo gateway",
              linkInflow: true,
            }
          : null;
      return { applied: true, status: next, postCommit };
    }

    if (REVERSAL_STATUSES.has(next)) {
      const updated = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: next, rawPayload: parsed.rawPayload ?? transaction.rawPayload },
      });
      // Lançamentos inversos só fazem sentido se houve conciliação (paymentId).
      // PARTIALLY_REFUNDED não estorna valores no scaffolding: o valor parcial
      // depende de dado do provedor — tratado quando a integração real ligar.
      let postCommit: PostCommit | null = null;
      if (updated.paymentId && next !== "PARTIALLY_REFUNDED") {
        await reverseSettledTransaction(tx, updated, next);
        const orderStatus = transaction.order.status as OrderStatus;
        const cancelTarget: OrderStatus | null =
          orderStatus === "PAID" || orderStatus === "SEPARATING" || orderStatus === "AWAITING_PAYMENT"
            ? "CANCELLED"
            : orderStatus === "SHIPPED" || orderStatus === "DELIVERED"
              ? "RETURNED"
              : null;
        if (cancelTarget) {
          postCommit = {
            orderId: transaction.orderId,
            next: cancelTarget,
            note: `Estorno no gateway (${TRANSACTION_STATUS_LABEL[next]})`,
            linkInflow: false,
          };
        }
      }
      return { applied: true, status: next, postCommit };
    }

    // Terminais a partir de CREATED/PENDING: nada foi conciliado — só o status.
    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: next, rawPayload: parsed.rawPayload ?? transaction.rawPayload },
    });
    return { applied: true, status: next, postCommit: null };
  });

  // Pós-commit SEQUENCIAL (ver doc da função).
  if (result.postCommit) {
    const { orderId, next, note, linkInflow } = result.postCommit;
    await updateOrderStatus(orderId, next, SYSTEM_USER_ID, note);
    if (linkInflow) {
      // updateOrderStatus criou a entrada bruta no caixa — liga a conciliação.
      await prisma.cashFlowEntry.updateMany({
        where: { orderId, type: "INFLOW", paymentTransactionId: null },
        data: { paymentTransactionId: transactionId },
      });
    }
  }

  return { applied: result.applied, status: result.status };
}

// ===========================================================================
// fetchRemoteStatus — consulta autenticada ao provedor (NUNCA confiar em webhook)
// ===========================================================================

export interface RemoteTransactionStatus {
  status: TransactionStatus;
  amount: number | null;
  feeAmount: number;
  approvedAt: Date | null;
  expiresAt: Date | null;
  externalReference: string | null;
  method: GatewayMethod | null;
  installments: number | null;
  /** Payload bruto serializado (/// pii — TTL de 90 dias no cron). */
  rawPayload: string;
}

/** Status do Mercado Pago → status canônico da transação. */
const MP_STATUS_MAP: Record<string, TransactionStatus> = {
  pending: "PENDING",
  approved: "APPROVED",
  authorized: "PENDING",
  in_process: "PENDING",
  in_mediation: "PENDING",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "CHARGED_BACK",
  expired: "EXPIRED",
};

function mapMpMethod(paymentMethodId: string | null, paymentTypeId: string | null): GatewayMethod | null {
  if (paymentMethodId === "pix") return "PIX";
  switch (paymentTypeId) {
    case "credit_card":
    case "debit_card":
      return "CREDIT_CARD";
    case "ticket":
      return "BOLETO";
    case "account_money":
    case "digital_wallet":
    case "digital_currency":
      return "WALLET";
    default:
      return null;
  }
}

/**
 * Consulta o status ATUAL da transação na API do provedor.
 * - MERCADO_PAGO: GET /v1/payments/{id} com Bearer MP_ACCESS_TOKEN;
 * - sem MP_ACCESS_TOKEN no ambiente → retorna null SEM tocar a rede
 *   (modo scaffolding — o caller registra o evento como IGNORED);
 * - PIX_CRESOL/MANUAL não têm API remota → null.
 */
export async function fetchRemoteStatus(
  provider: PaymentProvider,
  providerTransactionId: string,
): Promise<RemoteTransactionStatus | null> {
  if (provider !== "MERCADO_PAGO") return null;

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(providerTransactionId)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Mercado Pago respondeu ${res.status} ao consultar o pagamento ${providerTransactionId}.`);
  }
  const payload: {
    status?: string;
    transaction_amount?: number;
    transaction_amount_refunded?: number;
    fee_details?: { amount?: number }[];
    date_approved?: string;
    date_of_expiration?: string;
    external_reference?: string;
    payment_method_id?: string;
    payment_type_id?: string;
    installments?: number;
  } = await res.json();

  let status = MP_STATUS_MAP[payload.status ?? ""] ?? "PENDING";
  // Estorno parcial: o MP mantém status "approved" com valor estornado > 0.
  const refunded = Number(payload.transaction_amount_refunded ?? 0);
  const amount = Number(payload.transaction_amount ?? 0);
  if (status === "APPROVED" && refunded > 0 && refunded < amount) {
    status = "PARTIALLY_REFUNDED";
  }

  const feeAmount = (payload.fee_details ?? []).reduce((sum, f) => sum + Number(f.amount ?? 0), 0);

  return {
    status,
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    feeAmount,
    approvedAt: payload.date_approved ? new Date(payload.date_approved) : null,
    expiresAt: payload.date_of_expiration ? new Date(payload.date_of_expiration) : null,
    externalReference: payload.external_reference ?? null,
    method: mapMpMethod(payload.payment_method_id ?? null, payload.payment_type_id ?? null),
    installments: payload.installments ?? null,
    rawPayload: JSON.stringify(payload),
  };
}

// ===========================================================================
// expireStalePayments — cron único de expiração (transações + reservas + pedidos)
// ===========================================================================

/**
 * Expira em lote (idempotente — re-rodável sem efeito duplo):
 *  1. transações CREATED/PENDING com expiresAt vencido → EXPIRED;
 *  2. reservas ACTIVE vencidas → EXPIRED (libera o disponível SEM tocar o ledger);
 *  3. pedidos AWAITING_PAYMENT das transações expiradas → CANCELLED via
 *     updateOrderStatus PÓS-COMMIT (sequencial — mesma razão documentada em
 *     applyProviderStatus), com note "PAYMENT_EXPIRED".
 */
export async function expireStalePayments() {
  const now = new Date();

  const { staleOrders, expiredTransactions, expiredReservations } = await prisma.$transaction(
    async (tx) => {
      const stale = await tx.paymentTransaction.findMany({
        where: { status: { in: ["CREATED", "PENDING"] }, expiresAt: { lt: now } },
        select: { id: true, orderId: true, order: { select: { status: true } } },
      });
      if (stale.length > 0) {
        await tx.paymentTransaction.updateMany({
          where: { id: { in: stale.map((t) => t.id) } },
          data: { status: "EXPIRED" },
        });
      }

      const reservations = await tx.stockReservation.updateMany({
        where: { status: "ACTIVE", expiresAt: { lt: now } },
        data: { status: "EXPIRED" },
      });

      const orders = [
        ...new Set(stale.filter((t) => t.order.status === "AWAITING_PAYMENT").map((t) => t.orderId)),
      ];
      return {
        staleOrders: orders,
        expiredTransactions: stale.length,
        expiredReservations: reservations.count,
      };
    },
  );

  // Pós-commit sequencial: cancelamento canônico (libera reservas restantes,
  // cancela financeiro pendente, grava histórico e auditoria).
  let cancelledOrders = 0;
  for (const orderId of staleOrders) {
    try {
      await updateOrderStatus(orderId, "CANCELLED", SYSTEM_USER_ID, "PAYMENT_EXPIRED");
      cancelledOrders += 1;
    } catch {
      // Corrida benigna: o pedido mudou de status (ex.: pagou) entre a leitura
      // e o cancelamento — a transição inválida é rejeitada e seguimos.
    }
  }

  return { expiredTransactions, expiredReservations, cancelledOrders };
}

// ===========================================================================
// listTransactions — visão de conciliação (JSON-safe para a tela)
// ===========================================================================

export const transactionFilterSchema = z.object({
  status: transactionStatusSchema.optional(),
  provider: providerSchema.optional(),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

/**
 * Transações para a tela de conciliação (/admin/financeiro/transacoes):
 * linhas JSON-safe com o último evento de webhook em ERRO anexado (habilita a
 * ação "Reprocessar") + resumo (aprovado, taxas, pendentes, expiradas).
 * O resumo respeita o filtro de provedor, mas não o de status (os cards
 * comparam os status entre si).
 */
export async function listTransactions(filters: TransactionFilterInput = {}) {
  const parsed = transactionFilterSchema.parse(filters);
  const providerWhere = parsed.provider ? { provider: parsed.provider } : {};

  const [transactions, approvedAgg, pendingAgg, expiredCount] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where: { ...providerWhere, ...(parsed.status ? { status: parsed.status } : {}) },
      include: { order: { select: { id: true, number: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.paymentTransaction.aggregate({
      where: { ...providerWhere, status: "APPROVED" },
      _sum: { amount: true, feeAmount: true, netAmount: true },
      _count: { _all: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: { ...providerWhere, status: { in: ["CREATED", "PENDING"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.paymentTransaction.count({ where: { ...providerWhere, status: "EXPIRED" } }),
  ]);

  // Último evento de webhook em ERRO por recurso do provedor.
  const resourceIds = transactions.map((t) => t.providerTransactionId);
  const errorEvents =
    resourceIds.length > 0
      ? await prisma.webhookEvent.findMany({
          where: { status: "ERROR", providerResourceId: { in: resourceIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];
  const errorByResource = new Map<string, (typeof errorEvents)[number]>();
  for (const event of errorEvents) {
    const key = `${event.provider}|${event.providerResourceId}`;
    if (!errorByResource.has(key)) errorByResource.set(key, event);
  }

  const rows = transactions.map((t) => {
    const errorEvent = errorByResource.get(`${t.provider}|${t.providerTransactionId}`) ?? null;
    return {
      ...toTransactionJson(t),
      orderNumber: t.order.number,
      errorEvent: errorEvent
        ? {
            id: errorEvent.id,
            errorMessage: errorEvent.errorMessage,
            attempts: errorEvent.attempts,
            createdAt: errorEvent.createdAt.toISOString(),
          }
        : null,
    };
  });

  return {
    rows,
    summary: {
      approvedGross: Number(approvedAgg._sum.amount ?? 0),
      approvedFees: Number(approvedAgg._sum.feeAmount ?? 0),
      approvedNet: Number(approvedAgg._sum.netAmount ?? 0),
      approvedCount: approvedAgg._count._all,
      pendingAmount: Number(pendingAgg._sum.amount ?? 0),
      pendingCount: pendingAgg._count._all,
      expiredCount,
    },
  };
}

export type TransactionRow = Awaited<ReturnType<typeof listTransactions>>["rows"][number];
export type TransactionsSummary = Awaited<ReturnType<typeof listTransactions>>["summary"];
