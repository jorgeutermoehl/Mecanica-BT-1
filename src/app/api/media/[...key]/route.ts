import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStorageDriver } from "@/server/storage";

/**
 * Servidor de mídia local (ESPEC-V2, Onda 2 item 9). Segurança obrigatória:
 * - storageKey validado por regex ESTRITA + path confinado (anti traversal);
 * - Content-Type derivado do MediaFile no BANCO (nunca da extensão da URL);
 * - X-Content-Type-Options: nosniff em tudo;
 * - PDF sai como attachment; kind=ATTACHMENT exige staff autenticado.
 */

const KEY_PATTERN = /^[a-z0-9/_-]+\.(webp|jpg|png|avif|pdf)$/;

/** Mapa fechado de tipos servíveis — nada fora daqui sai deste handler. */
const SERVABLE: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  pdf: "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  if (!KEY_PATTERN.test(key) || key.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // A chave pode apontar para o original (storageKey) ou para uma variante
  // (<pasta-do-original>/<variant>.webp) — o dono do registro é o MediaFile
  // cujo storageKey compartilha a mesma pasta.
  const folder = key.slice(0, key.lastIndexOf("/"));
  const media = await prisma.mediaFile.findFirst({
    where: { storageKey: { startsWith: `${folder}/` }, deletedAt: null },
  });
  if (!media) return new NextResponse("Not found", { status: 404 });

  if (media.kind === "ATTACHMENT") {
    const session = await getSession();
    if (!session) return new NextResponse("Not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = await getStorageDriver().read(key);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = key.slice(key.lastIndexOf(".") + 1);
  // Variantes são sempre webp geradas por nós; o original usa o mimeType do banco.
  const contentType =
    key === media.storageKey ? media.mimeType : (SERVABLE[ext] ?? "application/octet-stream");
  if (!Object.values(SERVABLE).includes(contentType)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    // Chave é content-addressed — pode cachear para sempre.
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  if (contentType === "application/pdf") {
    headers.set("Content-Disposition", "attachment");
  }

  return new NextResponse(new Uint8Array(data), { status: 200, headers });
}
