/**
 * MKA.P-MS Investissement — battement de cœur (pont OS, règle MOS #13).
 *
 * Remonte l'état réel au registre central via os-bridge.ts, comme
 * contract-os/country-os/etc. Aucun accès à la logique interne depuis
 * l'extérieur : uniquement cette surface publique.
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import type { ControlCenterFeed, MaturityLevel } from "../identity-os/contract.js";
import { investments } from "./schema.js";

const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

export const INVESTMENT_META = {
  name: "investment" as const,
  label: "Investment Engine" as const,
  version: VERSION,
  maturityLevel: MATURITY,
  contract: "server/investment/router.ts",
};

export async function healthStatus() {
  const debut = Date.now();
  let statut: "ok" | "degraded" | "down" = "ok";
  let actifs = 0;
  try {
    const rows = await db.select().from(investments).where(eq(investments.status, "ACTIVE"));
    actifs = rows.length;
  } catch {
    statut = "degraded";
  }
  return {
    engine: "investment" as const,
    version: VERSION,
    status: statut,
    checkedAt: new Date().toISOString(),
    metrics: { actifs, responseMs: Date.now() - debut },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const debut = Date.now();
  const h = await healthStatus();
  return {
    engine: INVESTMENT_META.name,
    label: INVESTMENT_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: h.metrics.actifs },
    performance: { lastResponseMs: Date.now() - debut },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "staging",
  };
}
