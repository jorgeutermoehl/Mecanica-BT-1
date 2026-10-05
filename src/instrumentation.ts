import { assertProductionEnv } from "@/lib/env";

/** Roda uma vez no boot do servidor Next. */
export function register() {
  assertProductionEnv();
}
