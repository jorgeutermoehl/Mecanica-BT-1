import { promises as fs } from "fs";
import path from "path";

/**
 * Abstração de storage de arquivos (ESPEC-V2, Onda 2 item 9).
 * LocalDriver grava em ./uploads (fora de public/, gitignored) e o handler
 * /api/media/[...key] serve com Content-Type derivado do MediaFile no banco.
 * SupabaseStorageDriver entra pela MESMA interface quando o deploy for
 * serverless (env STORAGE_DRIVER) — pré-requisito de go-live nesse caso.
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

export function getStorageDriver(): StorageDriver {
  // STORAGE_DRIVER=supabase entra aqui quando o SupabaseStorageDriver existir.
  return new LocalDriver();
}
