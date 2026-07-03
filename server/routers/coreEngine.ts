// ===== MKA.P-MS CORE ENGINE — Router tRPC =====
// Moteur d'orchestration central : 15 centres reliés au projet.
// Module staging : connecté mais non intégré directement.
import { z } from "zod";
import { desc, eq, sql, and, gte, lte, or, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  serviceRecommendationRules,
  userBehaviorLog,
  recommendations,
  ceSuppliers,
  ceSupplierCatalogue,
  distributionDepots,
  distributionShipments,
  ceFormationCourses,
  ceFormationModules,
  ceFormationExams,
  ceFormationEnrollments,
  b2bListings,
  b2bOrders,
  aiAnalysisReports,
  aiPredictions,
  documentVault,
  strategicPartners,
  apiKeys,
  apiUsageLogs,
  automationEvents,
  automationActions,
  workflows,
  workflowExecutions,
  searchIndex,
  expansionCountries,
  ecosystemLinks,
  orchestrationLog,
} from "../modules/coreEngine.js";

// ─── 1. MOTEUR DE SERVICES UNIVERSEL ───
const serviceEngine = router({
  getRules: adminProcedure.query(async () => {
    return db.select().from(serviceRecommendationRules).orderBy(asc(serviceRecommendationRules.priority));
  }),
  createRule: adminProcedure
    .input(z.object({
      triggerEvent: z.string(),
      triggerUnivers: z.string(),
      recommendedService: z.string(),
      priority: z.number().optional(),
      conditions: z.any().optional(),
      messageTemplate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [rule] = await db.insert(serviceRecommendationRules).values(input).returning();
      return rule;
    }),
  updateRule: adminProcedure
    .input(z.object({ id: z.number(), active: z.boolean().optional(), priority: z.number().optional(), conditions: z.any().optional(), messageTemplate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(serviceRecommendationRules).set(data).where(eq(serviceRecommendationRules.id, id));
      return { success: true };
    }),
  getRecommendationsForEvent: protectedProcedure
    .input(z.object({ event: z.string(), univers: z.string() }))
    .query(async ({ input }) => {
      return db.select().from(serviceRecommendationRules)
        .where(and(
          eq(serviceRecommendationRules.triggerEvent, input.event),
          eq(serviceRecommendationRules.triggerUnivers, input.univers),
          eq(serviceRecommendationRules.active, true),
        ))
        .orderBy(asc(serviceRecommendationRules.priority));
    }),
});

// ─── 2. CENTRE DE RECOMMANDATION INTELLIGENT ───
const recommendationEngine = router({
  logBehavior: protectedProcedure
    .input(z.object({
      action: z.string(),
      targetType: z.string(),
      targetId: z.number().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(userBehaviorLog).values({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  getMyRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return db.select().from(recommendations)
        .where(and(eq(recommendations.userId, ctx.user.id), eq(recommendations.seen, false)))
        .orderBy(desc(recommendations.score))
        .limit(input?.limit ?? 10);
    }),
  markSeen: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      for (const id of input.ids) {
        await db.update(recommendations).set({ seen: true }).where(eq(recommendations.id, id));
      }
      return { success: true };
    }),
  markClicked: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(recommendations).set({ clicked: true }).where(eq(recommendations.id, input.id));
      return { success: true };
    }),
  adminStats: adminProcedure.query(async () => {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(recommendations);
    const [clicked] = await db.select({ count: sql<number>`count(*)` }).from(recommendations).where(eq(recommendations.clicked, true));
    const [seen] = await db.select({ count: sql<number>`count(*)` }).from(recommendations).where(eq(recommendations.seen, true));
    return { total: Number(total.count), clicked: Number(clicked.count), seen: Number(seen.count) };
  }),
});

// ─── 3. CENTRE FOURNISSEURS MONDIAL ───
const fournisseursCenter = router({
  search: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      country: z.string().optional(),
      marque: z.string().optional(),
      query: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(ceSuppliers).where(eq(ceSuppliers.active, true));
      if (input.category) query = query.where(eq(ceSuppliers.category, input.category)) as any;
      if (input.country) query = query.where(eq(ceSuppliers.country, input.country)) as any;
      return query.orderBy(desc(ceSuppliers.noteMoyenne)).limit(50);
    }),
  getCatalogue: publicProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(ceSupplierCatalogue).where(eq(ceSupplierCatalogue.supplierId, input.supplierId)).limit(200);
    }),
  createSupplier: adminProcedure
    .input(z.object({
      name: z.string(),
      country: z.string(),
      city: z.string().optional(),
      category: z.string(),
      specialites: z.any().optional(),
      marques: z.any().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      website: z.string().optional(),
      delaiMoyenJours: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [s] = await db.insert(ceSuppliers).values(input).returning();
      return s;
    }),
  updateSupplier: adminProcedure
    .input(z.object({ id: z.number(), active: z.boolean().optional(), noteMoyenne: z.string().optional(), certified: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(ceSuppliers).set(data).where(eq(ceSuppliers.id, id));
      return { success: true };
    }),
});

