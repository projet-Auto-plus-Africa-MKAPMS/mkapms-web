import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { appFeedback } from "../schema.js";

/**
 * Notation par les comptes : l'application, un service, ou un client concerné.
 * Distinct de `reviews` (avis vendeur/garage lié à une réservation).
 */
export const appFeedbackRouter = router({
  // Mes notations envoyées.
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(appFeedback)
      .where(eq(appFeedback.userId, ctx.user.uid))
      .orderBy(desc(appFeedback.createdAt));
  }),

  // Envoyer une note (1 à 5) sur l'app / un service / un client.
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["application", "service", "client"]).default("application"),
        targetRef: z.string().max(160).optional(),
        targetLabel: z.string().max(200).optional(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(appFeedback)
        .values({
          userId: ctx.user.uid,
          targetType: input.targetType,
          targetRef: input.targetRef,
          targetLabel: input.targetLabel,
          rating: input.rating,
          comment: input.comment,
        })
        .returning();
      return row;
    }),

  // Vue équipe : liste + moyennes par type.
  list: adminProcedure
    .input(
      z
        .object({ targetType: z.enum(["application", "service", "client"]).optional(), limit: z.number().min(1).max(200).default(100) })
        .optional(),
    )
    .query(async ({ input }) => {
      const where = input?.targetType ? eq(appFeedback.targetType, input.targetType) : undefined;
      return db
        .select()
        .from(appFeedback)
        .where(where)
        .orderBy(desc(appFeedback.createdAt))
        .limit(input?.limit ?? 100);
    }),

  stats: adminProcedure.query(async () => {
    const rows = await db
      .select({
        targetType: appFeedback.targetType,
        count: sql<number>`count(*)::int`,
        avg: sql<number>`coalesce(round(avg(${appFeedback.rating})::numeric, 2), 0)`,
      })
      .from(appFeedback)
      .groupBy(appFeedback.targetType);
    return rows;
  }),
});
