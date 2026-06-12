import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { subscriptions, payments } from "../schema.js";
import { ALL_PLANS, getPlan } from "@shared/plans.js";
import { getStripe } from "../lib/stripe.js";
import { env } from "../env.js";

export const abonnementsRouter = router({
  // Catalogue d'offres (page /abonnements)
  listPlans: publicProcedure.query(() => ALL_PLANS),

  // Mes abonnements
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.uid))
      .orderBy(desc(subscriptions.createdAt));
  }),

  // Crée une session Stripe Checkout pour un plan
  createCheckout: protectedProcedure
    .input(z.object({ planCode: z.string(), annonceId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const plan = getPlan(input.planCode);
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Plan inconnu" });
      const stripe = getStripe();

      // Enregistre un paiement "pending" (référence locale)
      const [pay] = await db
        .insert(payments)
        .values({
          userId: ctx.user.uid,
          type: plan.audience === "particulier" ? "vehicle_boost" : "pro_subscription",
          amount: String(plan.priceEur),
          currency: "EUR",
          status: "pending",
          metadata: { planCode: plan.code, annonceId: input.annonceId } as any,
        })
        .returning();

      if (!stripe) {
        // Mode dégradé (Stripe non configuré) : on renvoie une URL de simulation
        return { url: `/paiement/simulation?payment=${pay.id}`, configured: false };
      }

      const session = await stripe.checkout.sessions.create({
        mode: plan.recurring ? "subscription" : "payment",
        client_reference_id: String(ctx.user.uid),
        metadata: {
          user_id: String(ctx.user.uid),
          plan_code: plan.code,
          payment_id: String(pay.id),
          annonce_id: input.annonceId ? String(input.annonceId) : "",
        },
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `MKA.P-MS — ${plan.label}` },
              unit_amount: Math.round(plan.priceEur * 100),
              ...(plan.recurring ? { recurring: { interval: "month" } } : {}),
            },
            quantity: 1,
          },
        ],
        success_url: `${env.PUBLIC_URL}/compte/abonnements?success=1`,
        cancel_url: `${env.PUBLIC_URL}/abonnements?canceled=1`,
      });

      await db
        .update(payments)
        .set({ stripeSessionId: session.id })
        .where(eq(payments.id, pay.id));

      return { url: session.url, configured: true };
    }),
});
