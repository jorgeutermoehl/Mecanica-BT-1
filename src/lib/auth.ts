import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Autenticação do painel (login local): sessão JWT assinada em cookie
 * httpOnly. Senhas com hash bcrypt em User.passwordHash.
 * Uso exclusivo em código de servidor (server components / actions).
 */

const COOKIE_NAME = "fb_session";
const SESSION_DAYS = 7;

/** Papéis com acesso ao painel administrativo. */
const STAFF_ROLES = new Set(["admin", "gerente", "vendedor", "estoquista", "financeiro"]);

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Nunca assinar sessão com segredo público fora do dev.
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET não configurado.");
    return new TextEncoder().encode("fullboost-dev-secret-change-me-in-production");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string; // slug do papel (admin, gerente...)
};

type SessionToken = SessionUser & { issuedAt: number };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Valida credenciais e retorna o usuário staff, ou null. */
export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { role: true },
  });
  if (!user || !user.isActive || user.deletedAt || !user.passwordHash) return null;
  if (!user.role || !STAFF_ROLES.has(user.role.slug)) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role.slug };
}

export async function createSession(user: SessionUser): Promise<void> {
  // `ms`: emissão com precisão de milissegundos (iat do JWT é em segundos) —
  // compara com passwordChangedAt sem janela de tolerância.
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role, ms: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Token da sessão atual (ou null). Não consulta o banco. */
async function readSessionToken(): Promise<SessionToken | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: (payload.name as string) ?? "",
      email: (payload.email as string) ?? "",
      role: (payload.role as string) ?? "",
      issuedAt: typeof payload.ms === "number" ? payload.ms : (payload.iat ?? 0) * 1000,
    };
  } catch {
    return null;
  }
}

/** Sessão atual (ou null). Não consulta o banco — lê o token assinado. */
export async function getSession(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  return { id: token.id, name: token.name, email: token.email, role: token.role };
}

/**
 * Revalida a sessão contra o banco: usuário ativo, papel staff (ou o papel
 * exigido) e token emitido DEPOIS da última troca de senha (trocar a senha
 * derruba as sessões abertas em outros aparelhos). Papel vem do banco.
 */
async function loadStaff(requiredRole?: string): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  const user = await prisma.user.findUnique({ where: { id: token.id }, include: { role: true } });
  if (!user || !user.isActive || user.deletedAt || !user.role || !STAFF_ROLES.has(user.role.slug)) {
    return null;
  }
  if (requiredRole && user.role.slug !== requiredRole) return null;
  if (user.passwordChangedAt && token.issuedAt < user.passwordChangedAt.getTime()) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role.slug };
}

/** Para páginas do painel: staff válido no banco ou null (o layout redireciona). */
export async function getStaffUser(): Promise<SessionUser | null> {
  return loadStaff();
}

/**
 * Garante staff autenticado (para actions do painel). Revalida contra o banco
 * (usuário pode ter sido desativado após emitir o token).
 */
export async function requireStaff(): Promise<SessionUser> {
  const token = await readSessionToken();
  if (!token) throw new Error("NOT_AUTHENTICATED");
  const user = await loadStaff();
  if (!user) throw new Error("NOT_AUTHORIZED");
  return user;
}

/**
 * Separação de dever para ações destrutivas/financeiras (ESPEC-V2, Onda 3
 * item 17): estornos, reprocessamento de webhook, limpeza de mídia, merge.
 * Operação diária continua em requireStaff().
 */
export async function requireRole(roleSlug: string): Promise<SessionUser> {
  const token = await readSessionToken();
  if (!token) throw new Error("NOT_AUTHENTICATED");
  const user = await loadStaff(roleSlug);
  if (!user) throw new Error("NOT_AUTHORIZED");
  return user;
}
