/**
 * MKA.P-MS Permission Engine — Sub-router TRPC (connexion contrôlée).
 *
 * Sprint 3 — complétude fonctionnelle (règle MOS #15).
 *
 * Endpoints EXISTANTS conservés (100 %) :
 *  - myAccess, check, logDenied, journal, stats, grants, grant, revokeGrant
 *
 * Endpoints AJOUTÉS (Permission OS complet) :
 *  - meta / healthStatus / dashboard / controlCenterFeed  (règles MOS #11/#13/#14)
 *  - resolve / explain / simulate                          (niveau 2 — intelligent)
 *  - policies.list / create / update / delete
 *  - delegations.create / list / revoke
 *  - resolutions.recent
 */
import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { router, protectedProcedure, pdgProcedure, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { permSecurityLog, permTemporaryGrants } from "./schema.js";
import {
  MODULE_ACCESS,
  canAccessModule,
  type PermissionModule,
} from "@shared/permissions.js";
import type { UserRole } from "@shared/roles.js";
import { logAccess } from "./journal.js";
import {
  controlCenterFeed,
  createDelegation,
  createPolicy,
  dashboard,
  deletePolicy,
  healthStatus,
  listDelegations,
  listPolicies,
  PERMISSION_OS_META,
  revokeDelegation,
  updatePolicy,
} from "./service.js";
import {
  countRecentDecisions,
  recentResolutions,
  resolvePermission,
  simulatePermission,
} from "./intelligence.js";
import type { PermissionContext } from "./contract.js";

const moduleEnum = z.string();
const actionEnum = z.enum(["voir", "creer", "modifier", "supprimer", "valider", "exporter", "publier", "archiver"]).default("voir");

// Schéma de contexte d'évaluation (partiel — enrichi côté serveur).
const contextSchema = z.object({
  countryCode: z.string().max(4).optional(),
  universe: z.string().max(32).optional(),
  subscriptionTier: z.enum(["free", "starter", "pro", "enterprise"]).optional(),
  contractType: z.enum(["particulier", "professionnel", "franchise", "partner"]).optional(),
  accountAgeDays: z.number().int().nonnegative().optional(),
  deviceTrusted: z.boolean().optional(),
  riskScore: z.number().min(0).max(100).optional(),
});

const conditionsSchema = z
  .object({
    roles: z.array(z.string()).optional(),
    identityTypes: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    countriesExcept: z.array(z.string()).optional(),
    universes: z.array(z.string()).optional(),
    subscriptionTiers: z.array(z.string()).optional(),
    contractTypes: z.array(z.string()).optional(),
    minAccountAgeDays: z.number().int().nonnegative().optional(),
    maxRiskScore: z.number().min(0).max(100).optional(),
    requireEmailVerified: z.boolean().optional(),
    requirePhoneVerified: z.boolean().optional(),
    requireDeviceTrusted: z.boolean().optional(),
    requireMfa: z.boolean().optional(),
    timeWindow: z
      .object({
        dayOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
        hourFrom: z.number().int().min(0).max(23).optional(),
        hourTo: z.number().int().min(0).max(23).optional(),
      })
      .optional(),
  })
  .default({});

export const permissionEngineRouter = router({
  // ══════════════════════════════════════════════════════════════════
  // ENDPOINTS EXISTANTS (Sprint 1 legacy — conservés à l'identique)
  // ══════════════════════════════════════════════════════════════════

  // Modules autorisés pour l'utilisateur courant → menus dynamiques côté client.
  myAccess: protectedProcedure.query(({ ctx }) => {
    const role = ctx.user.role as UserRole;
    const modules = MODULE_ACCESS[role] ?? [];
    return { role, modules };
  }),

  // Vérifie une permission précise (module).
  check: protectedProcedure
    .input(z.object({ module: moduleEnum }))
    .query(({ ctx, input }) => {
      const allowed = canAccessModule(ctx.user.role, input.module as PermissionModule);
      return { allowed };
    }),

  logDenied: protectedProcedure
    .input(
      z.object({
        module: moduleEnum.optional(),
        path: z.string().optional(),
        reason: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      logAccess({
        userId: ctx.user.uid,
        role: ctx.user.role,
        module: input.module ?? null,
        path: input.path ?? null,
        side: "ui",
        allowed: false,
        reason: input.reason ?? "ui_forbidden",
      });
      return { logged: true };
    }),

  journal: pdgProcedure
    .input(
      z
        .object({
          onlyDenied: z.boolean().optional(),
          limit: z.number().min(1).max(500).default(100),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 100;
      const where = input?.onlyDenied ? eq(permSecurityLog.allowed, false) : undefined;
      const rows = await db
        .select()
        .from(permSecurityLog)
        .where(where)
        .orderBy(desc(permSecurityLog.createdAt))
        .limit(limit);
      return rows;
    }),

  stats: pdgProcedure.query(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        denied: sql<number>`count(*) filter (where ${permSecurityLog.allowed} = false)::int`,
      })
      .from(permSecurityLog)
      .where(gte(permSecurityLog.createdAt, since));
    const topDenied = await db
      .select({
        module: permSecurityLog.module,
        count: sql<number>`count(*)::int`,
      })
      .from(permSecurityLog)
      .where(and(eq(permSecurityLog.allowed, false), gte(permSecurityLog.createdAt, since)))
      .groupBy(permSecurityLog.module)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
    return {
      last24h: totals?.total ?? 0,
      denied24h: totals?.denied ?? 0,
      topDenied,
    };
  }),

  grants: pdgProcedure.query(async () => {
    return db
      .select()
      .from(permTemporaryGrants)
      .orderBy(desc(permTemporaryGrants.createdAt));
  }),

  grant: pdgProcedure
    .input(
      z.object({
        userId: z.number(),
        module: moduleEnum,
        action: z.string().default("voir"),
        readOnly: z.boolean().default(true),
        reason: z.string().optional(),
        expiresAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [g] = await db
        .insert(permTemporaryGrants)
        .values({
          userId: input.userId,
          module: input.module,
          action: input.action,
          readOnly: input.readOnly,
          reason: input.reason,
          expiresAt: input.expiresAt,
          grantedBy: ctx.user.uid,
        })
        .returning();
      return g;
    }),

  revokeGrant: pdgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [g] = await db
        .update(permTemporaryGrants)
        .set({ revoked: true })
        .where(eq(permTemporaryGrants.id, input.id))
        .returning();
      return g;
    }),

  // ══════════════════════════════════════════════════════════════════
  // ENDPOINTS AJOUTÉS Sprint 3 — Complétude (règles MOS #11/#13/#14/#15)
  // ══════════════════════════════════════════════════════════════════

  meta: publicProcedure.query(() => PERMISSION_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  /**
   * Résolution complète — retourne allowed + reason + humanExplanation.
   * Enrichit automatiquement le contexte avec l'identité courante.
   */
  resolve: protectedProcedure
    .input(z.object({ module: moduleEnum, action: actionEnum, context: contextSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const ctxEval: PermissionContext = {
        userId: ctx.user.uid,
        role: ctx.user.role as UserRole,
        ...(input.context ?? {}),
      };
      return resolvePermission(ctxEval, input.module as PermissionModule, input.action as any);
    }),

  /** Alias `explain` (identique à resolve — sémantique UI plus claire). */
  explain: protectedProcedure
    .input(z.object({ module: moduleEnum, action: actionEnum, context: contextSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const ctxEval: PermissionContext = {
        userId: ctx.user.uid,
        role: ctx.user.role as UserRole,
        ...(input.context ?? {}),
      };
      return resolvePermission(ctxEval, input.module as PermissionModule, input.action as any);
    }),

  /** Simulation admin — n'écrit rien en base. */
  simulate: adminProcedure
    .input(
      z.object({
        role: z.string(),
        module: moduleEnum,
        action: actionEnum,
        userId: z.number().optional(),
        context: contextSchema.optional(),
      }),
    )
    .query(async ({ input }) => {
      const ctxEval: PermissionContext = {
        userId: input.userId,
        role: input.role as UserRole,
        ...(input.context ?? {}),
      };
      return simulatePermission(ctxEval, input.module as PermissionModule, input.action as any);
    }),

  policies: router({
    list: adminProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(({ input }) => listPolicies({ activeOnly: input?.activeOnly })),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(2).max(160),
          module: moduleEnum,
          action: z.string().min(1).max(32),
          effect: z.enum(["allow", "deny"]),
          priority: z.number().int().min(0).max(10_000).default(100),
          conditions: conditionsSchema.optional(),
          active: z.boolean().default(true),
          expiresAt: z.date().optional(),
        }),
      )
      .mutation(({ ctx, input }) => createPolicy({ ...input, createdBy: ctx.user.uid, conditions: input.conditions as any })),
    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).max(160).optional(),
          effect: z.enum(["allow", "deny"]).optional(),
          priority: z.number().int().min(0).max(10_000).optional(),
          conditions: conditionsSchema.optional(),
          active: z.boolean().optional(),
          expiresAt: z.date().nullable().optional(),
        }),
      )
      .mutation(({ input }) => {
        const { id, ...patch } = input;
        return updatePolicy(id, patch as any);
      }),
    disable: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deletePolicy(input.id)),
  }),

  delegations: router({
    create: protectedProcedure
      .input(
        z.object({
          fromIdentityId: z.number().int().positive(),
          toIdentityId: z.number().int().positive(),
          module: moduleEnum,
          action: z.string().default("voir"),
          reason: z.string().max(500).optional(),
          expiresAt: z.date().optional(),
        }),
      )
      .mutation(({ input }) => createDelegation(input)),
    list: protectedProcedure
      .input(z.object({ identityId: z.number().int().positive(), direction: z.enum(["from", "to", "both"]).default("both") }))
      .query(({ input }) => listDelegations(input.identityId, input.direction)),
    revoke: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), reason: z.string().max(64).default("revoked") }))
      .mutation(({ input }) => revokeDelegation(input.id, input.reason)),
  }),

  resolutions: router({
    recent: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100), onlyDenied: z.boolean().default(false) }).optional())
      .query(({ input }) => recentResolutions(input?.limit ?? 100, input?.onlyDenied ?? false)),
    counters: publicProcedure
      .input(z.object({ sinceMin: z.number().int().min(1).max(1440).default(5) }).optional())
      .query(({ input }) => countRecentDecisions(input?.sinceMin ?? 5)),
  }),
});