// ─── 4. CENTRE DE DISTRIBUTION ───
const distributionCenter = router({
  listDepots: adminProcedure.query(async () => {
    return db.select().from(distributionDepots).orderBy(asc(distributionDepots.name));
  }),
  createDepot: adminProcedure
    .input(z.object({ name: z.string(), country: z.string(), city: z.string(), address: z.string().optional(), capacity: z.number().optional(), managerId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const [d] = await db.insert(distributionDepots).values(input).returning();
      return d;
    }),
  listShipments: adminProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(distributionShipments);
      if (input?.status) q = q.where(eq(distributionShipments.status, input.status)) as any;
      return q.orderBy(desc(distributionShipments.createdAt)).limit(input?.limit ?? 50);
    }),
  createShipment: adminProcedure
    .input(z.object({ fromDepotId: z.number().optional(), toDepotId: z.number().optional(), transporteurId: z.number().optional(), nbColis: z.number(), poidsKg: z.string().optional(), estimatedDelivery: z.string().optional() }))
    .mutation(async ({ input }) => {
      const ref = `MKA-S-${Date.now().toString(36).toUpperCase()}`;
      const [s] = await db.insert(distributionShipments).values({ ...input, reference: ref, estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : undefined }).returning();
      return s;
    }),
  updateShipmentStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const updates: any = { status: input.status, updatedAt: new Date() };
      if (input.status === "livre") updates.deliveredAt = new Date();
      await db.update(distributionShipments).set(updates).where(eq(distributionShipments.id, input.id));
      return { success: true };
    }),
});

