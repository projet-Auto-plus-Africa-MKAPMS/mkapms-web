import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { bookings, payments, annonces } from "../schema.js";
import { ACOMPTE_PALIERS } from "@shared/plans.js";
import { getStripe } from "../lib/stripe.js";
import { env } from "../env.js";

// Réservation avec acompte (§4.5) : bloque le véhicule 24h.
export const reservationsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        annonceId: z.number(),
        acompte: z.number().refine((v) => ACOMPTE_PALIERS.includes(v as any), {
          message: "Acompte invalide (250, 500, 1000 ou 1500 €)",
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.annonceId)).limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND" });

      const now = new Date();
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const [booking] = await db
        .insert(bookings)
        .values({
          vehicleId: input.annonceId,
          userId: ctx.user.uid,
          type: "purchase_visit",
          startDate: now,
          endDate: end,
          status: "pending",
          cautionAmount: String(input.acompte),
          cautionCurrency: "EUR",
          cautionStatus: "pending",
        })
        .returning();

      const [pay] = await db
        .insert(payments)
        .values({
          userId: ctx.user.uid,
          type: "society_acompte",
          bookingId: booking.id,
          vehicleId: input.annonceId,
          amount: String(input.acompte),
          currency: "EUR",
          status: "pending",
        })
        .returning();

      const stripe = getStripe();
      if (!stripe) {
        return { bookingId: booking.id, url: `/paiement/simulation?payment=${pay.id}`, configured: false };
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: String(ctx.user.uid),
        metadata: {
          user_id: String(ctx.user.uid),
          payment_id: String(pay.id),
          booking_id: String(booking.id),
          payment_kind: "reservation_acompte",
        },
        payment_intent_data: {
          metadata: {
            user_id: String(ctx.user.uid),
            payment_id: String(pay.id),
            booking_id: String(booking.id),
            payment_kind: "reservation_acompte",
          },
        },
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `Acompte réservation — ${a.titre}` },
              unit_amount: Math.round(input.acompte * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${env.PUBLIC_URL}/vehicule/${input.annonceId}?reserve=1`,
        cancel_url: `${env.PUBLIC_URL}/vehicule/${input.annonceId}?canceled=1`,
      });
      await db
        .update(bookings)
        .set({ cautionStripeSessionId: session.id })
        .where(eq(bookings.id, booking.id));
      await db.update(payments).set({ stripeSessionId: session.id }).where(eq(payments.id, pay.id));
      return { bookingId: booking.id, url: session.url, configured: true };
    }),

  // Achat comptant (§ bouton « Acheter ») : paiement du prix total du véhicule.
  buyNow: protectedProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.annonceId)).limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND" });

      const montant = Number(a.prix);
      if (!Number.isFinite(montant) || montant <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Prix indisponible pour cette annonce." });
      }

      const [pay] = await db
        .insert(payments)
        .values({
          userId: ctx.user.uid,
          type: "vehicle_purchase",
          vehicleId: input.annonceId,
          amount: String(montant),
          currency: a.devise || "EUR",
          status: "pending",
        })
        .returning();

      const stripe = getStripe();
      if (!stripe) {
        return { paymentId: pay.id, url: `/paiement/simulation?payment=${pay.id}`, configured: false };
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: String(ctx.user.uid),
        metadata: {
          user_id: String(ctx.user.uid),
          payment_id: String(pay.id),
          payment_kind: "vehicle_purchase",
        },
        payment_intent_data: {
          metadata: {
            user_id: String(ctx.user.uid),
            payment_id: String(pay.id),
            payment_kind: "vehicle_purchase",
          },
        },
        line_items: [
          {
            price_data: {
              currency: (a.devise || "EUR").toLowerCase(),
              product_data: { name: `Achat véhicule — ${a.titre}` },
              unit_amount: Math.round(montant * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${env.PUBLIC_URL}/vehicule/${input.annonceId}?achat=1`,
        cancel_url: `${env.PUBLIC_URL}/vehicule/${input.annonceId}?canceled=1`,
      });
      await db.update(payments).set({ stripeSessionId: session.id }).where(eq(payments.id, pay.id));
      return { paymentId: pay.id, url: session.url, configured: true };
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, ctx.user.uid))
      .orderBy(desc(bookings.createdAt));
  }),

  // Fiche détaillée d'une réservation : véhicule réservé, montants, statut du
  // paiement (acompte) et étapes. Réservée au titulaire de la réservation.
  detail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.id))
        .limit(1);
      if (!booking || booking.userId !== ctx.user.uid) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const [annonce] = await db
        .select()
        .from(annonces)
        .where(eq(annonces.id, booking.vehicleId))
        .limit(1);
      const pays = await db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, booking.id))
        .orderBy(desc(payments.createdAt));
      return {
        booking,
        annonce: annonce ?? null,
        payments: pays,
      };
    }),
});
