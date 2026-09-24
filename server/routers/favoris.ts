import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { favoris, annonces, annoncePhotos } from "../schema.js";

/** Les deux commandes utilisent la même transaction ; set est rejouable. */
async function modifierFavori(userId: number, annonceId: number, desired?: boolean) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`favoris:${userId}:${annonceId}`}, 0))`);
    const existing = await tx.select({ id: favoris.id }).from(favoris).where(and(eq(favoris.userId, userId), eq(favoris.annonceId, annonceId)));
    const favori = desired ?? existing.length === 0;
    if (favori && !existing.length) {
      const [annonce] = await tx.select({ id: annonces.id }).from(annonces).where(and(eq(annonces.id, annonceId), eq(annonces.status, "publiee"))).limit(1);
      if (!annonce) throw new TRPCError({ code: "NOT_FOUND", message: "Cette annonce n'est plus disponible." });
      await tx.insert(favoris).values({ userId, annonceId });
    } else if (!favori && existing.length) {
      await tx.delete(favoris).where(and(eq(favoris.userId, userId), eq(favoris.annonceId, annonceId)));
    }
    return { favori };
  });
}

export const favorisRouter = router({
  toggle: protectedProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(({ ctx, input }) => modifierFavori(ctx.user.uid, input.annonceId)),

  set: protectedProcedure
    .input(z.object({ annonceId: z.number().int().positive(), favori: z.boolean() }))
    .mutation(({ ctx, input }) => modifierFavori(ctx.user.uid, input.annonceId, input.favori)),

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
