/**
 * Support OS — centralisation du support (Phase 47).
 *
 * Ne duplique PAS le support existant : les tickets restent dans
 * `support_tickets` (`server/routers/support.ts`), les litiges dans le module
 * `disputes`. Support OS ajoute la couche transversale : priorités
 * (critique/élevée/normale/faible), file d'attente triée, suivi (SLA),
 * statistiques et surface MOS standard.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { supportTickets } from "../schema.js";
import { logAction } from "../audit.js";
import { adminProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

export const SUPPORT_PRIORITIES = ["critique", "elevee", "normale", "faible"] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
const PRIORITY_RANK: Record<string, number> = { critique: 0, elevee: 1, normale: 2, faible: 3 };
const OPEN_STATUSES = ["ouvert", "en_cours"] as const;

/** File d'attente triée par priorité puis ancienneté (tickets non clos). */
export async function queue(limit = 100) {
  const rows = await db
    .select()
    .from(supportTickets)
    .where(inArray(supportTickets.status, [...OPEN_STATUSES]))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit);
  return rows.sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2);
    if (pr !== 0) return pr;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export async function setPriority(id: number, priority: SupportPriority, actorId: number) {
  const [row] = await db
    .update(supportTickets)
    .set({ priority, updatedAt: new Date() })
    .where(eq(supportTickets.id, id))
    .returning();
  await logAction(actorId, "support.priority", "support_ticket", id, { priority });
  return row;
}

export async function stats() {
  const byStatus = await db
    .select({ status: supportTickets.status, n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .groupBy(supportTickets.status);
  const byPriority = await db
    .select({ priority: supportTickets.priority, n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(inArray(supportTickets.status, [...OPEN_STATUSES]))
    .groupBy(supportTickets.priority);
  const [openCritical] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(and(eq(supportTickets.priority, "critique"), inArray(supportTickets.status, [...OPEN_STATUSES])));
  const [open] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(inArray(supportTickets.status, [...OPEN_STATUSES]));
  return {
    byStatus,
    byPriority,
    openCritical: Number(openCritical?.n ?? 0),
    open: Number(open?.n ?? 0),
  };
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_2_complete";
export const SUPPORT_OS_META = {
  name: "support-os" as const,
  label: "Support Operating System" as const,
  version: VERSION,
  maturityLevel: MATURITY,
  contract: "server/support-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let open = 0, openCritical = 0;
  try {
    const st = await stats();
    open = st.open;
    openCritical = st.openCritical;
    if (openCritical > 0) status = "degraded";
  } catch {
    status = "degraded";
  }
  return { engine: "support-os" as const, version: VERSION, status, checkedAt: new Date().toISOString(), metrics: { open, openCritical, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: SUPPORT_OS_META.name,
    label: SUPPORT_OS_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: h.metrics.open },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: h.metrics.openCritical },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const st = await stats();
  return {
    ...feed,
    businessMetrics: { open: st.open, open_critical: st.openCritical },
    recentEvents: [],
    recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const supportOsRouter = router({
  meta: publicProcedure.query(() => SUPPORT_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  priorities: publicProcedure.query(() => SUPPORT_PRIORITIES),

  queue: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(({ input }) => queue(input?.limit ?? 100)),

  setPriority: adminProcedure
    .input(z.object({ id: z.number().int().positive(), priority: z.enum(SUPPORT_PRIORITIES) }))
    .mutation(({ ctx, input }) => setPriority(input.id, input.priority, ctx.user.uid)),

  stats: adminProcedure.query(() => stats()),
});
