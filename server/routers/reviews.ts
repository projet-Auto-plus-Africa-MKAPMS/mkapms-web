import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { reviews, users, notifications } from "../schema.js";

// Avis clients (Partie 6) — système unique relié aux comptes : un avis peut cibler
// un vendeur, un garage, un loueur, etc. L'agrégat (note + nombre) est recalculé
// sur le compte ciblé pour rester cohérent partout (fiches, listes, contact).
async function recomputeUserRating(targetUserId: number) {
  const [agg] = await db
    .select({
      avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.targetUserId, targetUserId), eq(reviews.hidden, false)));
  await db
    .update(users)
    .set({
      rating: String(Math.round(Number(agg?.avg ?? 0) * 100) / 100),
      reviewCount: Number(agg?.count ?? 0),
    })
    .where(eq(users.id, targetUserId));
}

export const reviewsRouter = router({
  // Avis visibles pour un vendeur / professionnel.
  listForUser: publicProcedure
    .input(z.object({ targetUserId: z.number(), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          authorName: users.name,
        })
        .from(reviews)
        .leftJoin(users, eq(users.id, reviews.authorId))
        .where(and(eq(reviews.targetUserId, input.targetUserId), eq(reviews.hidden, false)))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit);
      return rows;
    }),

  // Laisser un avis sur un vendeur / pro. Un avis par auteur et par cible.
  create: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
        refType: z.string().max(32).optional(),
        refId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.targetUserId === ctx.user.uid) {
        throw new Error("Vous ne pouvez pas vous auto-évaluer.");
      }
      const existing = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.authorId, ctx.user.uid), eq(reviews.targetUserId, input.targetUserId)))
        .limit(1);
      if (existing.length) {
        await db
          .update(reviews)
          .set({ rating: input.rating, note: input.rating, comment: input.comment ?? null })
          .where(eq(reviews.id, existing[0].id));
      } else {
        await db.insert(reviews).values({
          bookingId: input.refId ?? 0,
          userId: ctx.user.uid,
          authorId: ctx.user.uid,
          targetUserId: input.targetUserId,
          targetType: "vendeur",
          refType: input.refType,
          refId: input.refId,
          rating: input.rating,
          note: input.rating,
          comment: input.comment ?? null,
          hidden: false,
        });
        // Notifier la personne évaluée (système de notifications unique).
        await db.insert(notifications).values({
          userId: input.targetUserId,
          type: "review",
          title: "Vous avez reçu un nouvel avis",
          body: `Note : ${input.rating}/5${input.comment ? ` — « ${input.comment.slice(0, 80)} »` : ""}`,
          url: "/compte",
        });
      }
      await recomputeUserRating(input.targetUserId);
      return { ok: true };
    }),
});
