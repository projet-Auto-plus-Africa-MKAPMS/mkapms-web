/**
 * AI Learning OS — supervision de l'apprentissage (Phase 54).
 *
 * NE CRÉE AUCUN second moteur de décision. L'apprentissage réel est déjà porté
 * par le Système Intelligent (Smart Engine) : données apprises, leçons du PDG,
 * connaissances, base officielle, optimisations. AI Learning OS est une couche
 * de LECTURE qui agrège ces tables existantes et expose la surface MOS standard.
 *
 * Règle fondamentale (Phase 54) : le moteur n'applique jamais seul une règle
 * métier sensible — toute optimisation reste `proposed` jusqu'à validation
 * humaine (déjà garanti par `smart_optimizations.status`). Cette couche est
 * strictement en lecture seule : elle observe, elle ne décide pas.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  smartKbEntries,
  smartKnowledge,
  smartLearnedData,
  smartOptimizations,
  smartTeachings,
} from "../smart-engine/schema.js";
import { adminProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

/** Ce que le système a appris et retenu, réparti par nature (Phase 54). */
export async function summary() {
  const [learned] = await db.select({ n: sql<number>`count(*)::int` }).from(smartLearnedData);
  const [learnedConfirmed] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartLearnedData)
    .where(eq(smartLearnedData.status, "confirmed"));
  const [kb] = await db.select({ n: sql<number>`count(*)::int` }).from(smartKbEntries);
  const [kbConfirmed] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartKbEntries)
    .where(eq(smartKbEntries.status, "confirmed"));
  const [lessons] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartTeachings)
    .where(eq(smartTeachings.isLesson, true));
  const [knowledge] = await db.select({ n: sql<number>`count(*)::int` }).from(smartKnowledge);
  const [optProposed] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartOptimizations)
    .where(eq(smartOptimizations.status, "proposed"));
  const [optApplied] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartOptimizations)
    .where(eq(smartOptimizations.status, "applied"));
  return {
    // apprentissages (véhicules, pièces, comportements…)
    learned: Number(learned?.n ?? 0),
    learnedConfirmed: Number(learnedConfirmed?.n ?? 0),
    knowledgeBase: Number(kb?.n ?? 0),
    knowledgeBaseConfirmed: Number(kbConfirmed?.n ?? 0),
    // corrections / préférences enseignées par le PDG
    lessons: Number(lessons?.n ?? 0),
    externalKnowledge: Number(knowledge?.n ?? 0),
    // améliorations : proposées (attente validation humaine) vs validées
    improvementsProposed: Number(optProposed?.n ?? 0),
    improvementsApplied: Number(optApplied?.n ?? 0),
  };
}

/** Dernières améliorations proposées, en attente de validation humaine. */
export async function pendingImprovements(limit = 50) {
  return db
    .select({
      id: smartOptimizations.id,
      category: smartOptimizations.category,
      title: smartOptimizations.title,
      impact: smartOptimizations.impact,
      status: smartOptimizations.status,
      createdAt: smartOptimizations.createdAt,
    })
    .from(smartOptimizations)
    .where(eq(smartOptimizations.status, "proposed"))
    .orderBy(desc(smartOptimizations.createdAt))
    .limit(limit);
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_2_complete";
export const AI_LEARNING_OS_META = {
  name: "ai-learning-os" as const,
  label: "AI Learning Operating System" as const,
  version: VERSION,
  maturityLevel: MATURITY,
  contract: "server/ai-learning-os/index.ts",
  // Rappel : lecture seule, aucune décision autonome sur les règles sensibles.
  readOnly: true as const,
  humanValidationRequired: true as const,
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let pending = 0;
  try {
    const su = await summary();
    pending = su.improvementsProposed;
  } catch {
    status = "degraded";
  }
  return {
    engine: "ai-learning-os" as const,
    version: VERSION,
    status,
    checkedAt: new Date().toISOString(),
    metrics: { pendingImprovements: pending, responseMs: Date.now() - s },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: AI_LEARNING_OS_META.name,
    label: AI_LEARNING_OS_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const su = await summary();
  return {
    ...feed,
    businessMetrics: {
      learned: su.learned,
      learned_confirmed: su.learnedConfirmed,
      knowledge_base: su.knowledgeBase,
      lessons: su.lessons,
      improvements_proposed: su.improvementsProposed,
      improvements_applied: su.improvementsApplied,
    },
    recentEvents: [],
    recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const aiLearningOsRouter = router({
  meta: publicProcedure.query(() => AI_LEARNING_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  summary: adminProcedure.query(() => summary()),
  pendingImprovements: adminProcedure.query(() => pendingImprovements()),
});
