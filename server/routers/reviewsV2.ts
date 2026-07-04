/**
 * Router Avis Universel MKA.P-MS — v2
 * Module 100% indépendant couvrant les 34 points + indice de confiance.
 */
import { z } from "zod";
import { and, desc, eq, gte, lte, sql, or, ne, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure, directionProcedure, proProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  reviewsV2,
  reviewHistory,
  reviewCriteriaTemplates,
  reviewRequests,
  reviewReports,
  reviewContestations,
  reviewHelpful,
  reviewAggregates,
  reviewMonthlyStats,
  reviewTrustScores,
  reviewBadgeDefinitions,
  reviewBadgesAwarded,
  reviewObjectives,
  reviewEmployees,
  reviewExitSurveys,
  reviewFeatureSatisfaction,
  reviewConfig,
  reviewWebhooks,
  reviewWebhookLogs,
  reviewUniversRegistry,
  users,
  notifications,
} from "../schema.js";
import { awardPoints } from "./operations.js";

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const MOTS_INTERDITS = [
  "connard", "salaud", "escroc", "voleur", "merde", "putain",
  "enculé", "nique", "bâtard", "pute", "ntm", "fdp",
];

function containsBadWords(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return MOTS_INTERDITS.some((mot) => lower.includes(mot));
}

function detectLoyaltyTier(createdAt: Date, transactionCount: number): string {
  const ageMonths = (Date.now() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000);
  if (transactionCount >= 20 && ageMonths >= 12) return "vip";
  if (transactionCount >= 10 && ageMonths >= 6) return "fidele";
  if (transactionCount >= 3) return "regular";
  return "new";
}

async function recordHistory(reviewId: number, action: string, actorId: number | null, prevData?: any, newData?: any) {
  await db.insert(reviewHistory).values({ reviewId, action, actorId, previousData: prevData, newData });
}

async function recomputeAggregates(targetType: string, targetId: number, univers: string) {
  const allReviews = await db
    .select({
      ratingGlobal: reviewsV2.ratingGlobal,
      criterias: reviewsV2.criterias,
      verified: reviewsV2.verified,
      responseText: reviewsV2.responseText,
    })
    .from(reviewsV2)
    .where(
      and(
        eq(reviewsV2.targetType, targetType),
        eq(reviewsV2.targetId, targetId),
        eq(reviewsV2.univers, univers),
        eq(reviewsV2.status, "publie"),
        eq(reviewsV2.visibility, "public"),
      ),
    );

  const total = allReviews.length;
  const sum = allReviews.reduce((a, r) => a + r.ratingGlobal, 0);
  const avg = total > 0 ? Math.round((sum / total) * 100) : 0;
  const r5 = allReviews.filter((r) => r.ratingGlobal === 5).length;
  const r4 = allReviews.filter((r) => r.ratingGlobal === 4).length;
  const r3 = allReviews.filter((r) => r.ratingGlobal === 3).length;
  const r2 = allReviews.filter((r) => r.ratingGlobal === 2).length;
  const r1 = allReviews.filter((r) => r.ratingGlobal === 1).length;
  const verifiedCt = allReviews.filter((r) => r.verified).length;
  const responseCt = allReviews.filter((r) => r.responseText).length;
  const responseRate = total > 0 ? Math.round((responseCt / total) * 100) : 0;

  const criteriaAcc: Record<string, { sum: number; count: number }> = {};
  for (const r of allReviews) {
    const crit = r.criterias as Record<string, number> | null;
    if (crit) {
      for (const [key, val] of Object.entries(crit)) {
        if (typeof val === "number") {
          if (!criteriaAcc[key]) criteriaAcc[key] = { sum: 0, count: 0 };
          criteriaAcc[key].sum += val;
          criteriaAcc[key].count += 1;
        }
      }
    }
  }
  const criteriaAverages: Record<string, number> = {};
  for (const [key, { sum: s, count: c }] of Object.entries(criteriaAcc)) {
    criteriaAverages[key] = Math.round((s / c) * 100);
  }

  const existing = await db
    .select({ id: reviewAggregates.id })
    .from(reviewAggregates)
    .where(
      and(
        eq(reviewAggregates.targetType, targetType),
        eq(reviewAggregates.targetId, targetId),
        eq(reviewAggregates.univers, univers),
      ),
    )
    .limit(1);

  const data = {
    totalReviews: total,
    averageRatingX100: avg,
    rating5Count: r5,
    rating4Count: r4,
    rating3Count: r3,
    rating2Count: r2,
    rating1Count: r1,
    verifiedCount: verifiedCt,
    responseRatePct: responseRate,
    criteriaAverages,
    lastReviewAt: new Date(),
    updatedAt: new Date(),
  };

  if (existing.length) {
    await db.update(reviewAggregates).set(data).where(eq(reviewAggregates.id, existing[0].id));
  } else {
    await db.insert(reviewAggregates).values({ targetType, targetId, univers, ...data });
  }

  // Mise à jour note sur users si cible = user
  if (targetType === "user") {
    await db
      .update(users)
      .set({ rating: String(avg / 100), reviewCount: total })
      .where(eq(users.id, targetId));
  }

  // Mise à jour stats mensuelles (Point 4)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const existingMonth = await db
    .select({ id: reviewMonthlyStats.id })
    .from(reviewMonthlyStats)
    .where(
      and(
        eq(reviewMonthlyStats.targetType, targetType),
        eq(reviewMonthlyStats.targetId, targetId),
        eq(reviewMonthlyStats.univers, univers),
        eq(reviewMonthlyStats.year, year),
        eq(reviewMonthlyStats.month, month),
      ),
    )
    .limit(1);

  if (existingMonth.length) {
    await db.update(reviewMonthlyStats).set({
      averageRatingX100: avg,
      reviewCount: total,
      verifiedCount: verifiedCt,
      criteriaAverages,
    }).where(eq(reviewMonthlyStats.id, existingMonth[0].id));
  } else {
    await db.insert(reviewMonthlyStats).values({
      targetType, targetId, univers, year, month,
      averageRatingX100: avg, reviewCount: total, verifiedCount: verifiedCt, criteriaAverages,
    });
  }
}

