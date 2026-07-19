/**
 * Identity OS — tRPC router (Sprint 1)
 *
 * Namespace : `identity.*`
 * Rôle : exposer la surface publique de l'Identity OS conformément au
 *        contrat défini dans `contract.ts` et à la doctrine MOS.
 *
 * Sprint 1 — endpoints livrés :
 *   • identity.me           → identité courante + contexte
 *   • identity.healthStatus → statut normalisé du moteur (obligatoire)
 *   • identity.sessions.list
 *   • identity.audit.recent
 *
 * Endpoints à venir Sprint 2 : login, register, upgrade, MFA, révocation
 * ciblée. La logique legacy (`server/routers/auth.ts`) reste en place et
 * fonctionne — l'Identity OS s'y branche via `resolveIdentityForUser`.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../trpc.js";
import {
  healthStatus,
  listActiveSessions,
  recentAudit,
  resolveIdentityForUser,
  revokeSession,
  audit,
  IDENTITY_OS_META,
} from "./service.js";
import { DEFAULT_ROLES_BY_TYPE, type IdentityRole, type IdentityType } from "./contract.js";

const identityTypeSchema = z.enum([
  "visitor",
  "user",
  "pro",
  "partner",
  "franchisee",
  "universe_operator",
  "employee",
  "admin",
  "ai_agent",
]);

/** Map role legacy (users.role) → type Identity OS (best-effort). */
function mapLegacyRoleToType(role: string | undefined): IdentityType {
  if (!role) return "user";
  if (role === "super_admin" || role === "admin" || role === "directeur") return "admin";
  if (role === "employee") return "employee";
  if (["pro", "garage", "society"].includes(role)) return "pro";
  return "user";
}

export const identityRouter = router({
  /**
   * Métadonnées du moteur (version, contrat). Public — utile aux autres
   * moteurs pour vérifier la compatibilité.
   */
  meta: publicProcedure.query(() => IDENTITY_OS_META),

  /**
   * Health Status — endpoint standardisé (règle MOS #11).
   * Public en lecture pour permettre au moteur de monitoring d'y accéder
   * sans privilège spécial. Ne divulgue aucune donnée personnelle.
   */
  healthStatus: publicProcedure.query(async () => healthStatus()),

  /**
   * Identité courante enrichie (rôles, contexte).
   * Passe par la table legacy pour ne rien casser tant que la migration
   * complète n'est pas jouée.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return {
        authenticated: false,
        identity: null,
        context: { type: "visitor" as IdentityType, roles: [] as IdentityRole[] },
      };
    }
    const type = mapLegacyRoleToType(ctx.user.role);
    const roles = DEFAULT_ROLES_BY_TYPE[type] ?? [];
    const identity = await resolveIdentityForUser(
      ctx.user.uid,
      { type, email: ctx.user.email, roles },
      { createIfMissing: true },
    );
    return {
      authenticated: true,
      identity: identity
        ? {
            id: identity.id,
            legacyUserId: identity.legacyUserId,
            type: identity.type as IdentityType,
            roles: (identity.roles ?? []) as IdentityRole[],
            status: identity.status as "active" | "suspended" | "archived",
            email: identity.email,
            displayName: identity.displayName,
            countryCode: identity.countryCode,
            languageCode: identity.languageCode,
            createdAt: identity.createdAt,
            lastLoginAt: identity.lastLoginAt,
          }
        : null,
      context: { type, roles },
    };
  }),

  sessions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const identity = await resolveIdentityForUser(ctx.user.uid);
      if (!identity) return [];
      return listActiveSessions(identity.id);
    }),

    revoke: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Identité introuvable" });
        }
        const row = await revokeSession(input.sessionId, identity.id, "revoked");
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session introuvable" });
        }
        return { ok: true, sessionId: row.id };
      }),
  }),

  audit: router({
    recent: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) return [];
        return recentAudit(input?.limit ?? 50, identity.id);
      }),

    // Vue globale réservée à la Direction pour le Centre PDG.
    all: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => recentAudit(input?.limit ?? 100)),
  }),

  /**
   * Endpoint interne — utilisé par les autres moteurs pour signaler
   * un événement lié à une identité (audit best-effort). Réservé aux
   * appels serveur authentifiés en admin.
   */
  reportEvent: adminProcedure
    .input(
      z.object({
        identityId: z.number().int().positive().optional(),
        actorIdentityId: z.number().int().positive().optional(),
        action: z.string().min(1).max(64),
        reason: z.string().max(500).optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await audit(input);
      return { ok: true };
    }),

  // Endpoint de configuration — types d'identité supportés (public info).
  types: publicProcedure.query(() => ({
    types: identityTypeSchema.options,
    defaultRolesByType: DEFAULT_ROLES_BY_TYPE,
  })),
});
