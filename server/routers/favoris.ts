import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { favoris, annonces } from "../schema.js";

export const favorisRouter = router({
  toggle: protectedProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(favoris)
        .where(and(eq(favoris.userId, ctx.user.uid), eq(favoris.annonceId, input.annonceId)))
        .limit(1);
      if (existing.length) {
        await db
          .delete(favoris)
          .where(and(eq(favoris.userId, ctx.user.uid), eq(favoris.annonceId, input.annonceId)));
        return { favori: false };
      }
      await db.insert(favoris).values({ userId: ctx.user.uid, annonceId: input.annonceId });
      return { favori: true };
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({ annonce: annonces })
      .from(favoris)
      .innerJoin(annonces, eq(favoris.annonceId, annonces.id))
      .where(eq(favoris.userId, ctx.user.uid))
      .orderBy(desc(favoris.createdAt));
  }),
});
