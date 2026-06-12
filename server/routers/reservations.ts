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

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, ctx.user.uid))
      .orderBy(desc(bookings.createdAt));
  }),
});
