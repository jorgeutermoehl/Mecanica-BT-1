import { promises as fs } from "fs";
import path from "path";

/**
 * Abstração de storage de arquivos (ESPEC-V2, Onda 2 item 9).
 * LocalDriver grava em ./uploads (fora de public/, gitignored) e o handler
 * /api/media/[...key] serve com Content-Type derivado do MediaFile no banco.
 * SupabaseStorageDriver (STORAGE_DRIVER=supabase) grava em um bucket PRIVADO;
 * a leitura continua passando por /api/media (que valida tipo e permissões).
 * Obrigatório em deploy serverless (Vercel): o disco lá é efêmero.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface StorageDriver {
  put(key: string, data: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  publicUrl(key: string): string;
}

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

/** Confina QUALQUER chave ao diretório de uploads (anti path traversal). */
export function resolveSafe(key: string): string {
  const resolved = path.resolve(UPLOADS_ROOT, key);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep) && resolved !== UPLOADS_ROOT) {
    throw new Error("Chave de arquivo inválida.");
  }
  return resolved;
}

class LocalDriver implements StorageDriver {
  async put(key: string, data: Buffer): Promise<void> {
    const target = resolveSafe(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(resolveSafe(key));
    } catch {
      // arquivo já ausente — delete é idempotente
    }
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(resolveSafe(key));
  }

  publicUrl(key: string): string {
    return `/api/media/${key}`;
  }
}

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  pdf: "application/pdf",
};

class SupabaseDriver implements StorageDriver {
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    }
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "media";
    this.client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  async put(key: string, data: Buffer): Promise<void> {
    const ext = key.slice(key.lastIndexOf(".") + 1);
    const { error } = await this.client.storage.from(this.bucket).upload(key, data, {
      contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
      upsert: true,
    });
    if (error) throw new Error(`Falha ao gravar arquivo: ${error.message}`);
  }

  async delete(key: string): Promise<void> {
    // remove() é idempotente: chave ausente não gera erro.
    await this.client.storage.from(this.bucket).remove([key]);
  }

  async read(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) throw new Error("Arquivo não encontrado.");
    return Buffer.from(await data.arrayBuffer());
  }

  publicUrl(key: string): string {
    return `/api/media/${key}`;
  }
}

let driver: StorageDriver | undefined;

export function getStorageDriver(): StorageDriver {
  driver ??= process.env.STORAGE_DRIVER === "supabase" ? new SupabaseDriver() : new LocalDriver();
  return driver;
}
