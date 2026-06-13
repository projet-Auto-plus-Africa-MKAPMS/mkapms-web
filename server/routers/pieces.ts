import { z } from "zod";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, proProcedure } from "../trpc.js";
import { db } from "../db.js";
import { partsShops, partsCatalog, partsStock, partsOrders, partsOrderItems } from "../schema.js";

// Univers Pièces Auto — marketplace B2B/B2C (Plan Partie 2 §6).
export const piecesRouter = router({
  shops: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        country: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      }).default({}),
    )
    .query(async ({ input }) => {
      const conds = [eq(partsShops.active, true)];
      if (input.country) conds.push(eq(partsShops.countryCode, input.country));
      if (input.q) conds.push(ilike(partsShops.nom, `%${input.q}%`));
      const where = and(...conds);
      const items = await db.select().from(partsShops).where(where)
        .orderBy(desc(partsShops.createdAt)).limit(input.limit).offset(input.offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(partsShops).where(where);
      return { total: count, items };
    }),

  shop: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [s] = await db.select().from(partsShops).where(eq(partsShops.id, input.id)).limit(1);
    return s ?? null;
  }),

  catalog: publicProcedure
    .input(
      z.object({
        shopId: z.number().optional(),
        q: z.string().optional(),
        limit: z.number().min(1).max(100).default(40),
        offset: z.number().min(0).default(0),
      }).default({}),
    )
    .query(async ({ input }) => {
      const conds = [eq(partsCatalog.active, true)];
      if (input.shopId) conds.push(eq(partsCatalog.shopId, input.shopId));
      if (input.q) conds.push(ilike(partsCatalog.nom, `%${input.q}%`));
      const where = and(...conds);
      const items = await db.select().from(partsCatalog).where(where)
        .orderBy(desc(partsCatalog.createdAt)).limit(input.limit).offset(input.offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(partsCatalog).where(where);
      return { total: count, items };
    }),

  createShop: proProcedure
    .input(
      z.object({
        nom: z.string().min(2),
        type: z.enum(["magasin_pieces", "casse_auto", "grossiste", "distributeur", "centre_auto", "garage_vendeur"]).default("magasin_pieces"),
        description: z.string().optional(),
        ville: z.string().optional(),
        countryCode: z.string().optional(),
        telephone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(partsShops).values({ ...input, ownerId: ctx.user.uid }).returning();
      return s;
    }),

  addPart: proProcedure
    .input(
      z.object({
        shopId: z.number(),
        nom: z.string().min(2),
        prixHt: z.number().positive(),
        oemRef: z.string().optional(),
        categorie: z.string().optional(),
        condition: z.enum(["neuf", "occasion", "reconditionne", "echange_standard"]).default("neuf"),
        quantite: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const [p] = await db.insert(partsCatalog).values({
        shopId: input.shopId,
        nom: input.nom,
        prixHt: String(input.prixHt),
        oemRef: input.oemRef,
        categorie: input.categorie,
        condition: input.condition,
      }).returning();
      await db.insert(partsStock).values({ catalogId: p.id, quantite: input.quantite });
      return p;
    }),

  // Panier / commande simple.
  createOrder: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        items: z.array(z.object({ catalogId: z.number(), quantite: z.number().min(1) })).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [order] = await db.insert(partsOrders).values({
        shopId: input.shopId,
        buyerId: ctx.user.uid,
        status: "panier",
      }).returning();
      for (const it of input.items) {
        const [part] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, it.catalogId)).limit(1);
        await db.insert(partsOrderItems).values({
          orderId: order.id,
          catalogId: it.catalogId,
          quantite: it.quantite,
          prixUnitaireHt: part?.prixHt ?? "0",
        });
      }
      return order;
    }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(partsOrders).where(eq(partsOrders.buyerId, ctx.user.uid)).orderBy(desc(partsOrders.createdAt));
  }),
});
