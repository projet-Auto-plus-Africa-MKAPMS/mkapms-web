/**
 * MKA.P-MS Smart Engine — Router TRPC
 *
 * Nom visible : "Système Intelligent MKA.P-MS"
 * Nom technique : "MKA.P-MS Smart Engine"
 *
 * Jamais afficher : IA, ChatGPT, OpenAI, Devin, Manus, robot.
 * Seul nom visible : "Système Intelligent MKA.P-MS"
 *
 * Accès Centre de contrôle : PDG uniquement (super_admin).
 *
 * Le système ne peut PAS seul :
 * - supprimer un compte / une entreprise / une annonce sensible
 * - modifier les prix / abonnements / contrats
 * - prendre une décision financière importante
 * Ces actions nécessitent validation humaine.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure, pdgProcedure } from "../trpc.js";

// Services
import { logSearch, getSearchesWithoutResults, getTopSearches, getSearchStats } from "./services/search-analytics.js";
import { saveMemory, getUserMemory, recordView, recordSearch } from "./services/user-memory.js";
import { generateRecommendations, getUserRecommendations, markRecommendationSeen, markRecommendationClicked } from "./services/recommendations.js";
import { learnFromInput, getPendingValidations, validateLearned, getConfirmedValues } from "./services/learning.js";
import { checkDuplicates, getUnresolvedDuplicates, resolveDuplicate } from "./services/duplicate-detection.js";
import { findDuplicatePhotos, indexAllPhotos } from "./services/photo-analysis.js";
import { checkFraud, getUnresolvedSuspects, resolveSuspect } from "./services/fraud-detection.js";
import { getActivityLog, getActivityStats, validateActivity } from "./services/activity-log.js";
import { analyzeReviews, getReviewAlerts } from "./services/review-analysis.js";
import { validateAnnonceUnivers, getMisplacedAnnonces } from "./services/annonce-validator.js";
import { validateBadges, getBadgeAlerts } from "./services/badge-validator.js";
import { reportHealthCheck, getHealthStatus, getBrokenElements, registerCriticalElements } from "./services/health-monitor.js";
import { trackPageVisit, trackUserAction, getPageStats, getUserBehaviorProfile, getActiveUsers, getPlatformPulse } from "./services/behavior-tracking.js";
import { teach, getConversation, getTeachingStats } from "./services/teaching.js";
import { seedKnowledge, addKnowledge, listKnowledge, markApplied, getKnowledgeStats, KNOWLEDGE_CATEGORIES } from "./services/knowledge.js";
import { getEnginesOverview } from "./services/connectors.js";
import { observe, listKB, kbStats, validateKB, KB_DOMAINS } from "./services/knowledge-base.js";
import { generateOptimizations, listOptimizations, optimizationStats, reviewOptimization } from "./services/auto-optimization.js";
import { getPlatformHealth } from "./services/platform-health.js";
// Renforts (activation)
import { assertRate, sanitizeTeachMessage } from "./services/rate-limiter.js"; // P9
import { runRetention, retentionCounters } from "./services/retention.js"; // P7
import { runAlertScan, alertLevelStats } from "./services/alert-engine.js";
import { scanDevelopments, getDevLearningStats, listDevItems, reviewDevItem, reviewAllRequises } from "./services/dev-learning.js";
import { runQualityAudit, getQualityOverview, listQualityAudits } from "./services/quality-engine.js"; // P12
import { db } from "../db.js";
import { smartAlerts } from "./schema.js";
import { desc, eq, sql, and } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════════════
// ROUTER — Système Intelligent MKA.P-MS
// ═══════════════════════════════════════════════════════════════════════

export const smartEngineRouter = router({
  // ── 1. Analyse des recherches ──────────────────────────────────────
  logSearch: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      filters: z.record(z.unknown()).optional(),
      ville: z.string().optional(),
      pays: z.string().optional(),
      rayon: z.number().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      resultCount: z.number(),
      clickedAnnonceId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return logSearch({ ...input, userId: ctx.user?.uid });
    }),

  searchStats: pdgProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      return getSearchStats(input?.days ?? 30);
    }),

  topSearches: pdgProcedure
    .input(z.object({ days: z.number().default(30), limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      return getTopSearches(input?.days ?? 30, input?.limit ?? 20);
    }),

  failedSearches: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getSearchesWithoutResults(input?.limit ?? 50);
    }),

  // ── 2. Mémoire utilisateur ─────────────────────────────────────────
  recordView: protectedProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return recordView(ctx.user.uid, input.annonceId);
    }),

  myMemory: protectedProcedure
    .input(z.object({
      type: z.enum(["search", "filter", "view", "alert", "need"]).optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      return getUserMemory(ctx.user.uid, input?.type, input?.limit ?? 50);
    }),

  // ── 3. Recommandations ─────────────────────────────────────────────
  generateRecommendations: protectedProcedure
    .mutation(async ({ ctx }) => {
      return generateRecommendations(ctx.user.uid);
    }),

  myRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserRecommendations(ctx.user.uid, input?.limit ?? 20);
    }),

  markRecoSeen: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return markRecommendationSeen(input.id);
    }),

  markRecoClicked: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return markRecommendationClicked(input.id);
    }),

  // ── 4. Apprentissage dépôt ─────────────────────────────────────────
  learn: protectedProcedure
    .input(z.object({
      field: z.string(),
      marque: z.string().optional(),
      modele: z.string().optional(),
      value: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return learnFromInput({ ...input, submittedBy: ctx.user.uid });
    }),

  pendingValidations: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getPendingValidations(input?.limit ?? 50);
    }),

  validateLearned: pdgProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ input }) => {
      return validateLearned(input.id, input.approved);
    }),

  confirmedValues: publicProcedure
    .input(z.object({ field: z.string(), marque: z.string().optional(), modele: z.string().optional() }))
    .query(async ({ input }) => {
      return getConfirmedValues(input.field, input.marque, input.modele);
    }),

  // ── 5. Détection doublons ──────────────────────────────────────────
  checkDuplicates: adminProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ input }) => {
      return checkDuplicates(input.annonceId);
    }),

  unresolvedDuplicates: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getUnresolvedDuplicates(input?.limit ?? 50);
    }),

  resolveDuplicate: pdgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return resolveDuplicate(input.id, ctx.user.uid);
    }),

  // ── 6. Reconnaissance photo ────────────────────────────────────────
  checkPhotoDuplicates: adminProcedure
    .input(z.object({ annonceId: z.number(), photoData: z.string() }))
    .mutation(async ({ input }) => {
      return findDuplicatePhotos(input.annonceId, input.photoData);
    }),

  indexPhotos: adminProcedure
    .input(z.object({ annonceId: z.number(), photos: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      return indexAllPhotos(input.annonceId, input.photos);
    }),

  // ── 7. Détection faux comptes ──────────────────────────────────────
  checkFraud: adminProcedure
    .input(z.object({
      userId: z.number(),
      email: z.string().optional(),
      phone: z.string().optional(),
      ip: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return checkFraud(input);
    }),

  unresolvedSuspects: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getUnresolvedSuspects(input?.limit ?? 50);
    }),

  resolveSuspect: pdgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return resolveSuspect(input.id, ctx.user.uid);
    }),

  // ── 8. Centre de contrôle — Alertes ────────────────────────────────
  alerts: pdgProcedure
    .input(z.object({
      category: z.string().optional(),
      severity: z.enum(["info", "warning", "important", "critical"]).optional(),
      status: z.enum(["open", "acknowledged", "resolved", "dismissed"]).optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      if (input?.category) conditions.push(eq(smartAlerts.category, input.category));
      if (input?.severity) conditions.push(eq(smartAlerts.severity, input.severity));
      if (input?.status) conditions.push(eq(smartAlerts.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(smartAlerts).where(where).orderBy(desc(smartAlerts.createdAt)).limit(input?.limit ?? 50);
    }),

  resolveAlert: pdgProcedure
    .input(z.object({ id: z.number(), status: z.enum(["acknowledged", "resolved", "dismissed"]) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(smartAlerts).set({
        status: input.status,
        resolvedBy: ctx.user.uid,
        resolvedAt: new Date(),
      }).where(eq(smartAlerts.id, input.id));
      return { ok: true };
    }),

  alertStats: pdgProcedure.query(async () => {
    const [stats] = await db.select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open')::int`,
      critical: sql<number>`count(*) filter (where ${smartAlerts.severity} = 'critical' and ${smartAlerts.status} = 'open')::int`,
      warning: sql<number>`count(*) filter (where ${smartAlerts.severity} = 'warning' and ${smartAlerts.status} = 'open')::int`,
    }).from(smartAlerts);
    return stats;
  }),

  // ── 9. Journal d'activité ──────────────────────────────────────────
  activityLog: pdgProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      return getActivityLog(input?.limit ?? 100, input?.offset ?? 0);
    }),

  activityStats: pdgProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      return getActivityStats(input?.days ?? 30);
    }),

  validateActivityDecision: pdgProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return validateActivity(input.id, input.approved, ctx.user.uid);
    }),

  // ── 10. Analyse des avis ───────────────────────────────────────────
  analyzeReviews: pdgProcedure
    .mutation(async () => {
      return analyzeReviews();
    }),

  reviewAlerts: pdgProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      return getReviewAlerts(input?.limit ?? 20);
    }),

  // ── 11. Validation annonces (bon univers) ──────────────────────────
  validateUnivers: pdgProcedure
    .mutation(async () => {
      return validateAnnonceUnivers();
    }),

  misplacedAnnonces: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getMisplacedAnnonces(input?.limit ?? 50);
    }),

  // ── 12. Validation badges ──────────────────────────────────────────
  validateBadges: pdgProcedure
    .mutation(async () => {
      return validateBadges();
    }),

  badgeAlerts: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getBadgeAlerts(input?.limit ?? 50);
    }),

  // ── 13. Surveillance santé ─────────────────────────────────────────
  reportHealth: adminProcedure
    .input(z.object({
      page: z.string(),
      element: z.string(),
      elementType: z.string(),
      status: z.enum(["ok", "broken", "slow", "missing"]),
      errorDetails: z.string().optional(),
      suggestedFix: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return reportHealthCheck(input);
    }),

  healthStatus: pdgProcedure.query(async () => {
    return getHealthStatus();
  }),

  brokenElements: pdgProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getBrokenElements(input?.limit ?? 50);
    }),

  registerCriticalElements: pdgProcedure
    .mutation(async () => {
      return registerCriticalElements();
    }),

  // ── 15. Suivi comportemental ─────────────────────────────────────
  trackPage: publicProcedure
    .input(z.object({
      page: z.string(),
      referrer: z.string().optional(),
      duration: z.number().optional(),
      device: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return trackPageVisit({ ...input, userId: ctx.user?.uid });
    }),

  trackAction: publicProcedure
    .input(z.object({
      action: z.string(),
      target: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return trackUserAction({ ...input, userId: ctx.user?.uid });
    }),

  pageStats: pdgProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      return getPageStats(input?.days ?? 30);
    }),

  activeUsers: pdgProcedure.query(async () => {
    return getActiveUsers(15);
  }),

  userBehavior: pdgProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return getUserBehaviorProfile(input.userId);
    }),

  platformPulse: pdgProcedure
    .input(z.object({ days: z.number().default(7) }).optional())
    .query(async ({ input }) => {
      return getPlatformPulse(input?.days ?? 7);
    }),

  // ── Dashboard global (Centre de contrôle) ──────────────────────────
  dashboard: pdgProcedure.query(async () => {
    const [alertStats] = await db.select({
      totalAlerts: sql<number>`count(*)::int`,
      openAlerts: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open')::int`,
      criticalAlerts: sql<number>`count(*) filter (where ${smartAlerts.severity} = 'critical' and ${smartAlerts.status} = 'open')::int`,
    }).from(smartAlerts);

    const searchStatsData = await getSearchStats(30);
    const activityStatsData = await getActivityStats(30);
    const healthData = await getHealthStatus();
    const pulseData = await getPlatformPulse(7);
    const activeUsersData = await getActiveUsers(15);

    return {
      alerts: alertStats,
      searches: searchStatsData,
      activity: activityStatsData,
      health: { broken: healthData.broken, slow: healthData.slow, ok: healthData.ok, total: healthData.total },
      pulse: pulseData,
      activeUsers: activeUsersData.length,
    };
  }),

  // ── 15. Apprentissage privé PDG (chat PDG ↔ Système Intelligent) ────
  teach: pdgProcedure
    .input(z.object({ message: z.string().min(1).max(4000), topic: z.string().max(128).optional() }))
    .mutation(async ({ ctx, input }) => {
      // Renfort P9 — anti-spam : 30 messages / minute maximum par PDG.
      assertRate(`teach:${ctx.user.uid}`, { max: 30, windowMs: 60_000 });
      const cleaned = sanitizeTeachMessage(input.message) ?? input.message;
      return teach({ authorId: ctx.user.uid, message: cleaned, topic: input.topic });
    }),

  teachingConversation: pdgProcedure
    .input(z.object({ limit: z.number().default(100) }).optional())
    .query(async ({ input }) => {
      return getConversation(input?.limit ?? 100);
    }),

  teachingStats: pdgProcedure.query(async () => {
    return getTeachingStats();
  }),

  // ── 16. Connaissances externes (veille / benchmark) ────────────────
  knowledgeList: pdgProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(200) }).optional())
    .query(async ({ input }) => {
      return listKnowledge(input?.category, input?.limit ?? 200);
    }),

  knowledgeStats: pdgProcedure.query(async () => {
    return getKnowledgeStats();
  }),

  addKnowledge: pdgProcedure
    .input(z.object({
      category: z.enum(KNOWLEDGE_CATEGORIES),
      source: z.string().max(160).optional(),
      insight: z.string().min(1).max(4000),
      recommendation: z.string().max(4000).optional(),
      url: z.string().max(512).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return addKnowledge({ ...input, addedBy: ctx.user.uid });
    }),

  markKnowledgeApplied: pdgProcedure
    .input(z.object({ id: z.number(), applied: z.boolean() }))
    .mutation(async ({ input }) => {
      return markApplied(input.id, input.applied);
    }),

  seedKnowledge: pdgProcedure.mutation(async () => {
    return seedKnowledge();
  }),

  // ── Moteurs connectés (hub d'observation) ─────────────────────
  enginesOverview: pdgProcedure.query(async () => {
    return getEnginesOverview();
  }),

  // ── 17. Base de connaissances officielle (Parties 6 & 7) ───────────
  // Apprentissage automatique : n'importe quel module peut « observer »
  // une donnée. Best-effort, jamais bloquant.
  kbObserve: publicProcedure
    .input(z.object({
      domain: z.enum(KB_DOMAINS),
      type: z.string().min(1).max(48),
      value: z.string().min(1).max(320),
      parentKey: z.string().max(320).optional(),
      attributes: z.record(z.unknown()).optional(),
      source: z.string().max(48).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return observe({ ...input, userId: ctx.user?.uid });
    }),

  kbList: pdgProcedure
    .input(z.object({
      domain: z.string().optional(),
      status: z.enum(["proposed", "confirmed", "rejected"]).optional(),
      limit: z.number().default(200),
    }).optional())
    .query(async ({ input }) => {
      return listKB(input?.domain, input?.status, input?.limit ?? 200);
    }),

  kbStats: pdgProcedure.query(async () => {
    return kbStats();
  }),

  kbValidate: pdgProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ input }) => {
      return validateKB(input.id, input.approved);
    }),

  // ── 18. Auto-optimisation (Partie 8) ─────────────────────────────
  // Le Smart Engine PROPOSE ; le PDG applique ou rejette. Aucune règle
  // métier n'est modifiée automatiquement.
  optimizationsGenerate: pdgProcedure.mutation(async () => {
    return generateOptimizations();
  }),

  optimizationsList: pdgProcedure
    .input(z.object({
      category: z.string().optional(),
      status: z.enum(["proposed", "applied", "rejected"]).optional(),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      return listOptimizations(input?.category, input?.status, input?.limit ?? 100);
    }),

  optimizationStats: pdgProcedure.query(async () => {
    return optimizationStats();
  }),

  optimizationReview: pdgProcedure
    .input(z.object({ id: z.number(), decision: z.enum(["applied", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      return reviewOptimization(input.id, input.decision, ctx.user.uid);
    }),

  // ── 19. Tableau de santé plateforme temps réel (Partie 9) ─────────
  platformHealth: pdgProcedure.query(async () => {
    return getPlatformHealth();
  }),

  // ── 20. Système d'alerte à niveaux (Partie 10) ───────────────────
  alertScan: pdgProcedure.mutation(async () => {
    return runAlertScan();
  }),

  alertLevelStats: pdgProcedure.query(async () => {
    return alertLevelStats();
  }),

  // ── 21. Apprentissage des développements (Partie 11) ─────────────
  // Détecte automatiquement APIs / tables réelles, comprend leur fonction,
  // les ajoute à la surveillance et signale les permissions manquantes.
  devLearningScan: pdgProcedure.mutation(async () => {
    return scanDevelopments();
  }),

  devLearningStats: pdgProcedure.query(async () => {
    return getDevLearningStats();
  }),

  devLearningList: pdgProcedure
    .input(
      z
        .object({
          kind: z.enum(["moteur", "table", "api", "page", "bouton", "formulaire"]).optional(),
          permission: z.enum(["definie", "requise", "publique", "na"]).optional(),
          status: z.enum(["nouveau", "surveille", "ignore"]).optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return listDevItems(input ?? {});
    }),

  devLearningReview: pdgProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["nouveau", "surveille", "ignore"]).optional(),
        permission: z.enum(["definie", "requise", "publique", "na"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return reviewDevItem({
        id: input.id,
        status: input.status,
        permission: input.permission,
        acknowledgedBy: ctx.user.uid,
      });
    }),

  // Marque en une fois TOUTES les permissions « à définir » comme définies
  // (ou publiques). Évite de cliquer 100 fois ; la décision est verrouillée.
  devLearningReviewAll: pdgProcedure
    .input(
      z
        .object({ permission: z.enum(["definie", "publique"]).optional() })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      return reviewAllRequises({
        permission: input?.permission,
        acknowledgedBy: ctx.user.uid,
      });
    }),

  // ── Renfort P7 — Rétention des logs Smart Engine (PDG uniquement) ────
  // Le PDG seul décide quand purger ; aucune purge automatique.
  retentionCounters: pdgProcedure.query(async () => {
    return retentionCounters();
  }),

  retentionRun: pdgProcedure
    .input(
      z
        .object({
          searchLogsDays: z.number().int().min(30).optional(),
          activityLogDays: z.number().int().min(30).optional(),
          photoFingerprintsDays: z.number().int().min(30).optional(),
        })
        .optional(),
    )
    .mutation(async ({ input }) => {
      return runRetention(input ?? {});
    }),

  // ── 22. Moteur Qualité (Partie 12) ───────────────────────────────
  // Mesure la qualité réelle de la plateforme (annonces, photos, prix,
  // confiance, doublons, santé, avis). 100% lecture seule ; aucune action
  // automatique. Le PDG lance l'audit et consulte les scores.
  qualityAuditRun: pdgProcedure.mutation(async ({ ctx }) => {
    return runQualityAudit(ctx.user.uid);
  }),

  qualityOverview: pdgProcedure.query(async () => {
    return getQualityOverview();
  }),

  qualityList: pdgProcedure
    .input(
      z
        .object({
          category: z
            .enum([
              "annonces",
              "photos",
              "descriptions",
              "prix",
              "confiance",
              "doublons",
              "sante",
              "avis",
            ])
            .optional(),
          limit: z.number().default(100),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return listQualityAudits(input?.category, input?.limit ?? 100);
    }),
});
