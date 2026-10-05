import { IS_STAGING, SITE, whatsappLink } from "@/lib/constants";

/**
 * E-mail transacional via Resend (HTTP API, sem SDK).
 * Opcional: sem RESEND_API_KEY + EMAIL_FROM tudo vira no-op (retorna false) —
 * a venda nunca depende do e-mail. Destino interno da loja: STORE_NOTIFY_EMAIL.
 */

type Mail = { to: string; subject: string; html: string; replyTo?: string };

function configured(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return apiKey && from ? { apiKey, from } : null;
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  const cfg = configured();
  if (!cfg) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cfg.from,
        to: [mail.to],
        subject: IS_STAGING ? `[TESTE] ${mail.subject}` : mail.subject,
        html: mail.html,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[email] Resend respondeu", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("[email] falha ao enviar", e);
    return false;
  }
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function layout(title: string, body: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
  <h2 style="margin:0 0 16px">${esc(title)}</h2>${body}
  <p style="margin-top:24px;font-size:12px;color:#666">${esc(SITE.name)}</p></div>`;
}

export async function notifyStoreNewContact(m: {
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
}): Promise<boolean> {
  const to = process.env.STORE_NOTIFY_EMAIL;
  if (!to) return false;
  return sendEmail({
    to,
    replyTo: m.email ?? undefined,
    subject: `Contato pelo site: ${m.subject ?? "sem assunto"}`,
    html: layout(
      "Nova mensagem pelo site",
      `<p><b>${esc(m.name)}</b> · ${esc(m.email ?? "")} · ${esc(m.phone ?? "")}</p>
       <p style="white-space:pre-wrap">${esc(m.message)}</p>`,
    ),
  });
}

export type OrderMail = {
  number: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  total: number;
  items: { name: string; quantity: number; total: number }[];
};

/** Pedido recebido: confirmação para o cliente + aviso para a loja. */
export async function sendOrderReceivedEmails(order: OrderMail): Promise<void> {
  const rows = order.items
    .map((i) => `<tr><td>${i.quantity}× ${esc(i.name)}</td><td style="text-align:right">${brl(i.total)}</td></tr>`)
    .join("");
  const table = `<table style="width:100%;border-collapse:collapse">${rows}
    <tr><td><b>Total</b></td><td style="text-align:right"><b>${brl(order.total)}</b></td></tr></table>`;
  const wa = whatsappLink(`Olá! Quero finalizar o pagamento do pedido ${order.number}.`);

  const tasks: Promise<boolean>[] = [];
  if (order.customerEmail) {
    tasks.push(
      sendEmail({
        to: order.customerEmail,
        subject: `Recebemos seu pedido ${order.number}`,
        html: layout(
          `Pedido ${order.number} recebido`,
          `<p>Olá, ${esc(order.customerName)}! Suas peças estão reservadas por 72h.</p>${table}
           <p>Para finalizar o pagamento (Pix ou cartão) e confirmar o frete,
           <a href="${esc(wa)}">fale com a gente no WhatsApp</a>.</p>`,
        ),
      }),
    );
  }
  const store = process.env.STORE_NOTIFY_EMAIL;
  if (store) {
    tasks.push(
      sendEmail({
        to: store,
        subject: `Novo pedido ${order.number} — ${brl(order.total)}`,
        html: layout(
          `Novo pedido ${order.number}`,
          `<p>${esc(order.customerName)} · ${esc(order.customerPhone ?? "")} · ${esc(order.customerEmail ?? "")}</p>${table}`,
        ),
      }),
    );
  }
  await Promise.allSettled(tasks);
}