// ─── 5. CENTRE DE FORMATION ───
const formationCenter = router({
  listCourses: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(ceFormationCourses).where(eq(ceFormationCourses.active, true));
      if (input?.category) q = q.where(eq(ceFormationCourses.category, input.category)) as any;
      return q.orderBy(asc(ceFormationCourses.ordre));
    }),
  getCourse: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [course] = await db.select().from(ceFormationCourses).where(eq(ceFormationCourses.id, input.id));
      if (!course) return null;
      const mods = await db.select().from(ceFormationModules).where(eq(ceFormationModules.courseId, input.id)).orderBy(asc(ceFormationModules.ordre));
      return { ...course, modules: mods };
    }),
  enroll: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [e] = await db.insert(ceFormationEnrollments).values({ userId: ctx.user.id, courseId: input.courseId }).returning();
      return e;
    }),
  updateProgress: protectedProcedure
    .input(z.object({ enrollmentId: z.number(), progress: z.number() }))
    .mutation(async ({ input }) => {
      const updates: any = { progress: input.progress };
      if (input.progress >= 100) updates.completedAt = new Date();
      await db.update(ceFormationEnrollments).set(updates).where(eq(ceFormationEnrollments.id, input.enrollmentId));
      return { success: true };
    }),
  submitExam: protectedProcedure
    .input(z.object({ enrollmentId: z.number(), courseId: z.number(), answers: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const [exam] = await db.select().from(ceFormationExams).where(eq(ceFormationExams.courseId, input.courseId));
      if (!exam) return { error: "Examen introuvable" };
      const questions = exam.questions as Array<{ correctIndex: number }>;
      let correct = 0;
      for (let i = 0; i < questions.length; i++) {
        if (input.answers[i] === questions[i].correctIndex) correct++;
      }
      const score = Math.round((correct / questions.length) * 100);
      const [course] = await db.select().from(ceFormationCourses).where(eq(ceFormationCourses.id, input.courseId));
      const passed = score >= (course?.passingScore ?? 70);
      await db.update(ceFormationEnrollments).set({ score, passed, completedAt: new Date(), progress: 100 }).where(eq(ceFormationEnrollments.id, input.enrollmentId));
      return { score, passed, correct, total: questions.length };
    }),
  createCourse: adminProcedure
    .input(z.object({ title: z.string(), description: z.string().optional(), category: z.string(), level: z.string().optional(), durationMinutes: z.number().optional(), passingScore: z.number().optional() }))
    .mutation(async ({ input }) => {
      const [c] = await db.insert(ceFormationCourses).values(input).returning();
      return c;
    }),
  myEnrollments: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(ceFormationEnrollments).where(eq(ceFormationEnrollments.userId, ctx.user.id));
  }),
});

// ─── 6. CENTRE MARKETPLACE B2B ───
const b2bCenter = router({
  listListings: publicProcedure
    .input(z.object({ category: z.string().optional(), marque: z.string().optional(), country: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(b2bListings).where(eq(b2bListings.active, true));
      if (input?.category) q = q.where(eq(b2bListings.category, input.category)) as any;
      if (input?.country) q = q.where(eq(b2bListings.country, input.country)) as any;
      return q.orderBy(desc(b2bListings.createdAt)).limit(input?.limit ?? 50);
    }),
  createListing: protectedProcedure
    .input(z.object({ sellerType: z.string(), category: z.string(), title: z.string(), description: z.string().optional(), marque: z.string().optional(), reference: z.string().optional(), prixUnitaireHT: z.string().optional(), quantiteMin: z.number().optional(), stock: z.number().optional(), delaiJours: z.number().optional(), country: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [l] = await db.insert(b2bListings).values({ ...input, sellerId: ctx.user.id }).returning();
      return l;
    }),
  createOrder: protectedProcedure
    .input(z.object({ listingId: z.number(), quantity: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [listing] = await db.select().from(b2bListings).where(eq(b2bListings.id, input.listingId));
      if (!listing) return { error: "Annonce introuvable" };
      const totalHT = listing.prixUnitaireHT ? String(Number(listing.prixUnitaireHT) * input.quantity) : "0";
      const ref = `MKA-B2B-${Date.now().toString(36).toUpperCase()}`;
      const [order] = await db.insert(b2bOrders).values({ reference: ref, buyerId: ctx.user.id, sellerId: listing.sellerId, listingId: input.listingId, quantity: input.quantity, totalHT }).returning();
      return order;
    }),
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(b2bOrders).where(eq(b2bOrders.buyerId, ctx.user.id)).orderBy(desc(b2bOrders.createdAt));
  }),
  mySales: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(b2bOrders).where(eq(b2bOrders.sellerId, ctx.user.id)).orderBy(desc(b2bOrders.createdAt));
  }),
});