async function triggerWebhooks(event: string, data: Record<string, any>) {
  const hooks = await db.select().from(reviewWebhooks).where(eq(reviewWebhooks.active, true));
  for (const hook of hooks) {
    const events = hook.events as string[];
    if (!events.includes(event) && !events.includes("*")) continue;
    const payload = { event, timestamp: new Date().toISOString(), data };
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hook.secret) {
      const { createHmac } = await import("crypto");
      headers["X-MKA-Signature"] = createHmac("sha256", hook.secret).update(body).digest("hex");
    }
    try {
      const resp = await fetch(hook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });
      await db.insert(reviewWebhookLogs).values({
        webhookId: hook.id, event, payload, statusCode: resp.status, success: resp.ok,
      });
      if (resp.ok) {
        await db.update(reviewWebhooks).set({ lastTriggeredAt: new Date(), failureCount: 0 }).where(eq(reviewWebhooks.id, hook.id));
      } else {
        await db.update(reviewWebhooks).set({ failureCount: hook.failureCount + 1 }).where(eq(reviewWebhooks.id, hook.id));
      }
    } catch {
      await db.insert(reviewWebhookLogs).values({
        webhookId: hook.id, event, payload, statusCode: 0, success: false, responseBody: "timeout_or_error",
      });
      await db.update(reviewWebhooks).set({ failureCount: hook.failureCount + 1 }).where(eq(reviewWebhooks.id, hook.id));
    }
  }
}

async function sendNotification(userId: number, type: string, title: string, body: string, url?: string) {
  await db.insert(notifications).values({ userId, type, title, body, url });
}

// ═══════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════

