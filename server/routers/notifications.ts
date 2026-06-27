import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { notifications, savedSearches } from "../schema.js";

// Notifications utilisateur (transverse, base unique). Alimentées par les alertes
// de recherche sauvegardée, réservations, messages, validations, etc.
export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.uid))
        .orderBy(desc(notifications.createdAt))
        .limit(input?.limit ?? 30);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [r] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.uid), eq(notifications.read, false)));
    return r?.count ?? 0;
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.uid)));
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, ctx.user.uid), eq(notifications.read, false)));
    return { ok: true };
  }),
});

const filtersSchema = z.object({
  q: z.string().optional(),
  marque: z.string().optional(),
  modele: z.string().optional(),
  categorie: z.string().optional(),
  famille: z.enum(["auto", "moto"]).optional(),
  vendeurType: z.string().optional(),
  prixMax: z.number().optional(),
  ville: z.string().optional(),
});

// Recherches sauvegardées + alertes (Partie 6). L'utilisateur enregistre un
// filtre ; les nouvelles annonces correspondantes créent une notification.
export const searchesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, ctx.user.uid))
      .orderBy(desc(savedSearches.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1).max(128),
        univers: z.string().default("vente"),
        filters: filtersSchema,
        alertEnabled: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(savedSearches)
        .values({
          userId: ctx.user.uid,
          label: input.label,
          univers: input.univers,
          filters: input.filters,
          alertEnabled: input.alertEnabled,
        })
        .returning();
      return created;
    }),

  setAlert: protectedProcedure
    .input(z.object({ id: z.number(), alertEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(savedSearches)
        .set({ alertEnabled: input.alertEnabled })
        .where(and(eq(savedSearches.id, input.id), eq(savedSearches.userId, ctx.user.uid)));
      return { ok: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(savedSearches)
        .where(and(eq(savedSearches.id, input.id), eq(savedSearches.userId, ctx.user.uid)));
      return { ok: true };
    }),
});
