/**
 * MKA.P-MS Permission Engine — Sub-router TRPC (connexion contrôlée).
 *
 * Expose :
 *  - myAccess : modules autorisés pour l'utilisateur courant (menus dynamiques)
 *  - check    : vérifier une permission précise
 *  - logDenied: le client signale une tentative d'accès UI refusée
 *  - journal  : le PDG consulte le journal de sécurité
 *  - stats    : synthèse sécurité (PDG)
 *  - grants   : accès temporaires (PDG)
 */
import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { router, protectedProcedure, pdgProcedure } from "../trpc.js";
import { db } from "../db.js";
import { permSecurityLog, permTemporaryGrants } from "./schema.js";
import {
  MODULE_ACCESS,
  canAccessModule,
  type PermissionModule,
} from "@shared/permissions.js";
import type { UserRole } from "@shared/roles.js";
import { logAccess } from "./journal.js";

const moduleEnum = z.string();

export const permissionEngineRouter = router({
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

  // Le client signale une tentative d'accès UI refusée (page interdite).
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

  // ── PDG uniquement ──────────────────────────────────────────────────
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
});
