import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { breakdownProviders, breakdownRequests, breakdownQuotes, breakdownMissions } from "../schema.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";

// Univers Dépannage / Assistance (Plan Partie 2 §8).
export const depannageRouter = router({
  providers: publicProcedure
    .input(z.object({ country: z.string().optional(), limit: z.number().min(1).max(100).default(30) }).default({}))
    .query(async ({ input }) => {
      const conds = [eq(breakdownProviders.active, true)];
      if (input.country) conds.push(eq(breakdownProviders.countryCode, input.country));
      return db.select().from(breakdownProviders).where(and(...conds)).orderBy(desc(breakdownProviders.rating)).limit(input.limit);
    }),

  registerProvider: protectedProcedure
    .input(
      z.object({
        nom: z.string().min(2),
        zone: z.string().optional(),
        countryCode: z.string().optional(),
        tarifBase: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [p] = await db.insert(breakdownProviders).values({
        userId: ctx.user.uid,
        nom: input.nom,
        zone: input.zone,
        countryCode: input.countryCode,
        tarifBase: input.tarifBase != null ? String(input.tarifBase) : undefined,
      }).returning();
      return p;
    }),

  createRequest: protectedProcedure
    .input(
      z.object({
        typePanne: z.string().optional(),
        description: z.string().optional(),
        vehicule: z.string().optional(),
        adresse: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        urgent: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(breakdownRequests).values({
        clientId: ctx.user.uid,
        typePanne: input.typePanne,
        description: input.description,
        vehicule: input.vehicule,
        adresse: input.adresse,
        lat: input.lat != null ? String(input.lat) : undefined,
        lng: input.lng != null ? String(input.lng) : undefined,
        urgent: input.urgent,
        status: "demande",
      }).returning();
      return r;
    }),

  myRequests: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(breakdownRequests).where(eq(breakdownRequests.clientId, ctx.user.uid)).orderBy(desc(breakdownRequests.createdAt));
  }),

  sendQuote: protectedProcedure
    .input(z.object({ requestId: z.number(), providerId: z.number(), montant: z.number().positive(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [q] = await db.insert(breakdownQuotes).values({
        requestId: input.requestId,
        providerId: input.providerId,
        montant: String(input.montant),
        description: input.description,
      }).returning();
      await db.update(breakdownRequests).set({ status: "devis_envoye", updatedAt: new Date() }).where(eq(breakdownRequests.id, input.requestId));
      return q;
    }),

  quotes: publicProcedure.input(z.object({ requestId: z.number() })).query(async ({ input }) => {
    return db.select().from(breakdownQuotes).where(eq(breakdownQuotes.requestId, input.requestId)).orderBy(desc(breakdownQuotes.createdAt));
  }),

  startMission: protectedProcedure
    .input(z.object({ requestId: z.number(), providerId: z.number() }))
    .mutation(async ({ input }) => {
      const [m] = await db.insert(breakdownMissions).values({
        requestId: input.requestId,
        providerId: input.providerId,
        status: "en_intervention",
        startedAt: new Date(),
      }).returning();
      await db.update(breakdownRequests).set({ status: "en_intervention", updatedAt: new Date() }).where(eq(breakdownRequests.id, input.requestId));
      return m;
    }),

  // Paiement d'un devis dépannage accepté par le client.
  // Le client accepte un devis (quoteId) → Stripe Checkout → mission
  // activée automatiquement au webhook payment_succeeded.
  payQuote: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [q] = await db.select().from(breakdownQuotes).where(eq(breakdownQuotes.id, input.quoteId)).limit(1);
      if (!q) throw new TRPCError({ code: "NOT_FOUND", message: "Devis introuvable" });
      const montant = Number(q.montant);
      if (!Number.isFinite(montant) || montant <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Montant du devis invalide" });
      }
      const res = await createPaymentCheckout({
        userId: ctx.user.uid,
        kind: "depannage_mission",
        amount: montant,
        currency: "EUR",
        label: `Dépannage — Devis #${q.id}`,
        metadata: { quoteId: q.id, requestId: q.requestId, providerId: q.providerId },
        successPath: `/depannage/mission?request=${q.requestId}&paid=1`,
        cancelPath: `/depannage/mission?request=${q.requestId}&canceled=1`,
      });
      return res;
    }),
});
