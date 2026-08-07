/**
 * Monitoring OS — surveillance permanente (Phase 48).
 *
 * Agrège la santé réelle de la plateforme (API, base, moteurs, paiements,
 * temps de réponse, erreurs) SANS dupliquer les moteurs existants : il compose
 * `getPlatformHealth()` (Smart Engine) et les statistiques du registre central.
 * En cas d'anomalie critique, `scan()` crée une alerte dans `smart_alerts`
 * (dédupliquée) — aucune nouvelle table, aucun second moteur d'alerte.
 *
 * Interconnexion : Supervision & Opérations (feed MOS).
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { publicProcedure, adminProcedure, router } from "../trpc.js";
import { getPlatformHealth } from "../smart-engine/services/platform-health.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { getStats } from "../engine-registry/service.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

export interface MonitoringOverview {
  generatedAt: string;
  overall: "green" | "yellow" | "red";
  categories: { key: string; label: string; level: "green" | "yellow" | "red"; headline: string; detail: string }[];
  engines: { total: number; healthy: number; degraded: number; down: number };
}

/** Vue consolidée : santé plateforme + état des moteurs du registre. */
export async function overview(): Promise<MonitoringOverview> {
  const health = await getPlatformHealth();
  let engines = { total: 0, healthy: 0, degraded: 0, down: 0 };
  try {
    const stats = await getStats();
    const total = Number(stats.totalEngines ?? 0);
    const degraded = Number(stats.degradedEngines ?? 0);
    const down = Number(stats.downEngines ?? 0);
    engines = { total, healthy: Math.max(0, total - degraded - down), degraded, down };
  } catch { /* registre indisponible : non bloquant */ }
  return { generatedAt: health.generatedAt, overall: health.overall, categories: health.categories, engines };
}

/**
 * Analyse et crée une alerte pour chaque catégorie « rouge » non déjà signalée
 * (déduplication par titre sur 24h). Retourne le nombre d'alertes créées.
 */
export async function scan(): Promise<{ scanned: number; created: number; overall: string }> {
  const ov = await overview();
  const reds = ov.categories.filter((c) => c.level === "red");
  let created = 0;
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const c of reds) {
    const title = `Monitoring : ${c.label} en anomalie`;
    const [existing] = await db.select({ id: smartAlerts.id }).from(smartAlerts)
      .where(and(eq(smartAlerts.category, "erreur"), eq(smartAlerts.title, title), eq(smartAlerts.status, "open"), gte(smartAlerts.createdAt, since24h)))
      .limit(1);
    if (existing) continue;
    await db.insert(smartAlerts).values({
      category: "erreur",
      title,
      description: `${c.headline} — ${c.detail}`,
      severity: "critical",
      status: "open",
      targetType: "page",
      metadata: { source: "monitoring-os", key: c.key },
    });
    created += 1;
  }
  return { scanned: ov.categories.length, created, overall: ov.overall };
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const MONITORING_OS_META = {
  name: "monitoring-os" as const,
  label: "Monitoring Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/monitoring-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let overall = "green", reds = 0;
  try {
    const ov = await overview();
    overall = ov.overall;
    reds = ov.categories.filter((c) => c.level === "red").length;
  } catch { status = "degraded"; }
  // Le moteur de supervision rapporte l'état rouge de la plateforme via
  // `attention` ; cela ne signifie pas que le moteur lui-même est en panne.
  return { engine: "monitoring-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { overall, reds, attention: overall === "red", responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: MONITORING_OS_META.name, label: MONITORING_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: h.metrics.reds },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const ov = await overview();
  return { ...feed, businessMetrics: { engines: ov.engines.total, engines_degraded: ov.engines.degraded, engines_down: ov.engines.down, categories_red: ov.categories.filter((c) => c.level === "red").length }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const monitoringOsRouter = router({
  meta: publicProcedure.query(() => MONITORING_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  overview: adminProcedure.query(() => overview()),
  scan: adminProcedure.mutation(() => scan()),
});
