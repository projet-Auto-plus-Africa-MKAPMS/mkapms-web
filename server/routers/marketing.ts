import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { qrCodes, referralCodes, banners, newsletterSubscribers } from "../schema.js";

// Marketing / QR codes / parrainage / bannières (Plan Partie 2 §18).
export const marketingRouter = router({
  /**
   * Inscription à la lettre d'information depuis le pied de page.
   * Ré-inscrire une adresse déjà connue la réactive au lieu d'échouer.
   */
  subscribeNewsletter: publicProcedure
    .input(
      z.object({
        email: z.string().email().max(190),
        pays: z.string().length(2).optional(),
        langue: z.string().max(8).optional(),
        source: z.string().max(64).default("footer"),
      }),
    )
    .mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      await db
        .insert(newsletterSubscribers)
        .values({ ...input, email })
        .onConflictDoUpdate({
          target: newsletterSubscribers.email,
          set: { active: true, updatedAt: new Date() },
        });
      return { ok: true as const, email };
    }),

  banners: publicProcedure
    .input(z.object({ emplacement: z.string().optional() }).default({}))
    .query(async ({ input }) => {
      const conds = [eq(banners.active, true)];
      if (input.emplacement) conds.push(eq(banners.emplacement, input.emplacement));
      return db.select().from(banners).where(conds.length > 1 ? sql`${conds[0]} AND ${conds[1]}` : conds[0]).orderBy(banners.ordre);
    }),

  // Scan d'un QR code: incrémente le compteur et renvoie la cible.
  scan: publicProcedure.input(z.object({ code: z.string() })).mutation(async ({ input }) => {
    const [qr] = await db.select().from(qrCodes).where(eq(qrCodes.code, input.code)).limit(1);
    if (!qr || !qr.active) return null;
    await db.update(qrCodes).set({ scans: (qr.scans ?? 0) + 1 }).where(eq(qrCodes.id, qr.id));
    return { targetUrl: qr.targetUrl, type: qr.type };
  }),

  createQr: adminProcedure
    .input(
      z.object({
        type: z.enum(["depot_vehicule", "pro", "garage", "location", "pieces", "campagne"]),
        code: z.string().min(3),
        targetUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [qr] = await db.insert(qrCodes).values({ ...input, ownerId: ctx.user.uid }).returning();
      return qr;
    }),

  qrList: adminProcedure.query(async () => {
    return db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt));
  }),

  createReferral: adminProcedure
    .input(z.object({ code: z.string().min(3), reward: z.string().optional(), maxUses: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(referralCodes).values({ ...input, ownerId: ctx.user.uid }).returning();
      return r;
    }),

  createBanner: adminProcedure
    .input(z.object({ titre: z.string().optional(), imageUrl: z.string().optional(), targetUrl: z.string().optional(), emplacement: z.string().optional(), ordre: z.number().default(0) }))
    .mutation(async ({ input }) => {
      const [b] = await db.insert(banners).values(input).returning();
      return b;
    }),
});
