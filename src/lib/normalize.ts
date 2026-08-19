/**
 * Normalização de identificadores de cliente (identity resolution).
 * Regra: valor que não normaliza com segurança vira `null` (não-matchável) —
 * nunca gravar meia-normalização que gere match errado.
 */

/** CPF (11 dígitos) ou CNPJ (14 dígitos) — retorna só dígitos ou null. */
export function normalizeDocument(document?: string | null): string | null {
  if (!document) return null;
  const digits = document.replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 14) return null;
  // Sequências repetidas (000..., 111...) são placeholders comuns, não documentos.
  if (/^(\d)\1+$/.test(digits)) return null;
  return digits;
}

/**
 * Telefone brasileiro em E.164 (+5511999998888).
 * Aceita com/sem DDI 55, com/sem zero de operadora; fixo (10) ou celular (11).
 */
export function normalizePhoneBR(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  return `+55${digits}`;
}

/** Handle do Instagram: sem @, lowercase, charset oficial (letras, números, ponto, underline). */
export function normalizeInstagramHandle(handle?: string | null): string | null {
  if (!handle) return null;
  const clean = handle.trim().replace(/^@+/, "").toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(clean)) return null;
  return clean;
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  return clean.includes("@") ? clean : null;
}

/** Chave de dedupe de endereço: CEP + número + complemento normalizados. */
export function addressDedupeKey(a: {
  zipCode: string;
  number?: string | null;
  complement?: string | null;
}): string {
  const zip = a.zipCode.replace(/\D/g, "");
  const num = (a.number ?? "").trim().toLowerCase();
  const comp = (a.complement ?? "").trim().toLowerCase();
  return `${zip}|${num}|${comp}`;
}
