import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { users } from "../schema.js";
import { getProfile } from "@shared/profiles.js";
import {
  signToken,
  hashPassword,
  comparePassword,
  verifyGoogleIdToken,
} from "../auth.js";

function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    role: u.role,
    accountType: u.accountType,
    companyName: u.companyName,
    city: u.city,
    country: u.country,
    currency: u.currency,
    emailVerified: u.emailVerified,
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
      const token = signToken({ uid: created.id, role: created.role, email: created.email });
      return { token, user: publicUser(created), profileType: input.profileType ?? "particulier" };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (!u || !u.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides" });
      }
      const ok = await comparePassword(input.password, u.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides" });
      }
      const token = signToken({ uid: u.id, role: u.role, email: u.email });
      return { token, user: publicUser(u) };
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
        city: z.string().optional(),
        country: z.string().optional(),
        companyName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [u] = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.uid))
        .returning();
      return publicUser(u);
    }),
});
