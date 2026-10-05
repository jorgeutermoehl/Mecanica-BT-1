import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Abstração de storage de arquivos (ESPEC-V2, Onda 2 item 9).
 * LocalDriver grava em ./uploads (fora de public/, gitignored) e o handler
 * /api/media/[...key] serve com Content-Type derivado do MediaFile no banco.
 * SupabaseStorageDriver entra pela MESMA interface quando o deploy for
 * serverless (STORAGE_DRIVER=supabase) — o disco da Vercel é efêmero.
 */

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

/**
 * Supabase Storage (bucket PÚBLICO de leitura; escrita só com a service role
 * no servidor). URLs apontam direto para a CDN do Supabase.
 */
class SupabaseDriver implements StorageDriver {
  private client: SupabaseClient;
  constructor(
    private url: string,
    serviceKey: string,
    private bucket: string,
  ) {
    this.client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  async put(key: string, data: Buffer): Promise<void> {
    const contentType = key.endsWith(".webp")
      ? "image/webp"
      : key.endsWith(".png")
        ? "image/png"
        : key.endsWith(".avif")
          ? "image/avif"
          : "image/jpeg";
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, data, { contentType, upsert: true, cacheControl: "31536000" });
    if (error) throw new Error(`Falha ao enviar arquivo ao storage: ${error.message}`);
  }

  async delete(key: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([key]);
  }

  async read(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) throw new Error("Arquivo não encontrado.");
    return Buffer.from(await data.arrayBuffer());
  }

  publicUrl(key: string): string {
    return `${this.url.replace(/\/$/, "")}/storage/v1/object/public/${this.bucket}/${key}`;
  }
}

let cached: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  if (cached) return cached;
  if (process.env.STORAGE_DRIVER === "supabase") {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "media";
    if (!url || !key) throw new Error("STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    cached = new SupabaseDriver(url, key, bucket);
  } else {
    cached = new LocalDriver();
  }
  return cached;
}
