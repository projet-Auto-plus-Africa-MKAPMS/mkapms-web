import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { bookings, payments, annonces, serviceTracking } from "../schema.js";
import { notifications } from "../modules/core.js";
import { ACOMPTE_PALIERS } from "@shared/plans.js";
import { getStripe } from "../lib/stripe.js";
import { safeCheckoutSession } from "../lib/payment-errors.js";
import { env } from "../env.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";

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
      const session = await safeCheckoutSession(
        stripe,
        {
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
        },
        {
          operation: "checkout:reservation_acompte",
          userId: ctx.user.uid,
          onFailure: async () => {
            await db.update(payments).set({ status: "failed" }).where(eq(payments.id, pay.id));
          },
        },
      );
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
      const session = await safeCheckoutSession(
        stripe,
        {
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
        },
        {
          operation: "checkout:vehicle_purchase",
          userId: ctx.user.uid,
          onFailure: async () => {
            await db.update(payments).set({ status: "failed" }).where(eq(payments.id, pay.id));
          },
        },
      );
      await db.update(payments).set({ stripeSessionId: session.id }).where(eq(payments.id, pay.id));
      return { paymentId: pay.id, url: session.url, configured: true };
    }),

  /**
   * Demande de réservation d'un véhicule de location (pro, utilitaire, camion,
   * minibus, VTC/Taxi, particulier).
   *
   * Ces catalogues ne sont pas encore adossés à une annonce en base : la
   * demande est donc enregistrée comme un suivi de service réel et notifiée,
   * puis reprise par l'équipe. Rien n'est présenté comme « payé » ou
   * « confirmé » tant qu'un loueur n'a pas répondu.
   */
  requestLocation: protectedProcedure
    .input(
      z.object({
        univers: z.string().min(1).max(32),
        vehiculeRef: z.string().min(1).max(64),
        vehiculeTitre: z.string().min(1).max(255),
        dateDebut: z.string().max(32).optional(),
        dateFin: z.string().max(32).optional(),
        montantEstime: z.number().nonnegative().optional(),
        devise: z.string().max(4).default("EUR"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detail = [
        input.dateDebut && input.dateFin ? `Du ${input.dateDebut} au ${input.dateFin}` : null,
        input.montantEstime ? `Estimation ${input.montantEstime} ${input.devise}` : null,
        `Référence véhicule ${input.vehiculeRef}`,
      ]
        .filter(Boolean)
        .join(" · ");

      const [created] = await db
        .insert(serviceTracking)
        .values({
          userId: ctx.user.uid,
          serviceType: "location",
          serviceId: 0,
          titre: `Réservation ${input.vehiculeTitre}`,
          status: "nouveau",
          statusLabel: "Demande envoyée — en attente du loueur",
          detail,
        })
        .returning();

      await db
        .update(serviceTracking)
        .set({ reference: `LOC-${created.id}` })
        .where(eq(serviceTracking.id, created.id));

      await db.insert(notifications).values({
        userId: ctx.user.uid,
        type: "reservation",
        title: `Demande de réservation #LOC-${created.id}`,
        body: `Votre demande pour "${input.vehiculeTitre}" a bien été envoyée. Le loueur vous répond avec la disponibilité et le montant définitif avant tout paiement.`,
        url: "/compte",
      });

      return { id: created.id, reference: `LOC-${created.id}` };
    }),

  /**
   * Règlement de l'acompte d'une réservation DÉJÀ ouverte.
   *
   * Le bouton « Régler l'acompte » d'une réservation en attente ne doit pas
   * recréer une réservation : il reprend celle-ci et ouvre l'encaissement de
   * son montant. Un acompte déjà payé est refusé plutôt que débité deux fois.
   */
  payCaution: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);
      if (!booking || booking.userId !== ctx.user.uid) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable" });
      }
      if (booking.cautionStatus === "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Acompte déjà réglé pour cette réservation." });
      }
      const montant = Number(booking.cautionAmount);
      if (!Number.isFinite(montant) || montant <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aucun montant d'acompte n'est fixé sur cette réservation.",
        });
      }
      const [a] = await db
        .select()
        .from(annonces)
        .where(eq(annonces.id, booking.vehicleId))
        .limit(1);

      const res = await createPaymentCheckout({
        userId: ctx.user.uid,
        kind: "reservation_acompte",
        amount: montant,
        currency: booking.cautionCurrency || "EUR",
        label: `Acompte réservation — ${a?.titre ?? `véhicule #${booking.vehicleId}`}`,
        metadata: { booking_id: booking.id },
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        successPath: `/vehicule/${booking.vehicleId}?reserve=1`,
        cancelPath: `/compte?tab=reservations&canceled=1`,
      });
      return res;
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