// ─── 7. CENTRE STATISTIQUES IA ───
const statsIACenter = router({
  getReports: adminProcedure
    .input(z.object({ type: z.string().optional(), period: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(aiAnalysisReports);
      if (input?.type) q = q.where(eq(aiAnalysisReports.type, input.type)) as any;
      return q.orderBy(desc(aiAnalysisReports.generatedAt)).limit(20);
    }),
  getPredictions: adminProcedure
    .input(z.object({ targetType: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(aiPredictions);
      if (input?.targetType) q = q.where(eq(aiPredictions.targetType, input.targetType)) as any;
      return q.orderBy(desc(aiPredictions.createdAt)).limit(20);
    }),
  dashboard: adminProcedure.query(async () => {
    const [reports] = await db.select({ count: sql<number>`count(*)` }).from(aiAnalysisReports);
    const [predictions] = await db.select({ count: sql<number>`count(*)` }).from(aiPredictions);
    const recentInsights = await db.select().from(aiAnalysisReports).orderBy(desc(aiAnalysisReports.generatedAt)).limit(5);
    return { totalReports: Number(reports.count), totalPredictions: Number(predictions.count), recentInsights };
  }),
});

// ─── 8. CENTRE DOCUMENTS MONDIAL ───
const documentsCenter = router({
  list: protectedProcedure
    .input(z.object({ ownerType: z.string().optional(), category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let q = db.select().from(documentVault).where(eq(documentVault.ownerId, ctx.user.id));
      if (input?.category) q = q.where(eq(documentVault.category, input.category)) as any;
      return q.orderBy(desc(documentVault.createdAt)).limit(100);
    }),
  upload: protectedProcedure
    .input(z.object({ ownerType: z.string(), category: z.string(), title: z.string(), fileUrl: z.string(), mimeType: z.string().optional(), sizeBytes: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [doc] = await db.insert(documentVault).values({ ...input, ownerId: ctx.user.id }).returning();
      return doc;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(documentVault).where(and(eq(documentVault.id, input.id), eq(documentVault.ownerId, ctx.user.id)));
      return { success: true };
    }),
  adminList: adminProcedure
    .input(z.object({ ownerId: z.number().optional(), category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(documentVault);
      if (input?.ownerId) q = q.where(eq(documentVault.ownerId, input.ownerId)) as any;
      if (input?.category) q = q.where(eq(documentVault.category, input.category)) as any;
      return q.orderBy(desc(documentVault.createdAt)).limit(200);
    }),
});

// ─── 9. CENTRE PARTENAIRES ───
const partenairesCenter = router({
  list: adminProcedure
    .input(z.object({ sector: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(strategicPartners);
      if (input?.sector) q = q.where(eq(strategicPartners.sector, input.sector)) as any;
      if (input?.status) q = q.where(eq(strategicPartners.status, input.status)) as any;
      return q.orderBy(asc(strategicPartners.name));
    }),
  create: adminProcedure
    .input(z.object({ name: z.string(), sector: z.string(), country: z.string().optional(), contactName: z.string().optional(), contactEmail: z.string().optional(), contactPhone: z.string().optional(), commissionRate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [p] = await db.insert(strategicPartners).values(input).returning();
      return p;
    }),
  update: adminProcedure
    .input(z.object({ id: z.number(), status: z.string().optional(), commissionRate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(strategicPartners).set({ ...data, updatedAt: new Date() }).where(eq(strategicPartners.id, id));
      return { success: true };
    }),
});

// ─── 10. CENTRE OPEN API ───
const openApiCenter = router({
  listKeys: protectedProcedure.query(async ({ ctx }) => {
    return db.select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, scopes: apiKeys.scopes, rateLimit: apiKeys.rateLimit, active: apiKeys.active, lastUsedAt: apiKeys.lastUsedAt, createdAt: apiKeys.createdAt })
      .from(apiKeys).where(eq(apiKeys.userId, ctx.user.id));
  }),
  createKey: protectedProcedure
    .input(z.object({ name: z.string(), scopes: z.array(z.string()), rateLimit: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const rawKey = `mka_live_${crypto.randomUUID().replace(/-/g, "")}`;
      const keyHash = rawKey; // En production : utiliser bcrypt/sha256
      const keyPrefix = rawKey.slice(0, 16);
      const [k] = await db.insert(apiKeys).values({ userId: ctx.user.id, name: input.name, keyHash, keyPrefix, scopes: input.scopes, rateLimit: input.rateLimit ?? 1000 }).returning();
      return { id: k.id, key: rawKey, prefix: keyPrefix };
    }),
  revokeKey: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(apiKeys).set({ active: false }).where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
      return { success: true };
    }),
  getUsage: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(apiUsageLogs).where(eq(apiUsageLogs.apiKeyId, input.keyId)).orderBy(desc(apiUsageLogs.createdAt)).limit(100);
    }),
});

// ─── 11. CENTRE IA AUTOMATISATION ───
const automationCenter = router({
  emitEvent: protectedProcedure
    .input(z.object({ eventType: z.string(), sourceModule: z.string(), sourceId: z.number().optional(), payload: z.any().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [event] = await db.insert(automationEvents).values({ ...input, userId: ctx.user.id }).returning();
      // Chercher les workflows qui correspondent à cet événement
      const matchingWorkflows = await db.select().from(workflows)
        .where(and(eq(workflows.triggerEvent, input.eventType), eq(workflows.active, true)));
      // Créer les exécutions
      for (const wf of matchingWorkflows) {
        const actions = wf.actions as Array<{ type: string; params: any; ordre: number }>;
        await db.insert(workflowExecutions).values({ workflowId: wf.id, eventId: event.id, stepsTotal: actions.length });
        await db.update(workflows).set({ executionCount: (wf.executionCount || 0) + 1, lastExecutedAt: new Date() }).where(eq(workflows.id, wf.id));
      }
      // Logger l'orchestration
      await db.insert(orchestrationLog).values({ eventType: input.eventType, sourceModule: input.sourceModule, actionsTriggered: matchingWorkflows.length, actionsSucceeded: matchingWorkflows.length });
      return { eventId: event.id, workflowsTriggered: matchingWorkflows.length };
    }),
  listEvents: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.select().from(automationEvents).orderBy(desc(automationEvents.createdAt)).limit(input?.limit ?? 50);
    }),
  getOrchestrationLog: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.select().from(orchestrationLog).orderBy(desc(orchestrationLog.createdAt)).limit(input?.limit ?? 50);
    }),
});

