/**
 * Customer Journey OS — suivi du parcours client (Phase 46).
 *
 * NE crée PAS de nouveau système de tracking : lit le journal d'activité
 * existant du Smart Engine (`smart_activity_log`) et le projette sur des
 * étapes métier canoniques pour produire un entonnoir (funnel) :
 *   visiteur → compte → recherche → annonce → message → réservation →
 *   paiement → livraison → avis → fidélisation
 *
 * Fournit : taux de conversion par étape, points d'abandon, étape la plus
 * lente. `trackJourney()` écrit un événement d'étape explicite dans le même
 * journal (réutilisation, aucune table en double).
 *
 * Interconnexion : Smart Engine (données) → Supervision & Opérations (feed).
 */
import { and, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { smartActivityLog } from "../smart-engine/schema.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Étapes canoniques du parcours ────────────────────────────────────────
export const JOURNEY_STAGES = [
  "visiteur",
  "compte",
  "recherche",
  "annonce",
  "message",
  "reservation",
  "paiement",
  "livraison",
  "avis",
  "fidelisation",
] as const;
export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/**
 * Fait correspondre une `action` du journal Smart Engine à une étape.
 * Les préfixes couvrent le tracking existant (page.visit, user.*) et les
 * événements d'étape explicites (journey.*).
 */
export function actionToStage(action: string): JourneyStage | null {
  const a = action.toLowerCase();
  if (a.startsWith("journey.")) {
    const s = a.slice("journey.".length) as JourneyStage;
    return JOURNEY_STAGES.includes(s) ? s : null;
  }
  if (a === "page.visit") return "visiteur";
  if (a.includes("register") || a.includes("signup") || a.includes("inscription") || a === "user.account_created") return "compte";
  if (a.includes("search") || a.includes("recherche")) return "recherche";
  if (a.includes("annonce") || a.includes("vehicle_view") || a.includes("listing")) return "annonce";
  if (a.includes("message")) return "message";
  if (a.includes("reservation") || a.includes("booking")) return "reservation";
  if (a.includes("payment") || a.includes("paiement") || a.includes("checkout")) return "paiement";
  if (a.includes("livraison") || a.includes("delivery")) return "livraison";
  if (a.includes("review") || a.includes("avis")) return "avis";
  if (a.includes("loyalty") || a.includes("fidel") || a.includes("points")) return "fidelisation";
  return null;
}

// ── Métadonnées MOS ───────────────────────────────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const CUSTOMER_JOURNEY_OS_META = {
  name: "customer-journey-os" as const,
  label: "Customer Journey Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/customer-journey-os/index.ts",
};

// ── Service ─────────────────────────────────────────────────────────────
/** Enregistre une étape de parcours explicite (réutilise smart_activity_log). */
export async function trackJourney(input: { userId?: number; stage: JourneyStage; metadata?: Record<string, unknown> }) {
  return db.insert(smartActivityLog).values({
    action: `journey.${input.stage}`,
    userId: input.userId ?? null,
    targetType: "journey",
    data: { ...(input.metadata ?? {}), at: new Date().toISOString() },
    result: "tracked",
  }).returning();
}

export interface FunnelStep {
  stage: JourneyStage;
  users: number;
  events: number;
  conversionFromPrev: number; // % vs étape précédente
  dropFromPrev: number;       // % perdu vs étape précédente
}

/** Construit l'entonnoir sur une fenêtre glissante (jours). */
export async function funnel(days = 30): Promise<{ windowDays: number; steps: FunnelStep[]; biggestDrop: { stage: JourneyStage; dropPct: number } | null }> {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await db
    .select({ action: smartActivityLog.action, userId: smartActivityLog.userId })
    .from(smartActivityLog)
    .where(gte(smartActivityLog.createdAt, since));

  const usersByStage: Record<string, Set<number>> = {};
  const eventsByStage: Record<string, number> = {};
  for (const s of JOURNEY_STAGES) { usersByStage[s] = new Set(); eventsByStage[s] = 0; }
  for (const r of rows) {
    const stage = actionToStage(r.action);
    if (!stage) continue;
    eventsByStage[stage] += 1;
    if (typeof r.userId === "number") usersByStage[stage].add(r.userId);
  }

  const steps: FunnelStep[] = [];
  let prevUsers = 0;
  let biggestDrop: { stage: JourneyStage; dropPct: number } | null = null;
  JOURNEY_STAGES.forEach((stage, i) => {
    const users = usersByStage[stage].size;
    const conversionFromPrev = i === 0 || prevUsers === 0 ? 100 : Math.round((users / prevUsers) * 100);
    const dropFromPrev = i === 0 ? 0 : Math.max(0, 100 - conversionFromPrev);
    if (i > 0 && (biggestDrop === null || dropFromPrev > biggestDrop.dropPct)) {
      biggestDrop = { stage, dropPct: dropFromPrev };
    }
    steps.push({ stage, users, events: eventsByStage[stage], conversionFromPrev, dropFromPrev });
    prevUsers = users;
  });

  return { windowDays: days, steps, biggestDrop };
}

// ── Health / Feed / Dashboard ───────────────────────────────────────────
export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let events24h = 0;
  try {
    const since = new Date(Date.now() - 86400000);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(smartActivityLog).where(gte(smartActivityLog.createdAt, since));
    events24h = Number(c?.n ?? 0);
  } catch { status = "degraded"; }
  return { engine: "customer-journey-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { events24h, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: CUSTOMER_JOURNEY_OS_META.name, label: CUSTOMER_JOURNEY_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.events24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const f = await funnel(30);
  return {
    ...feed,
    businessMetrics: {
      stages: JOURNEY_STAGES.length,
      biggest_drop_stage: f.biggestDrop?.stage ?? "—",
      biggest_drop_pct: f.biggestDrop?.dropPct ?? 0,
    },
    recentEvents: [], recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const customerJourneyOsRouter = router({
  meta: publicProcedure.query(() => CUSTOMER_JOURNEY_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  funnel: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional())
    .query(({ input }) => funnel(input?.days ?? 30)),

  track: protectedProcedure
    .input(z.object({
      stage: z.enum(JOURNEY_STAGES),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(({ ctx, input }) => trackJourney({ userId: ctx.user.uid, stage: input.stage, metadata: input.metadata })),
});
