import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { importRequests, importVehicles, importDocuments, customsSteps, warehouses } from "../schema.js";

// Univers Import Africa+ (Plan Partie 2 §10 / Partie 3 §13).
export const importafricaRouter = router({
  warehouses: publicProcedure.query(async () => {
    return db.select().from(warehouses).where(eq(warehouses.active, true)).orderBy(desc(warehouses.createdAt));
  }),

  createRequest: protectedProcedure
    .input(
      z.object({
        annonceId: z.number().optional(),
        vehiculeId: z.number().optional(),
        transportOption: z.enum(["transporteur_personnel", "transport_mkapms"]).optional(),
        paysDestination: z.string().optional(),
        warehouseId: z.number().optional(),
        vehicule: z.object({ marque: z.string().optional(), modele: z.string().optional(), vin: z.string().optional(), annee: z.number().optional() }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(importRequests).values({
        clientId: ctx.user.uid,
        annonceId: input.annonceId,
        vehiculeId: input.vehiculeId,
        transportOption: input.transportOption,
        paysDestination: input.paysDestination,
        warehouseId: input.warehouseId,
        status: "reserve",
      }).returning();
      if (input.vehicule) {
        await db.insert(importVehicles).values({ requestId: r.id, ...input.vehicule });
      }
      await db.insert(customsSteps).values({ requestId: r.id, status: "reserve", note: "Demande créée" });
      return r;
    }),

  myRequests: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(importRequests).where(eq(importRequests.clientId, ctx.user.uid)).orderBy(desc(importRequests.createdAt));
  }),

  request: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [r] = await db.select().from(importRequests).where(eq(importRequests.id, input.id)).limit(1);
    if (!r) return null;
    const steps = await db.select().from(customsSteps).where(eq(customsSteps.requestId, r.id)).orderBy(desc(customsSteps.createdAt));
    const docs = await db.select().from(importDocuments).where(eq(importDocuments.requestId, r.id));
    return { ...r, steps, documents: docs };
  }),

  // Suivi (statuts: acheté, préparé, chargé, en transit, port, douane, entrepôt, livré).
  advance: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["reserve", "achete", "prepare", "charge", "en_transit", "port", "douane", "entrepot", "livre", "annule"]),
        note: z.string().optional(),
        lieu: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await db.update(importRequests).set({ status: input.status, updatedAt: new Date() }).where(eq(importRequests.id, input.requestId));
      const [s] = await db.insert(customsSteps).values({ requestId: input.requestId, status: input.status, note: input.note, lieu: input.lieu }).returning();
      return s;
    }),
});
