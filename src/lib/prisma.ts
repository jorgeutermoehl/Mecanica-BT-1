import { PrismaClient } from "@prisma/client";

/**
 * Instância única do Prisma Client. Em desenvolvimento, reaproveita a
 * instância global para evitar criar conexões a cada hot-reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
