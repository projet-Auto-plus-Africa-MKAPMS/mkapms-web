/**
 * Identity OS — tRPC router (Sprint 3 — Complétude fonctionnelle)
 *
 * Namespace : `identity.*` — surface publique complète conforme au contrat
 * (`contract.ts`) et à la règle MOS #15 (complétude immédiate).
 *
 * Le router est décomposé en sous-routers logiques :
 *   • Métadonnées & santé — meta, healthStatus, types, dashboard, controlCenterFeed
 *   • Bridge auth (parallèle à auth.ts legacy — non destructif) — login, register, logout, oauthGoogle, changePassword
 *   • Vérifications — email.send/verify, phone.send/verify
 *   • Récupération de compte — password.forgot/reset
 *   • MFA — mfa.setup/enable/verify/disable/status
 *   • Sessions & appareils — sessions.list/revoke, devices.list, session.refresh
 *   • Anomalies — anomalies.recent
 *   • Compte — account.archive, refreshToken
 *   • Agents Intelligence — aiAgents.create/list/revoke
 *   • Audit — audit.recent, audit.all, reportEvent
 *
 * Aucun endpoint `auth.*` n'est supprimé.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../trpc.js";
import { db } from "../db.js";
import { users } from "../schema.js";
import { identities } from "./schema.js";
import {
  signToken,
  hashPassword,
  comparePassword,
  verifyGoogleIdToken,
} from "../auth.js";
import { makeReference } from "../reference.js";
import { logAction, clientMeta } from "../audit.js";
import {
  audit,
  controlCenterFeed,
  dashboard,
  healthStatus,
  listActiveSessions,
  recentAudit,
  resolveIdentityForUser,
  revokeSession,
  IDENTITY_OS_META,
} from "./service.js";
import {
  archiveIdentity,
  changePassword as changePasswordSvc,
  confirmEmailVerification,
  confirmPasswordReset,
  confirmPhoneVerification,
  createAiAgent,
  isLockedOut,
  listAiAgents,
  listDevices,
  mfaDisable,
  mfaEnable,
  mfaIsActivated,
  mfaSetup,
  persistSession,
  recentAnomalies,
  recordLoginAttempt,
  refreshSession,
  reissueToken,
  requestEmailVerification,
  requestPasswordReset,
  requestPhoneVerification,
  revokeAiAgent,
} from "./complete.js";
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

  // ────────────────────────────────────────────────────────────────────
  // Sprint 2 — MOS Control Center + Dashboard (règles #13 / #14)
  // ────────────────────────────────────────────────────────────────────

  /** Feed standard MOS consommé par le Control Center et les moteurs centraux. */
  controlCenterFeed: publicProcedure.query(async () => controlCenterFeed()),

  /** Tableau de bord dédié Identity OS (règle MOS #13). */
  dashboard: adminProcedure.query(async () => dashboard()),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 2 — Bridge auth.ts → identity.* (parallèle, non destructif)
  //
  // Ces endpoints délèguent aux mêmes primitives (`users` table +
  // `signToken`/`hashPassword`) que `auth.ts`. Objectif : permettre au
  // frontend de basculer progressivement vers `identity.*` sans casser
  // `auth.*` legacy. La suppression finale de `auth.ts` interviendra en
  // Sprint 3 après validation PDG (méthode Bridge → Validation →
  // Migration → Suppression).
  // ────────────────────────────────────────────────────────────────────

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        mfaCode: z.string().optional(), // TOTP 6 digits ou backup code
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meta = clientMeta(ctx.req);
      // 1. Anti-abus — lockout email/IP après trop d'échecs récents.
      if (await isLockedOut(input.email, meta.ipAddress)) {
        await recordLoginAttempt(input.email, false, { reason: "lockout", ip: meta.ipAddress, ua: meta.userAgent });
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de tentatives — réessayez dans quelques minutes" });
      }
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (!u || !u.passwordHash) {
        await recordLoginAttempt(input.email, false, { reason: "unknown_or_no_hash", ip: meta.ipAddress, ua: meta.userAgent });
        await audit({ action: "identity.login_failed", reason: "unknown_or_no_hash", metadata: { email: input.email }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides" });
      }
      const ok = await comparePassword(input.password, u.passwordHash);
      if (!ok) {
        await recordLoginAttempt(input.email, false, { identityId: undefined, reason: "bad_password", ip: meta.ipAddress, ua: meta.userAgent });
        await audit({ action: "identity.login_failed", reason: "bad_password", metadata: { legacyUserId: u.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides" });
      }
      const identity = await resolveIdentityForUser(u.id, {
        type: mapLegacyRoleToType(u.role),
        email: u.email,
        name: u.name,
        roles: DEFAULT_ROLES_BY_TYPE[mapLegacyRoleToType(u.role)] ?? [],
      });
      // 2. MFA — si activée, exige un code TOTP ou un backup code valide.
      const mfaOn = identity ? await mfaIsActivated(identity.id) : false;
      if (mfaOn) {
        if (!input.mfaCode) {
          return { requiresMfa: true as const, token: null, identityId: identity!.id, user: null };
        }
        const { mfaVerify } = await import("./complete.js");
        const mfaOk = await mfaVerify(identity!.id, input.mfaCode);
        if (!mfaOk) {
          await recordLoginAttempt(input.email, false, { identityId: identity!.id, reason: "mfa_failed", ip: meta.ipAddress, ua: meta.userAgent });
          await audit({ identityId: identity!.id, action: "identity.login_failed", reason: "mfa_failed", ipAddress: meta.ipAddress, userAgent: meta.userAgent });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Code MFA invalide" });
        }
      }
      const token = signToken({ uid: u.id, role: u.role, email: u.email });
      // 3. Persistance session + audit succès.
      if (identity) {
        await persistSession(identity.id, { userAgent: meta.userAgent, ip: meta.ipAddress });
        await db.update(identities).set({ lastLoginAt: new Date() }).where(eq(identities.id, identity.id));
      }
      await recordLoginAttempt(input.email, true, { identityId: identity?.id, ip: meta.ipAddress, ua: meta.userAgent });
      await logAction(u.id, "auth.login", "user", u.id, undefined, meta);
      await audit({ identityId: identity?.id, action: "identity.login", metadata: { via: "identity.login", legacyUserId: u.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
      return {
        requiresMfa: false as const,
        token,
        identityId: identity?.id ?? null,
        user: {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          accountType: u.accountType,
        },
      };
    }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().optional(),
        accountType: z.enum(["particulier", "professionnel"]).default("particulier"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Email déjà utilisé" });
      }
      const role = input.accountType === "professionnel" ? "pro" : "user";
      const passwordHash = await hashPassword(input.password);
      const [created] = await db
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
          phone: input.phone,
          accountType: input.accountType,
          role,
        })
        .returning();
      const reference = makeReference("U", created.id);
      await db.update(users).set({ reference }).where(eq(users.id, created.id));
      const identity = await resolveIdentityForUser(created.id, {
        type: mapLegacyRoleToType(role),
        email: created.email,
        name: created.name,
        roles: DEFAULT_ROLES_BY_TYPE[mapLegacyRoleToType(role)] ?? [],
      });
      const token = signToken({ uid: created.id, role: created.role, email: created.email });
      await audit({
        identityId: identity?.id,
        action: "identity.registered",
        metadata: { via: "identity.register", legacyUserId: created.id, accountType: input.accountType },
        ...clientMeta(ctx.req),
      });
      return {
        token,
        identityId: identity?.id ?? null,
        user: {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
          accountType: created.accountType,
          reference,
        },
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const identity = await resolveIdentityForUser(ctx.user.uid, undefined, { createIfMissing: false });
    await audit({
      identityId: identity?.id,
      action: "identity.logout",
      metadata: { legacyUserId: ctx.user.uid },
      ...clientMeta(ctx.req),
    });
    return { ok: true };
  }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — OAuth Google (bridge non destructif)
  // ────────────────────────────────────────────────────────────────────

  oauthGoogle: publicProcedure
    .input(z.object({ idToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const meta = clientMeta(ctx.req);
      const profile = await verifyGoogleIdToken(input.idToken);
      if (!profile) {
        await audit({ action: "identity.oauth_google.failed", reason: "invalid_id_token", ipAddress: meta.ipAddress, userAgent: meta.userAgent });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Google non vérifié" });
      }
      let [u] = await db.select().from(users).where(eq(users.email, profile.email.toLowerCase())).limit(1);
      if (!u) {
        [u] = await db
          .insert(users)
          .values({
            email: profile.email.toLowerCase(),
            name: profile.name,
            googleId: profile.googleId,
            avatarUrl: profile.picture,
            emailVerified: true,
            role: "user",
          })
          .returning();
        const reference = makeReference("U", u.id);
        await db.update(users).set({ reference }).where(eq(users.id, u.id));
      } else if (!u.googleId) {
        await db.update(users).set({ googleId: profile.googleId, emailVerified: true }).where(eq(users.id, u.id));
      }
      const identity = await resolveIdentityForUser(u.id, {
        type: mapLegacyRoleToType(u.role),
        email: u.email,
        name: u.name,
        roles: DEFAULT_ROLES_BY_TYPE[mapLegacyRoleToType(u.role)] ?? [],
      });
      const token = signToken({ uid: u.id, role: u.role, email: u.email });
      if (identity) {
        await persistSession(identity.id, { userAgent: meta.userAgent, ip: meta.ipAddress });
        await db.update(identities).set({ lastLoginAt: new Date(), emailVerified: true }).where(eq(identities.id, identity.id));
      }
      await audit({ identityId: identity?.id, action: "identity.oauth_google.success", metadata: { legacyUserId: u.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
      return {
        token,
        identityId: identity?.id ?? null,
        user: { id: u.id, email: u.email, name: u.name, role: u.role, accountType: u.accountType },
      };
    }),

  refreshToken: protectedProcedure.mutation(async ({ ctx }) => {
    const token = await reissueToken(ctx.user.uid);
    if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identité inconnue" });
    const identity = await resolveIdentityForUser(ctx.user.uid, undefined, { createIfMissing: false });
    await audit({ identityId: identity?.id, action: "identity.token.refreshed", ...clientMeta(ctx.req) });
    return { token };
  }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const res = await changePasswordSvc(ctx.user.uid, input.currentPassword, input.newPassword);
      if (!res.ok) throw new TRPCError({ code: "BAD_REQUEST", message: res.reason });
      return { ok: true };
    }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — Vérifications (email + téléphone)
  // ────────────────────────────────────────────────────────────────────

  email: router({
    sendVerification: protectedProcedure.mutation(async ({ ctx }) => {
      const identity = await resolveIdentityForUser(ctx.user.uid);
      if (!identity?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune adresse email" });
      return requestEmailVerification(identity.id, identity.email, { ip: clientMeta(ctx.req).ipAddress, ua: clientMeta(ctx.req).userAgent });
    }),
    verify: publicProcedure
      .input(z.object({ token: z.string().min(20) }))
      .mutation(async ({ input }) => {
        const r = await confirmEmailVerification(input.token);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return { ok: true };
      }),
  }),

  phone: router({
    sendVerification: protectedProcedure
      .input(z.object({ phone: z.string().min(5).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        return requestPhoneVerification(identity.id, input.phone, { ip: clientMeta(ctx.req).ipAddress });
      }),
    verify: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        const r = await confirmPhoneVerification(identity.id, input.code);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return { ok: true };
      }),
  }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — Récupération mot de passe (public, anti-énumération)
  // ────────────────────────────────────────────────────────────────────

  password: router({
    forgot: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        const meta = clientMeta(ctx.req);
        return requestPasswordReset(input.email, { ip: meta.ipAddress, ua: meta.userAgent });
      }),
    reset: publicProcedure
      .input(z.object({ token: z.string().min(20), newPassword: z.string().min(8) }))
      .mutation(async ({ ctx, input }) => {
        const r = await confirmPasswordReset(input.token, input.newPassword, { ip: clientMeta(ctx.req).ipAddress });
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return { ok: true };
      }),
  }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — MFA TOTP + backup codes
  // ────────────────────────────────────────────────────────────────────

  mfa: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const identity = await resolveIdentityForUser(ctx.user.uid);
      if (!identity) return { activated: false };
      return { activated: await mfaIsActivated(identity.id) };
    }),
    setup: protectedProcedure.mutation(async ({ ctx }) => {
      const identity = await resolveIdentityForUser(ctx.user.uid);
      if (!identity?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Email requis" });
      const r = await mfaSetup(identity.id, identity.email);
      if (!r.ok) throw new TRPCError({ code: "CONFLICT", message: r.reason });
      return { otpauth: r.otpauth, secret: r.secret, backupCodes: r.backupCodes };
    }),
    enable: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        const r = await mfaEnable(identity.id, input.code);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return { ok: true };
      }),
    disable: protectedProcedure
      .input(z.object({ currentPassword: z.string().min(6) }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        const r = await mfaDisable(identity.id, input.currentPassword);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return { ok: true };
      }),
  }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — Appareils + rafraîchissement session
  // ────────────────────────────────────────────────────────────────────

  devices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const identity = await resolveIdentityForUser(ctx.user.uid);
      if (!identity) return [];
      return listDevices(identity.id);
    }),
  }),

  session: router({
    touch: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await refreshSession(input.sessionId);
        return { ok: true };
      }),
  }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — Anomalies + archivage compte
  // ────────────────────────────────────────────────────────────────────

  anomalies: router({
    recent: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => recentAnomalies(input?.limit ?? 100)),
  }),

  account: router({
    archive: protectedProcedure
      .input(z.object({ reason: z.string().max(500).default("user_request") }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        return archiveIdentity(identity.id, identity.id, input.reason);
      }),
  }),

  // ────────────────────────────────────────────────────────────────────
  // Sprint 3 — Agents Intelligence (comptes machine avec clés API)
  // ────────────────────────────────────────────────────────────────────

  aiAgents: router({
    create: protectedProcedure
      .input(
        z.object({
          label: z.string().min(2).max(160),
          purpose: z.string().min(2).max(64),
          scopes: z.array(z.string().max(64)).max(50).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        return createAiAgent(identity.id, input);
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const identity = await resolveIdentityForUser(ctx.user.uid);
      if (!identity) return [];
      return listAiAgents(identity.id);
    }),
    revoke: protectedProcedure
      .input(z.object({ agentId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const identity = await resolveIdentityForUser(ctx.user.uid);
        if (!identity) throw new TRPCError({ code: "UNAUTHORIZED" });
        const r = await revokeAiAgent(input.agentId, identity.id);
        if (!r.ok) throw new TRPCError({ code: "NOT_FOUND" });
        return { ok: true };
      }),
  }),
});
