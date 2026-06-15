import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { favoris, annonces, annoncePhotos } from "../schema.js";

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
    const rows = await db
      .select({ annonce: annonces })
      .from(favoris)
      .innerJoin(annonces, eq(favoris.annonceId, annonces.id))
      .where(eq(favoris.userId, ctx.user.uid))
      .orderBy(desc(favoris.createdAt));
    // photo principale par annonce (même logique que annonces.list)
    const ids = rows.map((r) => r.annonce.id);
    const photos = ids.length
      ? await db
          .select()
          .from(annoncePhotos)
          .where(sql`${annoncePhotos.annonceId} in (${sql.join(ids, sql`, `)})`)
          .orderBy(annoncePhotos.ordre)
      : [];
    const photoMap = new Map<number, string>();
    for (const p of photos) {
      if (p.annonceId != null && !photoMap.has(p.annonceId)) photoMap.set(p.annonceId, p.url);
    }
    return rows.map((r) => ({
      annonce: { ...r.annonce, photoPrincipale: photoMap.get(r.annonce.id) ?? null },
    }));
  }),
});