export const reviewsV2Router = router({

  // ─────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────

  list: publicProcedure
    .input(z.object({
      targetType: z.string(),
      targetId: z.number(),
      univers: z.string().optional(),
      minRating: z.number().min(1).max(5).optional(),
      sortBy: z.enum(["recent", "best", "worst", "helpful"]).default("recent"),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [
        eq(reviewsV2.targetType, input.targetType),
        eq(reviewsV2.targetId, input.targetId),
        eq(reviewsV2.status, "publie"),
        eq(reviewsV2.visibility, "public"),
      ];
      if (input.univers) conditions.push(eq(reviewsV2.univers, input.univers));
      if (input.minRating) conditions.push(gte(reviewsV2.ratingGlobal, input.minRating));

      const orderBy =
        input.sortBy === "best" ? desc(reviewsV2.ratingGlobal) :
        input.sortBy === "worst" ? asc(reviewsV2.ratingGlobal) :
        input.sortBy === "helpful" ? desc(reviewsV2.helpfulCount) :
        desc(reviewsV2.createdAt);

      return db
        .select({
          id: reviewsV2.id,
          authorId: reviewsV2.authorId,
          authorName: users.name,
          authorFirstName: users.firstName,
          authorAvatar: users.avatarUrl,
          authorDisplayMode: reviewsV2.authorDisplayMode,
          ratingGlobal: reviewsV2.ratingGlobal,
          criterias: reviewsV2.criterias,
          comment: reviewsV2.comment,
          prosText: reviewsV2.prosText,
          consText: reviewsV2.consText,
          photos: reviewsV2.photos,
          videos: reviewsV2.videos,
          documents: reviewsV2.documents,
          verified: reviewsV2.verified,
          responseText: reviewsV2.responseText,
          responseAt: reviewsV2.responseAt,
          responseDocuments: reviewsV2.responseDocuments,
          clientReplyText: reviewsV2.clientReplyText,
          clientReplyAt: reviewsV2.clientReplyAt,
          officialResponseText: reviewsV2.officialResponseText,
          officialResponseAt: reviewsV2.officialResponseAt,
          helpfulCount: reviewsV2.helpfulCount,
          language: reviewsV2.language,
          translatedComment: reviewsV2.translatedComment,
          authorLoyaltyTier: reviewsV2.authorLoyaltyTier,
          createdAt: reviewsV2.createdAt,
          univers: reviewsV2.univers,
        })
        .from(reviewsV2)
        .leftJoin(users, eq(users.id, reviewsV2.authorId))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);
    }),

  getStats: publicProcedure
    .input(z.object({
      targetType: z.string(),
      targetId: z.number(),
      univers: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [
        eq(reviewAggregates.targetType, input.targetType),
        eq(reviewAggregates.targetId, input.targetId),
      ];
      if (input.univers) conditions.push(eq(reviewAggregates.univers, input.univers));

      const rows = await db.select().from(reviewAggregates).where(and(...conditions));
      if (!rows.length) {
        return { totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, verifiedCount: 0, responseRate: 0, criteriaAverages: {} };
      }
      const total = rows.reduce((a, r) => a + r.totalReviews, 0);
      const weightedAvg = total > 0
        ? Math.round(rows.reduce((a, r) => a + r.averageRatingX100 * r.totalReviews, 0) / total)
        : 0;
      return {
        totalReviews: total,
        averageRating: weightedAvg,
        distribution: {
          5: rows.reduce((a, r) => a + r.rating5Count, 0),
          4: rows.reduce((a, r) => a + r.rating4Count, 0),
          3: rows.reduce((a, r) => a + r.rating3Count, 0),
          2: rows.reduce((a, r) => a + r.rating2Count, 0),
          1: rows.reduce((a, r) => a + r.rating1Count, 0),
        },
        verifiedCount: rows.reduce((a, r) => a + r.verifiedCount, 0),
        responseRate: total > 0
          ? Math.round(rows.reduce((a, r) => a + r.responseRatePct * r.totalReviews, 0) / total)
          : 0,
        criteriaAverages: rows[0]?.criteriaAverages ?? {},
      };
    }),

  getCriteria: publicProcedure
    .input(z.object({ univers: z.string(), targetType: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions: any[] = [
        eq(reviewCriteriaTemplates.univers, input.univers),
        eq(reviewCriteriaTemplates.active, true),
      ];
      if (input.targetType) conditions.push(eq(reviewCriteriaTemplates.targetType, input.targetType));
      return db.select().from(reviewCriteriaTemplates).where(and(...conditions)).orderBy(asc(reviewCriteriaTemplates.ordre));
    }),

  getTrustScore: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const [score] = await db.select().from(reviewTrustScores).where(eq(reviewTrustScores.userId, input.userId)).limit(1);
      return score ?? { userId: input.userId, score: 50, history: [] };
    }),

  getBadges: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select({
          badgeKey: reviewBadgesAwarded.badgeKey,
          awardedAt: reviewBadgesAwarded.awardedAt,
          label: reviewBadgeDefinitions.label,
          icon: reviewBadgeDefinitions.icon,
          color: reviewBadgeDefinitions.color,
          description: reviewBadgeDefinitions.description,
        })
        .from(reviewBadgesAwarded)
        .innerJoin(reviewBadgeDefinitions, eq(reviewBadgeDefinitions.key, reviewBadgesAwarded.badgeKey))
        .where(and(eq(reviewBadgesAwarded.userId, input.userId), eq(reviewBadgesAwarded.active, true)));
    }),

  getLeaderboard: publicProcedure
    .input(z.object({
      univers: z.string().optional(),
      targetType: z.string().default("user"),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [
        eq(reviewAggregates.targetType, input.targetType),
        gte(reviewAggregates.totalReviews, 3),
      ];
      if (input.univers) conditions.push(eq(reviewAggregates.univers, input.univers));
      return db
        .select({
          targetId: reviewAggregates.targetId,
          univers: reviewAggregates.univers,
          totalReviews: reviewAggregates.totalReviews,
          averageRating: reviewAggregates.averageRatingX100,
          verifiedCount: reviewAggregates.verifiedCount,
          responseRate: reviewAggregates.responseRatePct,
        })
        .from(reviewAggregates)
        .where(and(...conditions))
        .orderBy(desc(reviewAggregates.averageRatingX100))
        .limit(input.limit);
    }),

  getMonthlyTrend: publicProcedure
    .input(z.object({ targetType: z.string(), targetId: z.number(), univers: z.string().optional(), months: z.number().default(12) }))
    .query(async ({ input }) => {
      const conditions: any[] = [
        eq(reviewMonthlyStats.targetType, input.targetType),
        eq(reviewMonthlyStats.targetId, input.targetId),
      ];
      if (input.univers) conditions.push(eq(reviewMonthlyStats.univers, input.univers));
      return db.select().from(reviewMonthlyStats).where(and(...conditions))
        .orderBy(desc(reviewMonthlyStats.year), desc(reviewMonthlyStats.month))
        .limit(input.months);
    }),

  getPlatformReviews: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: reviewsV2.id,
          authorId: reviewsV2.authorId,
          authorName: users.name,
          authorDisplayMode: reviewsV2.authorDisplayMode,
          ratingGlobal: reviewsV2.ratingGlobal,
          criterias: reviewsV2.criterias,
          comment: reviewsV2.comment,
          officialResponseText: reviewsV2.officialResponseText,
          createdAt: reviewsV2.createdAt,
        })
        .from(reviewsV2)
        .leftJoin(users, eq(users.id, reviewsV2.authorId))
        .where(and(eq(reviewsV2.univers, "plateforme"), eq(reviewsV2.status, "publie"), eq(reviewsV2.visibility, "public")))
        .orderBy(desc(reviewsV2.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getUniversList: publicProcedure.query(async () => {
    return db.select().from(reviewUniversRegistry).where(eq(reviewUniversRegistry.active, true)).orderBy(asc(reviewUniversRegistry.ordre));
  }),

  // ─────────────────────────────────────────
  // AUTHENTIFIÉ
  // ─────────────────────────────────────────

  create: protectedProcedure
    .input(z.object({
      targetType: z.string(),
      targetId: z.number(),
      univers: z.string(),
      ratingGlobal: z.number().min(1).max(5),
      criterias: z.record(z.string(), z.number().min(1).max(5)).optional(),
      comment: z.string().max(2000).optional(),
      prosText: z.string().max(500).optional(),
      consText: z.string().max(500).optional(),
      photos: z.array(z.string()).max(5).optional(),
      videos: z.array(z.string()).max(2).optional(),
      documents: z.array(z.object({ name: z.string(), url: z.string(), type: z.string() })).max(5).optional(),
      transactionType: z.string().optional(),
      transactionId: z.number().optional(),
      requestId: z.number().optional(),
      displayMode: z.enum(["full", "prenom", "initiales", "anonyme"]).default("full"),
      visibility: z.enum(["public", "prive"]).default("public"),
      language: z.string().max(8).default("fr"),
    }))
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.user.uid;

      // Anti auto-évaluation
      if (input.targetType === "user" && input.targetId === authorId) {
        throw new Error("Vous ne pouvez pas vous auto-évaluer.");
      }

      // Anti-doublon
      const existing = await db
        .select({ id: reviewsV2.id })
        .from(reviewsV2)
        .where(and(
          eq(reviewsV2.authorId, authorId),
          eq(reviewsV2.targetType, input.targetType),
          eq(reviewsV2.targetId, input.targetId),
          eq(reviewsV2.univers, input.univers),
          ne(reviewsV2.status, "masque"),
        ))
        .limit(1);
      if (existing.length) throw new Error("Vous avez déjà déposé un avis pour cette cible.");

      // Modération auto
      let status = "publie";
      if (containsBadWords(input.comment) || containsBadWords(input.prosText) || containsBadWords(input.consText)) {
        status = "en_moderation";
      }

      // Vérification
      const verified = !!(input.transactionType && input.transactionId);
      const verificationProof = verified ? `TXN-${input.transactionType}-${input.transactionId}` : null;

      // Détection fidélité (Point 19)
      const [author] = await db.select({ createdAt: users.createdAt, reviewCount: users.reviewCount }).from(users).where(eq(users.id, authorId)).limit(1);
      const loyaltyTier = author ? detectLoyaltyTier(author.createdAt, author.reviewCount ?? 0) : "new";

      const [inserted] = await db
        .insert(reviewsV2)
        .values({
          authorId,
          authorDisplayMode: input.displayMode,
          targetType: input.targetType,
          targetId: input.targetId,
          univers: input.univers,
          transactionType: input.transactionType,
          transactionId: input.transactionId,
          ratingGlobal: input.ratingGlobal,
          criterias: input.criterias ?? {},
          comment: input.comment,
          prosText: input.prosText,
          consText: input.consText,
          photos: input.photos ?? [],
          videos: input.videos ?? [],
          documents: input.documents ?? [],
          verified,
          verificationProof,
          status,
          visibility: input.visibility,
          language: input.language,
          authorLoyaltyTier: loyaltyTier,
          deviceType: "web",
        })
        .returning({ id: reviewsV2.id });

      // Historique (Point 26)
      await recordHistory(inserted.id, "created", authorId, null, { ratingGlobal: input.ratingGlobal, comment: input.comment });

      // Demande d'avis → complétée
      if (input.requestId) {
        await db.update(reviewRequests).set({ status: "completed", completedAt: new Date(), reviewId: inserted.id })
          .where(eq(reviewRequests.id, input.requestId));
      }

      // Recalcul
      if (status === "publie") {
        await recomputeAggregates(input.targetType, input.targetId, input.univers);
      }

      // Points fidélité (Point 13)
      let points = 30;
      if (input.photos && input.photos.length > 0) points = 50;
      if (input.videos && input.videos.length > 0) points = 100;
      if (input.requestId) points += 20;
      await awardPoints(authorId, points, "avis_depose", "review", inserted.id);

      // Notification à la cible (Point 7)
      if (input.targetType === "user" && input.visibility === "public") {
        await sendNotification(
          input.targetId, "review",
          input.ratingGlobal >= 4 ? "⭐ Excellent avis reçu !" : "Nouvel avis reçu",
          `Note : ${input.ratingGlobal}/5${input.comment ? ` — « ${input.comment.slice(0, 80)} »` : ""}`,
          "/compte/avis",
        );
      }

      // Webhook (Point 9)
      triggerWebhooks("review.created", {
        reviewId: inserted.id, authorId, targetType: input.targetType,
        targetId: input.targetId, univers: input.univers, ratingGlobal: input.ratingGlobal, verified,
      });

      return { id: inserted.id, status };
    }),

  update: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      ratingGlobal: z.number().min(1).max(5).optional(),
      criterias: z.record(z.string(), z.number().min(1).max(5)).optional(),
      comment: z.string().max(2000).optional(),
      prosText: z.string().max(500).optional(),
      consText: z.string().max(500).optional(),
      photos: z.array(z.string()).max(5).optional(),
      videos: z.array(z.string()).max(2).optional(),
      documents: z.array(z.object({ name: z.string(), url: z.string(), type: z.string() })).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!review || review.authorId !== ctx.user.uid) throw new Error("Avis introuvable ou non autorisé.");

      const prevData = { ratingGlobal: review.ratingGlobal, comment: review.comment };
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (input.ratingGlobal !== undefined) updates.ratingGlobal = input.ratingGlobal;
      if (input.criterias) updates.criterias = input.criterias;
      if (input.comment !== undefined) updates.comment = input.comment;
      if (input.prosText !== undefined) updates.prosText = input.prosText;
      if (input.consText !== undefined) updates.consText = input.consText;
      if (input.photos) updates.photos = input.photos;
      if (input.videos) updates.videos = input.videos;
      if (input.documents) updates.documents = input.documents;

      if (containsBadWords(input.comment) || containsBadWords(input.prosText) || containsBadWords(input.consText)) {
        updates.status = "en_moderation";
      }

      await db.update(reviewsV2).set(updates).where(eq(reviewsV2.id, input.reviewId));
      await recordHistory(input.reviewId, "edited", ctx.user.uid, prevData, updates);
      await recomputeAggregates(review.targetType, review.targetId, review.univers);
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!review || review.authorId !== ctx.user.uid) throw new Error("Avis introuvable ou non autorisé.");
      await db.update(reviewsV2).set({ status: "masque", updatedAt: new Date() }).where(eq(reviewsV2.id, input.reviewId));
      await recordHistory(input.reviewId, "status_changed", ctx.user.uid, { status: review.status }, { status: "masque" });
      await recomputeAggregates(review.targetType, review.targetId, review.univers);
      return { ok: true };
    }),

  // Réponse du professionnel (Point 11)
  respond: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      responseText: z.string().max(1000),
      documents: z.array(z.object({ name: z.string(), url: z.string(), type: z.string() })).max(3).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!review) throw new Error("Avis introuvable.");
      if (review.responseText) throw new Error("Cet avis a déjà une réponse.");

      // Vérifier propriétaire ou admin
      const isTargetOwner = review.targetType === "user" && review.targetId === ctx.user.uid;
      const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, ctx.user.uid)).limit(1);
      const isAdminUser = user && ["admin", "super_admin"].includes(user.role);
      if (!isTargetOwner && !isAdminUser) throw new Error("Non autorisé.");

      await db.update(reviewsV2).set({
        responseText: input.responseText,
        responseAt: new Date(),
        responseBy: ctx.user.uid,
        responseDocuments: input.documents ?? [],
      }).where(eq(reviewsV2.id, input.reviewId));

      await recordHistory(input.reviewId, "response_pro", ctx.user.uid, null, { responseText: input.responseText });
      await recomputeAggregates(review.targetType, review.targetId, review.univers);
      await sendNotification(review.authorId, "review", "Réponse à votre avis", `Le professionnel a répondu à votre avis.`, "/compte/avis");
      triggerWebhooks("review.response", { reviewId: input.reviewId, responderId: ctx.user.uid });
      return { ok: true };
    }),

  // Réponse du client (Point 11 — 1 seule, puis clôturé)
  clientReply: protectedProcedure
    .input(z.object({ reviewId: z.number(), replyText: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!review) throw new Error("Avis introuvable.");
      if (review.authorId !== ctx.user.uid) throw new Error("Seul l'auteur de l'avis peut répondre.");
      if (!review.responseText) throw new Error("Aucune réponse du professionnel à laquelle répondre.");
      if (review.clientReplyText) throw new Error("Vous avez déjà répondu. Le sujet est clôturé.");

      await db.update(reviewsV2).set({ clientReplyText: input.replyText, clientReplyAt: new Date() })
        .where(eq(reviewsV2.id, input.reviewId));
      await recordHistory(input.reviewId, "response_client", ctx.user.uid, null, { clientReplyText: input.replyText });
      return { ok: true };
    }),

  // Voter utile
  markHelpful: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select().from(reviewHelpful)
        .where(and(eq(reviewHelpful.reviewId, input.reviewId), eq(reviewHelpful.userId, ctx.user.uid))).limit(1);
      if (existing.length) throw new Error("Vous avez déjà voté.");
      await db.insert(reviewHelpful).values({ reviewId: input.reviewId, userId: ctx.user.uid });
      await db.update(reviewsV2).set({ helpfulCount: sql`${reviewsV2.helpfulCount} + 1` }).where(eq(reviewsV2.id, input.reviewId));

      // Bonus points si 5+ votes utiles (Point 13)
      const [review] = await db.select({ helpfulCount: reviewsV2.helpfulCount, authorId: reviewsV2.authorId })
        .from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (review && review.helpfulCount === 5) {
        await awardPoints(review.authorId, 25, "avis_utile_5_votes", "review", input.reviewId);
      }
      return { ok: true };
    }),

  // Signaler
  report: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      reason: z.enum(["faux_avis", "insulte", "spam", "doublon", "conflit_interet", "hors_sujet", "contenu_inapproprie"]),
      details: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(reviewReports).values({ reviewId: input.reviewId, reporterId: ctx.user.uid, reason: input.reason, details: input.details });
      const [reported] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!reported) throw new Error("Avis introuvable.");
      const newCount = (reported.reportedCount || 0) + 1;
      const shouldHide = newCount >= 3;
      await db.update(reviewsV2).set({ reportedCount: sql`${reviewsV2.reportedCount} + 1`, ...(shouldHide ? { status: "signale" } : {}) })
        .where(eq(reviewsV2.id, input.reviewId));
      if (shouldHide) {
        await recomputeAggregates(reported.targetType, reported.targetId, reported.univers);
      }
      await recordHistory(input.reviewId, "reported", ctx.user.uid, null, { reason: input.reason });
      triggerWebhooks("review.reported", { reviewId: input.reviewId, reason: input.reason });
      return { ok: true };
    }),

  // Contester un avis (Point 12 — professionnel)
  contest: proProcedure
    .input(z.object({
      reviewId: z.number(),
      reason: z.enum(["faux_avis", "erreur_personne", "langage_injurieux", "concurrence_deloyale", "spam", "hors_sujet"]),
      explanation: z.string().max(1000),
      evidence: z.array(z.object({ name: z.string(), url: z.string(), type: z.string() })).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!review) throw new Error("Avis introuvable.");
      if (review.targetType === "user" && review.targetId !== ctx.user.uid) {
        throw new Error("Vous ne pouvez contester que les avis vous concernant.");
      }

      await db.insert(reviewContestations).values({
        reviewId: input.reviewId,
        contesterId: ctx.user.uid,
        reason: input.reason,
        explanation: input.explanation,
        evidence: input.evidence ?? [],
      });
      await db.update(reviewsV2).set({ status: "conteste" }).where(eq(reviewsV2.id, input.reviewId));
      await recomputeAggregates(review.targetType, review.targetId, review.univers);
      await recordHistory(input.reviewId, "contested", ctx.user.uid, null, { reason: input.reason });
      triggerWebhooks("review.contested", { reviewId: input.reviewId, reason: input.reason });
      return { ok: true };
    }),

  // Mes demandes d'avis
  listRequests: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return db.select().from(reviewRequests)
        .where(and(eq(reviewRequests.userId, ctx.user.uid), or(eq(reviewRequests.status, "pending"), eq(reviewRequests.status, "sent"))))
        .orderBy(desc(reviewRequests.createdAt)).limit(input.limit);
    }),

  dismissRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(reviewRequests).set({ status: "dismissed" })
        .where(and(eq(reviewRequests.id, input.requestId), eq(reviewRequests.userId, ctx.user.uid)));
      return { ok: true };
    }),

  // Avis plateforme
  createPlatformReview: protectedProcedure
    .input(z.object({
      ratingGlobal: z.number().min(1).max(5),
      criterias: z.record(z.string(), z.number().min(1).max(5)).optional(),
      comment: z.string().max(2000).optional(),
      displayMode: z.enum(["full", "prenom", "initiales", "anonyme"]).default("full"),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select({ id: reviewsV2.id }).from(reviewsV2)
        .where(and(eq(reviewsV2.authorId, ctx.user.uid), eq(reviewsV2.univers, "plateforme"), eq(reviewsV2.targetType, "plateforme")))
        .limit(1);
      if (existing.length) throw new Error("Vous avez déjà donné votre avis sur la plateforme.");

      let status = "publie";
      if (containsBadWords(input.comment)) status = "en_moderation";

      const [inserted] = await db.insert(reviewsV2).values({
        authorId: ctx.user.uid,
        authorDisplayMode: input.displayMode,
        targetType: "plateforme",
        targetId: 0,
        univers: "plateforme",
        ratingGlobal: input.ratingGlobal,
        criterias: input.criterias ?? {},
        comment: input.comment,
        verified: true,
        verificationProof: `USER-${ctx.user.uid}`,
        status,
        visibility: "public",
      }).returning({ id: reviewsV2.id });

      await awardPoints(ctx.user.uid, 30, "avis_plateforme", "review", inserted.id);
      return { id: inserted.id };
    }),

  // Enquête post-suppression (Point 8)
  submitExitSurvey: protectedProcedure
    .input(z.object({
      annonceId: z.number().optional(),
      reason: z.enum(["vendu_mkapms", "vendu_ailleurs", "changement_avis", "autre"]),
      details: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(reviewExitSurveys).values({ userId: ctx.user.uid, annonceId: input.annonceId, reason: input.reason, details: input.details });
      return { ok: true };
    }),

  // Satisfaction post-mise-à-jour (Point 33)
  submitFeatureSatisfaction: protectedProcedure
    .input(z.object({
      featureKey: z.string().max(64),
      featureLabel: z.string().max(200),
      satisfied: z.boolean(),
      comment: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(reviewFeatureSatisfaction).values({ userId: ctx.user.uid, ...input });
      return { ok: true };
    }),

  // ─────────────────────────────────────────
  // PROFESSIONNEL
  // ─────────────────────────────────────────

  // Retours pro internes (Point 2)
  proFeedback: proProcedure
    .input(z.object({
      category: z.enum(["fonctionnalite", "bug", "amelioration", "prix", "abonnement", "ergonomie", "besoin_metier"]),
      title: z.string().max(200),
      description: z.string().max(2000),
      priority: z.enum(["basse", "normale", "haute"]).default("normale"),
    }))
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await db.insert(reviewsV2).values({
        authorId: ctx.user.uid,
        authorDisplayMode: "full",
        targetType: "plateforme",
        targetId: 0,
        univers: "plateforme",
        ratingGlobal: 3,
        criterias: { category: input.category as any },
        comment: `[${input.category.toUpperCase()}] ${input.title}\n\n${input.description}`,
        prosText: input.priority,
        verified: true,
        verificationProof: `PRO-FEEDBACK-${ctx.user.uid}`,
        status: "publie",
        visibility: "interne", // Visible uniquement direction (Point 2)
        deviceType: "feedback",
      }).returning({ id: reviewsV2.id });
      return { id: inserted.id };
    }),

  // Mes objectifs qualité (Point 31)
  getMyObjectives: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(reviewObjectives).where(eq(reviewObjectives.userId, ctx.user.uid)).orderBy(desc(reviewObjectives.createdAt));
  }),

  // ─────────────────────────────────────────
  // ADMIN / DIRECTION
  // ─────────────────────────────────────────

  // Réponse officielle MKA.P-MS (Point 3)
  officialResponse: adminProcedure
    .input(z.object({ reviewId: z.number(), responseText: z.string().max(1000) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(reviewsV2).set({
        officialResponseText: input.responseText,
        officialResponseAt: new Date(),
        officialResponseBy: ctx.user.uid,
      }).where(eq(reviewsV2.id, input.reviewId));
      await recordHistory(input.reviewId, "response_official", ctx.user.uid, null, { officialResponseText: input.responseText });
      return { ok: true };
    }),

  // Modérer
  moderate: adminProcedure
    .input(z.object({
      reviewId: z.number(),
      action: z.enum(["approve", "hide"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, input.reviewId)).limit(1);
      if (!review) throw new Error("Avis introuvable.");

      const newStatus = input.action === "approve" ? "publie" : "masque";
      await db.update(reviewsV2).set({
        status: newStatus,
        moderationReason: input.reason,
        moderatedBy: ctx.user.uid,
        moderatedAt: new Date(),
      }).where(eq(reviewsV2.id, input.reviewId));

      await recordHistory(input.reviewId, "moderated", ctx.user.uid, { status: review.status }, { status: newStatus, reason: input.reason });

      if (input.action === "hide") {
        await awardPoints(review.authorId, -200, "faux_avis_detecte", "review", input.reviewId);
      }
      if (input.action === "approve") {
        await recomputeAggregates(review.targetType, review.targetId, review.univers);
      }
      return { ok: true };
    }),

  // Résoudre contestation (Point 12)
  resolveContestation: adminProcedure
    .input(z.object({
      contestationId: z.number(),
      accepted: z.boolean(),
      decision: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [contestation] = await db.select().from(reviewContestations).where(eq(reviewContestations.id, input.contestationId)).limit(1);
      if (!contestation) throw new Error("Contestation introuvable.");

      await db.update(reviewContestations).set({
        status: input.accepted ? "acceptee" : "rejetee",
        handledBy: ctx.user.uid,
        handledAt: new Date(),
        decision: input.decision,
      }).where(eq(reviewContestations.id, input.contestationId));

      if (input.accepted) {
        await db.update(reviewsV2).set({ status: "masque", moderationReason: "Contestation acceptée" })
          .where(eq(reviewsV2.id, contestation.reviewId));
        const [review] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, contestation.reviewId)).limit(1);
        if (review) {
          await awardPoints(review.authorId, -100, "avis_conteste_accepte", "review", contestation.reviewId);
          await recomputeAggregates(review.targetType, review.targetId, review.univers);
        }
      } else {
        await db.update(reviewsV2).set({ status: "publie" }).where(eq(reviewsV2.id, contestation.reviewId));
        const [rejectedReview] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, contestation.reviewId)).limit(1);
        if (rejectedReview) {
          await recomputeAggregates(rejectedReview.targetType, rejectedReview.targetId, rejectedReview.univers);
        }
      }
      return { ok: true };
    }),

  // Dashboard admin
  adminDashboard: adminProcedure.query(async () => {
    const [stats] = await db.select({
      total: sql<number>`count(*)`,
      avgRating: sql<number>`coalesce(round(avg(${reviewsV2.ratingGlobal})::numeric, 2), 0)`,
      pending: sql<number>`count(*) filter (where ${reviewsV2.status} = 'en_moderation')`,
      reported: sql<number>`count(*) filter (where ${reviewsV2.status} = 'signale')`,
      contested: sql<number>`count(*) filter (where ${reviewsV2.status} = 'conteste')`,
      verified: sql<number>`count(*) filter (where ${reviewsV2.verified} = true)`,
      todayCount: sql<number>`count(*) filter (where ${reviewsV2.createdAt} >= now() - interval '24 hours')`,
      weekCount: sql<number>`count(*) filter (where ${reviewsV2.createdAt} >= now() - interval '7 days')`,
    }).from(reviewsV2);

    const pendingReviews = await db
      .select({
        id: reviewsV2.id, authorId: reviewsV2.authorId, authorName: users.name,
        ratingGlobal: reviewsV2.ratingGlobal, comment: reviewsV2.comment,
        univers: reviewsV2.univers, status: reviewsV2.status, createdAt: reviewsV2.createdAt,
      })
      .from(reviewsV2)
      .leftJoin(users, eq(users.id, reviewsV2.authorId))
      .where(or(eq(reviewsV2.status, "en_moderation"), eq(reviewsV2.status, "signale"), eq(reviewsV2.status, "conteste")))
      .orderBy(desc(reviewsV2.createdAt)).limit(30);

    const pendingContestations = await db.select().from(reviewContestations)
      .where(eq(reviewContestations.status, "en_attente")).orderBy(desc(reviewContestations.createdAt)).limit(20);

    return { stats, pendingReviews, pendingContestations };
  }),

  // Tableau qualité PDG (Points 5, 16, 17, 20, 34)
  qualityCenter: directionProcedure
    .input(z.object({ univers: z.string().optional() }))
    .query(async ({ input }) => {
      // Satisfaction par univers (Point 16)
      const universStats = await db
        .select({
          univers: reviewAggregates.univers,
          totalReviews: sql<number>`sum(${reviewAggregates.totalReviews})`,
          avgRating: sql<number>`round(avg(${reviewAggregates.averageRatingX100})::numeric / 100, 2)`,
        })
        .from(reviewAggregates)
        .groupBy(reviewAggregates.univers)
        .orderBy(desc(sql`avg(${reviewAggregates.averageRatingX100})`));

      // Meilleurs professionnels (Point 17)
      const topPros = await db
        .select({
          targetId: reviewAggregates.targetId,
          univers: reviewAggregates.univers,
          totalReviews: reviewAggregates.totalReviews,
          averageRating: reviewAggregates.averageRatingX100,
          responseRate: reviewAggregates.responseRatePct,
        })
        .from(reviewAggregates)
        .where(and(eq(reviewAggregates.targetType, "user"), gte(reviewAggregates.totalReviews, 3)))
        .orderBy(desc(reviewAggregates.averageRatingX100))
        .limit(20);

      // Pros en difficulté (note < 3)
      const struggling = await db
        .select({
          targetId: reviewAggregates.targetId,
          univers: reviewAggregates.univers,
          totalReviews: reviewAggregates.totalReviews,
          averageRating: reviewAggregates.averageRatingX100,
        })
        .from(reviewAggregates)
        .where(and(eq(reviewAggregates.targetType, "user"), lte(reviewAggregates.averageRatingX100, 300), gte(reviewAggregates.totalReviews, 2)))
        .orderBy(asc(reviewAggregates.averageRatingX100))
        .limit(20);

      // Retours pro internes (Point 2)
      const internalFeedback = await db
        .select({
          id: reviewsV2.id, authorName: users.name, comment: reviewsV2.comment,
          priority: reviewsV2.prosText, createdAt: reviewsV2.createdAt,
        })
        .from(reviewsV2)
        .leftJoin(users, eq(users.id, reviewsV2.authorId))
        .where(and(eq(reviewsV2.visibility, "interne"), eq(reviewsV2.deviceType, "feedback")))
        .orderBy(desc(reviewsV2.createdAt)).limit(30);

      // Exit surveys (Point 8)
      const exitStats = await db
        .select({
          reason: reviewExitSurveys.reason,
          count: sql<number>`count(*)`,
        })
        .from(reviewExitSurveys)
        .groupBy(reviewExitSurveys.reason);

      return { universStats, topPros, struggling, internalFeedback, exitStats };
    }),

  // Analyse géographique (Point 29)
  geoAnalysis: directionProcedure
    .input(z.object({ groupBy: z.enum(["city", "country"]).default("city") }))
    .query(async ({ input }) => {
      const field = input.groupBy === "city" ? reviewsV2.ipCity : reviewsV2.ipCountry;
      return db
        .select({
          location: field,
          totalReviews: sql<number>`count(*)`,
          avgRating: sql<number>`round(avg(${reviewsV2.ratingGlobal})::numeric, 2)`,
        })
        .from(reviewsV2)
        .where(and(eq(reviewsV2.status, "publie"), sql`${field} is not null`))
        .groupBy(field)
        .orderBy(desc(sql`count(*)`))
        .limit(50);
    }),

  // ─────────────────────────────────────────
  // CONFIGURATION (Point 22 — tout configurable par le PDG)
  // ─────────────────────────────────────────

  getConfig: adminProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions: any[] = [];
      if (input.category) conditions.push(eq(reviewConfig.category, input.category));
      return db.select().from(reviewConfig).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(reviewConfig.key));
    }),

  updateConfig: adminProcedure
    .input(z.object({ key: z.string(), value: z.any(), label: z.string().optional(), description: z.string().optional(), category: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select({ id: reviewConfig.id }).from(reviewConfig).where(eq(reviewConfig.key, input.key)).limit(1);
      if (existing.length) {
        await db.update(reviewConfig).set({ value: input.value, updatedBy: ctx.user.uid, updatedAt: new Date() }).where(eq(reviewConfig.id, existing[0].id));
      } else {
        await db.insert(reviewConfig).values({
          key: input.key, value: input.value,
          label: input.label ?? input.key,
          description: input.description,
          category: input.category ?? "general",
          updatedBy: ctx.user.uid,
        });
      }
      return { ok: true };
    }),

  // Gestion univers (Point 1)
  manageUnivers: adminProcedure
    .input(z.object({
      action: z.enum(["add", "update", "deactivate"]),
      key: z.string().max(64),
      label: z.string().max(128).optional(),
      labelEn: z.string().max(128).optional(),
      icon: z.string().max(32).optional(),
      ordre: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.action === "add") {
        await db.insert(reviewUniversRegistry).values({ key: input.key, label: input.label ?? input.key, labelEn: input.labelEn, icon: input.icon, ordre: input.ordre ?? 99 });
      } else if (input.action === "update") {
        const updates: Record<string, any> = {};
        if (input.label) updates.label = input.label;
        if (input.labelEn) updates.labelEn = input.labelEn;
        if (input.icon) updates.icon = input.icon;
        if (input.ordre !== undefined) updates.ordre = input.ordre;
        await db.update(reviewUniversRegistry).set(updates).where(eq(reviewUniversRegistry.key, input.key));
      } else {
        await db.update(reviewUniversRegistry).set({ active: false }).where(eq(reviewUniversRegistry.key, input.key));
      }
      return { ok: true };
    }),

  // Gestion badges (Point 13)
  manageBadges: adminProcedure
    .input(z.object({
      action: z.enum(["create", "update", "deactivate"]),
      id: z.number().optional(),
      key: z.string().max(32).optional(),
      label: z.string().max(64).optional(),
      description: z.string().max(255).optional(),
      icon: z.string().max(32).optional(),
      color: z.string().max(16).optional(),
      category: z.string().max(32).optional(),
      conditions: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.action === "create" && input.key && input.label && input.description && input.icon && input.conditions) {
        await db.insert(reviewBadgeDefinitions).values({
          key: input.key, label: input.label, description: input.description,
          icon: input.icon, color: input.color ?? "#FFD700",
          category: input.category ?? "performance", conditions: input.conditions,
        });
      } else if (input.action === "update" && input.id) {
        const updates: Record<string, any> = {};
        if (input.label) updates.label = input.label;
        if (input.description) updates.description = input.description;
        if (input.icon) updates.icon = input.icon;
        if (input.color) updates.color = input.color;
        if (input.conditions) updates.conditions = input.conditions;
        await db.update(reviewBadgeDefinitions).set(updates).where(eq(reviewBadgeDefinitions.id, input.id));
      } else if (input.action === "deactivate" && input.id) {
        await db.update(reviewBadgeDefinitions).set({ active: false }).where(eq(reviewBadgeDefinitions.id, input.id));
      }
      return { ok: true };
    }),

  // Gestion critères
  manageCriteria: adminProcedure
    .input(z.object({
      action: z.enum(["create", "update", "deactivate"]),
      id: z.number().optional(),
      univers: z.string().optional(),
      targetType: z.string().optional(),
      criteriaKey: z.string().optional(),
      criteriaLabel: z.string().optional(),
      criteriaLabelEn: z.string().optional(),
      criteriaIcon: z.string().optional(),
      ordre: z.number().optional(),
      weight: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.action === "create" && input.univers && input.targetType && input.criteriaKey && input.criteriaLabel) {
        await db.insert(reviewCriteriaTemplates).values({
          univers: input.univers, targetType: input.targetType,
          criteriaKey: input.criteriaKey, criteriaLabel: input.criteriaLabel,
          criteriaLabelEn: input.criteriaLabelEn, criteriaIcon: input.criteriaIcon,
          ordre: input.ordre ?? 0, weight: input.weight ?? 1,
        });
      } else if (input.action === "update" && input.id) {
        const updates: Record<string, any> = {};
        if (input.criteriaLabel) updates.criteriaLabel = input.criteriaLabel;
        if (input.criteriaLabelEn) updates.criteriaLabelEn = input.criteriaLabelEn;
        if (input.criteriaIcon) updates.criteriaIcon = input.criteriaIcon;
        if (input.ordre !== undefined) updates.ordre = input.ordre;
        if (input.weight !== undefined) updates.weight = input.weight;
        await db.update(reviewCriteriaTemplates).set(updates).where(eq(reviewCriteriaTemplates.id, input.id));
      } else if (input.action === "deactivate" && input.id) {
        await db.update(reviewCriteriaTemplates).set({ active: false }).where(eq(reviewCriteriaTemplates.id, input.id));
      }
      return { ok: true };
    }),

  // Objectifs qualité (Point 31)
  manageObjective: adminProcedure
    .input(z.object({
      action: z.enum(["create", "update"]),
      id: z.number().optional(),
      userId: z.number().optional(),
      univers: z.string().optional(),
      targetRating: z.number().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.action === "create" && input.userId && input.targetRating) {
        await db.insert(reviewObjectives).values({
          userId: input.userId, univers: input.univers,
          targetRating: input.targetRating,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
      } else if (input.action === "update" && input.id) {
        const updates: Record<string, any> = {};
        if (input.targetRating) updates.targetRating = input.targetRating;
        if (input.status) updates.status = input.status;
        await db.update(reviewObjectives).set(updates).where(eq(reviewObjectives.id, input.id));
      }
      return { ok: true };
    }),

  // Gestion employés (Point 24)
  manageEmployees: proProcedure
    .input(z.object({
      action: z.enum(["add", "update", "deactivate"]),
      id: z.number().optional(),
      businessId: z.number().optional(),
      businessType: z.string().optional(),
      employeeName: z.string().optional(),
      employeeRole: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.action === "add" && input.businessId && input.businessType && input.employeeName && input.employeeRole) {
        await db.insert(reviewEmployees).values({
          businessId: input.businessId, businessType: input.businessType,
          employeeName: input.employeeName, employeeRole: input.employeeRole,
        });
      } else if (input.action === "update" && input.id) {
        const updates: Record<string, any> = {};
        if (input.employeeName) updates.employeeName = input.employeeName;
        if (input.employeeRole) updates.employeeRole = input.employeeRole;
        await db.update(reviewEmployees).set(updates).where(eq(reviewEmployees.id, input.id));
      } else if (input.action === "deactivate" && input.id) {
        await db.update(reviewEmployees).set({ active: false }).where(eq(reviewEmployees.id, input.id));
      }
      return { ok: true };
    }),

  listEmployees: publicProcedure
    .input(z.object({ businessId: z.number(), businessType: z.string() }))
    .query(async ({ input }) => {
      return db.select().from(reviewEmployees)
        .where(and(eq(reviewEmployees.businessId, input.businessId), eq(reviewEmployees.businessType, input.businessType), eq(reviewEmployees.active, true)));
    }),

  // ─────────────────────────────────────────
  // WEBHOOKS (Point 9 — Make/n8n)
  // ─────────────────────────────────────────

  listWebhooks: adminProcedure.query(async () => {
    return db.select().from(reviewWebhooks).orderBy(desc(reviewWebhooks.createdAt));
  }),

  createWebhook: adminProcedure
    .input(z.object({ name: z.string().max(128), url: z.string().url(), secret: z.string().max(128).optional(), events: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const [w] = await db.insert(reviewWebhooks).values({ ...input, createdBy: ctx.user.uid }).returning({ id: reviewWebhooks.id });
      return w;
    }),

  deleteWebhook: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(reviewWebhooks).set({ active: false }).where(eq(reviewWebhooks.id, input.id));
      return { ok: true };
    }),

  // Retours pro (direction)
  listProFeedback: directionProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: reviewsV2.id, authorId: reviewsV2.authorId, authorName: users.name,
          comment: reviewsV2.comment, priority: reviewsV2.prosText,
          createdAt: reviewsV2.createdAt, responseText: reviewsV2.officialResponseText,
        })
        .from(reviewsV2)
        .leftJoin(users, eq(users.id, reviewsV2.authorId))
        .where(and(eq(reviewsV2.visibility, "interne"), eq(reviewsV2.deviceType, "feedback")))
        .orderBy(desc(reviewsV2.createdAt)).limit(input.limit);
    }),
});
