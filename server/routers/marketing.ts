import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { qrCodes, referralCodes, banners } from "../schema.js";

// Marketing / QR codes / parrainage / bannières (Plan Partie 2 §18).
export const marketingRouter = router({
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
