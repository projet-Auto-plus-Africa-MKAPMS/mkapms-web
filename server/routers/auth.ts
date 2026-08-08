import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { users } from "../schema.js";
import { getProfile } from "@shared/profiles.js";
import { makeReference } from "../reference.js";
import { logAction, clientMeta } from "../audit.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import {
  signToken,
  hashPassword,
  comparePassword,
  verifyGoogleIdToken,
} from "../auth.js";
import { requestEmailVerification } from "../identity-os/complete.js";
import { resolveIdentityForUser } from "../identity-os/index.js";

function publicUser(u: typeof users.$inferSelect) {
  // Utiliser try/catch sur les champs nouveaux pour éviter tout crash
  // si la migration n'a pas encore été appliquée en production.
  const safeGet = (key: string, fallback: unknown = null) => {
    try { return (u as any)[key] ?? fallback; } catch { return fallback; }
  };
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    logoUrl: safeGet("logoUrl"),
    role: u.role,
    staffPosition: u.staffPosition,
    // Métier professionnel : l'Account Routing Engine en a besoin pour
    // ramener le compte dans le bon univers dès la connexion.
    proCategory: safeGet("proCategory"),
    reference: u.reference,
    accountType: u.accountType,
    companyName: u.companyName,
    companySiret: u.companySiret,
    companySiren: safeGet("companySiren"),
    hasVat: safeGet("hasVat", false),
    vatNumber: safeGet("vatNumber"),
    addressLine: u.addressLine,
    postalCode: u.postalCode,
    city: u.city,
    country: u.country,
    currency: u.currency,
    emailVerified: u.emailVerified,
    twoFactorEnabled: safeGet("twoFactorEnabled", false),
  };
}

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().optional(),
        accountType: z.enum(["particulier", "professionnel"]).default("particulier"),
        // Profil d'inscription (parcours §1-§7) : détermine rôle + documents.
        profileType: z
          .enum(["particulier", "pro_vente", "garage", "location", "vtc_taxi", "pieces", "livraison"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Email déjà utilisé" });
      }
      const profile = input.profileType ? getProfile(input.profileType) : undefined;
      const accountType = profile?.accountType ?? input.accountType;
      const role = profile?.role ?? (accountType === "professionnel" ? "pro" : "user");
      const passwordHash = await hashPassword(input.password);
      const [created] = await db
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
          phone: input.phone,
          accountType,
          role,
        })
        .returning();
      const reference = makeReference("U", created.id);
      await db.update(users).set({ reference }).where(eq(users.id, created.id));
      created.reference = reference;
      const token = signToken({ uid: created.id, role: created.role, email: created.email });
      // Smart Engine — hook inscription (fire-and-forget)
      logActivity({ action: "user.registered", userId: created.id, targetType: "user", targetId: created.id, data: { accountType, role }, result: "success" }).catch(() => {});
      // Email de vérification — fire-and-forget (ne bloque pas l'inscription)
      resolveIdentityForUser(created.id, { email: created.email, name: created.name })
        .then((identity: { id: number } | null | undefined) => {
          if (identity) {
            requestEmailVerification(identity.id, created.email, {}).catch(() => {});
          }
        })
        .catch(() => {});
      return { token, user: publicUser(created), profileType: input.profileType ?? "particulier" };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (!u || !u.passwordHash) {
        await logAction(u?.id ?? null, "auth.login_failed", "user", u?.id ?? null, { email: input.email }, clientMeta(ctx.req));
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides" });
      }
      const ok = await comparePassword(input.password, u.passwordHash);
      if (!ok) {
        await logAction(u.id, "auth.login_failed", "user", u.id, undefined, clientMeta(ctx.req));
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides" });
      }
      const token = signToken({ uid: u.id, role: u.role, email: u.email });
      await logAction(u.id, "auth.login", "user", u.id, undefined, clientMeta(ctx.req));
      // Smart Engine — hook connexion (fire-and-forget)
      logActivity({ action: "user.login", userId: u.id, targetType: "user", targetId: u.id, data: { role: u.role }, result: "success" }).catch(() => {});
      return { token, user: publicUser(u) };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await logAction(ctx.user.uid, "auth.logout", "user", ctx.user.uid, undefined, clientMeta(ctx.req));
    return { ok: true };
  }),

  googleLogin: publicProcedure
    .input(z.object({ idToken: z.string() }))
    .mutation(async ({ input }) => {
      const profile = await verifyGoogleIdToken(input.idToken);
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Google non vérifié" });
      }
      let [u] = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email.toLowerCase()))
        .limit(1);
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
        u.reference = reference;
      } else if (!u.googleId) {
        await db
          .update(users)
          .set({ googleId: profile.googleId, emailVerified: true })
          .where(eq(users.id, u.id));
      }
      const token = signToken({ uid: u.id, role: u.role, email: u.email });
      return { token, user: publicUser(u) };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const [u] = await db.select().from(users).where(eq(users.id, ctx.user.uid)).limit(1);
    return u ? publicUser(u) : null;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        addressLine: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        companyName: z.string().optional(),
        companySiret: z.string().optional(),
        companySiren: z.string().optional(),
        hasVat: z.boolean().optional(),
        vatNumber: z.string().optional(),
        avatarUrl: z.string().optional(),
        logoUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Filtrer les champs undefined pour ne pas écraser des valeurs existantes
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(input)) {
        if (v !== undefined) patch[k] = v;
      }
      const [u] = await db
        .update(users)
        .set(patch as any)
        .where(eq(users.id, ctx.user.uid))
        .returning();
      return publicUser(u);
    }),
});