// ─── 12. CENTRE WORKFLOW ───
const workflowCenter = router({
  list: adminProcedure.query(async () => {
    return db.select().from(workflows).orderBy(desc(workflows.updatedAt));
  }),
  create: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      triggerEvent: z.string(),
      triggerConditions: z.any().optional(),
      actions: z.array(z.object({ type: z.string(), params: z.any(), ordre: z.number() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const [wf] = await db.insert(workflows).values({ ...input, createdBy: ctx.user.id }).returning();
      return wf;
    }),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), active: z.boolean().optional(), actions: z.any().optional(), triggerConditions: z.any().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(workflows).set({ ...data, updatedAt: new Date() }).where(eq(workflows.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(workflows).set({ active: false }).where(eq(workflows.id, input.id));
      return { success: true };
    }),
  getExecutions: adminProcedure
    .input(z.object({ workflowId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      let q = db.select().from(workflowExecutions);
      if (input?.workflowId) q = q.where(eq(workflowExecutions.workflowId, input.workflowId)) as any;
      return q.orderBy(desc(workflowExecutions.startedAt)).limit(50);
    }),
});

// ─── 13. CENTRE RECHERCHE MONDIALE ───
const searchCenter = router({
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      univers: z.string().optional(),
      entityType: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(searchIndex.active, true)];
      if (input.univers) conditions.push(eq(searchIndex.univers, input.univers));
      if (input.entityType) conditions.push(eq(searchIndex.entityType, input.entityType));
      if (input.city) conditions.push(eq(searchIndex.city, input.city));
      if (input.country) conditions.push(eq(searchIndex.country, input.country));
      // Recherche textuelle simple (titre + description)
      conditions.push(
        or(
          sql`${searchIndex.title} ILIKE ${'%' + input.query + '%'}`,
          sql`${searchIndex.description} ILIKE ${'%' + input.query + '%'}`,
        )!,
      );
      return db.select().from(searchIndex)
        .where(and(...conditions))
        .orderBy(desc(searchIndex.score))
        .limit(input.limit ?? 20);
    }),
  indexEntity: adminProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number(), univers: z.string(), title: z.string(), description: z.string().optional(), keywords: z.any().optional(), city: z.string().optional(), country: z.string().optional(), imageUrl: z.string().optional(), url: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [entry] = await db.insert(searchIndex).values(input).returning();
      return entry;
    }),
  removeEntity: adminProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(searchIndex).set({ active: false }).where(and(eq(searchIndex.entityType, input.entityType), eq(searchIndex.entityId, input.entityId)));
      return { success: true };
    }),
  stats: adminProcedure.query(async () => {
    const rows = await db.select({ univers: searchIndex.univers, count: sql<number>`count(*)` }).from(searchIndex).where(eq(searchIndex.active, true)).groupBy(searchIndex.univers);
    return rows;
  }),
});

