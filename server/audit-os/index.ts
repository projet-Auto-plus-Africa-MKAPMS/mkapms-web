/**
 * Audit OS — journal d'audit centralisé (Phase 49).
 *
 * Couche de requête, reporting et surface MOS AU-DESSUS du journal existant
 * `audit_logs` (voir `server/audit.ts`). N'introduit NI table NI second moteur :
 * réutilise `logAction`/`clientMeta` et enrichit chaque entrée avec `result`
 * et `durationMs` rangés dans `metadata` (colonne jsonb existante).
 *
 * Interconnexion : Supervision & Opérations (feed MOS).
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { auditLogs } from "../schema.js";
import { logAction, type ClientMeta } from "../audit.js";
import { publicProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

/**
 * Enregistre une action auditée avec résultat et durée (Phase 49 : utilisateur,
 * date, IP, appareil, résultat, durée). Additif — délègue à `logAction`.
 */
export async function record(input: {
  actorId: number | null;
  action: string;
  entityType?: string;
  entityId?: number | null;
  result?: "success" | "failure" | "denied";
  durationMs?: number;
  metadata?: Record<string, unknown>;
  meta?: ClientMeta;
}): Promise<void> {
  const metadata = {
    ...(input.metadata ?? {}),
    result: input.result ?? "success",
    ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
  };
  await logAction(input.actorId, input.action, input.entityType, input.entityId, metadata, input.meta);
}

export async function query(filters?: {
  actorId?: number;
  entityType?: string;
  action?: string;
  sinceDays?: number;
  limit?: number;
}) {
  const conds = [];
  if (typeof filters?.actorId === "number") conds.push(eq(auditLogs.actorId, filters.actorId));
  if (filters?.entityType) conds.push(eq(auditLogs.entityType, filters.entityType));
  if (filters?.action) conds.push(eq(auditLogs.action, filters.action));
  if (filters?.sinceDays) conds.push(gte(auditLogs.createdAt, new Date(Date.now() - filters.sinceDays * 86400000)));
  const base = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(filters?.limit ?? 100);
  return conds.length ? base.where(and(...conds)) : base;
}

export async function stats(days = 7) {
  const since = new Date(Date.now() - days * 86400000);
  const [total] = await db.select({ n: sql<number>`count(*)::int` }).from(auditLogs).where(gte(auditLogs.createdAt, since));
  const byAction = await db
    .select({ action: auditLogs.action, n: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(gte(auditLogs.createdAt, since))
    .groupBy(auditLogs.action)
    .orderBy(sql`count(*) desc`)
    .limit(15);
  const [failures] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(and(gte(auditLogs.createdAt, since), sql`${auditLogs.metadata}->>'result' in ('failure','denied')`));
  return { windowDays: days, total: Number(total?.n ?? 0), failures: Number(failures?.n ?? 0), topActions: byAction };
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const AUDIT_OS_META = {
  name: "audit-os" as const,
  label: "Audit Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/audit-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let total24h = 0, failures24h = 0;
  try {
    const since = new Date(Date.now() - 86400000);
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(auditLogs).where(gte(auditLogs.createdAt, since));
    total24h = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(auditLogs).where(and(gte(auditLogs.createdAt, since), sql`${auditLogs.metadata}->>'result' in ('failure','denied')`));
    failures24h = Number(b?.n ?? 0);
  } catch { status = "degraded"; }
  return { engine: "audit-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { total24h, failures24h, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: AUDIT_OS_META.name, label: AUDIT_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.total24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: h.metrics.failures24h },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const st = await stats(7);
  return { ...feed, businessMetrics: { events_7d: st.total, failures_7d: st.failures, distinct_actions: st.topActions.length }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const auditOsRouter = router({
  meta: publicProcedure.query(() => AUDIT_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  query: adminProcedure
    .input(z.object({
      actorId: z.number().int().positive().optional(),
      entityType: z.string().max(64).optional(),
      action: z.string().max(128).optional(),
      sinceDays: z.number().int().min(1).max(365).optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }).optional())
    .query(({ input }) => query(input)),

  stats: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }).optional())
    .query(({ input }) => stats(input?.days ?? 7)),
});