// ─── 14. CENTRE EXPANSION MONDIALE ───
const expansionCenter = router({
  listCountries: adminProcedure.query(async () => {
    return db.select().from(expansionCountries).orderBy(asc(expansionCountries.countryName));
  }),
  addCountry: adminProcedure
    .input(z.object({ countryCode: z.string(), countryName: z.string(), defaultLanguage: z.string().optional(), defaultCurrency: z.string().optional(), vatRate: z.string().optional(), paymentMethods: z.any().optional(), legalRequirements: z.any().optional(), launchDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [c] = await db.insert(expansionCountries).values({ ...input, launchDate: input.launchDate ? new Date(input.launchDate) : undefined }).returning();
      return c;
    }),
  updateCountry: adminProcedure
    .input(z.object({ id: z.number(), status: z.string().optional(), paymentMethods: z.any().optional(), vatRate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(expansionCountries).set({ ...data, updatedAt: new Date() }).where(eq(expansionCountries.id, id));
      return { success: true };
    }),
});

// ─── 15. CENTRE ÉCOSYSTÈME ───
const ecosystemCenter = router({
  listLinks: adminProcedure.query(async () => {
    return db.select().from(ecosystemLinks).where(eq(ecosystemLinks.active, true)).orderBy(asc(ecosystemLinks.priority));
  }),
  createLink: adminProcedure
    .input(z.object({ sourceModule: z.string(), sourceAction: z.string(), targetModule: z.string(), targetAction: z.string(), description: z.string().optional(), priority: z.number().optional() }))
    .mutation(async ({ input }) => {
      const [link] = await db.insert(ecosystemLinks).values(input).returning();
      return link;
    }),
  getOrchestrationDashboard: adminProcedure.query(async () => {
    const [totalEvents] = await db.select({ count: sql<number>`count(*)` }).from(automationEvents);
    const [totalWorkflows] = await db.select({ count: sql<number>`count(*)` }).from(workflows).where(eq(workflows.active, true));
    const [totalLinks] = await db.select({ count: sql<number>`count(*)` }).from(ecosystemLinks).where(eq(ecosystemLinks.active, true));
    const recentLogs = await db.select().from(orchestrationLog).orderBy(desc(orchestrationLog.createdAt)).limit(10);
    return {
      totalEvents: Number(totalEvents.count),
      totalWorkflows: Number(totalWorkflows.count),
      totalLinks: Number(totalLinks.count),
      recentLogs,
    };
  }),
});

// ═══ EXPORT ROUTER PRINCIPAL ═══
export const coreEngineRouter = router({
  services: serviceEngine,
  recommendations: recommendationEngine,
  fournisseurs: fournisseursCenter,
  distribution: distributionCenter,
  formation: formationCenter,
  b2b: b2bCenter,
  statsIA: statsIACenter,
  documents: documentsCenter,
  partenaires: partenairesCenter,
  openApi: openApiCenter,
  automation: automationCenter,
  workflow: workflowCenter,
  search: searchCenter,
  expansion: expansionCenter,
  ecosystem: ecosystemCenter,
});
