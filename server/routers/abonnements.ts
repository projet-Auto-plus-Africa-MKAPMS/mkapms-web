import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { subscriptions, payments, kycProfiles, users } from "../schema.js";
import { ALL_PLANS, getPlan } from "@shared/plans.js";
import { getStripe } from "../lib/stripe.js";
import { safeCheckoutSession } from "../lib/payment-errors.js";
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
      if (plan.priceEur == null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Offre sur demande : contactez la Direction" });
      }
      // Règle Partie A §2 : SEUL blocage conservé = KYC manquant pour un compte pro.
      // Aucun autre blocage (les dépassements de quota sont facturés, jamais bloqués).
      if (plan.audience === "pro" || plan.audience === "franchise") {
        const [kyc] = await db
          .select()
          .from(kycProfiles)
          .where(eq(kycProfiles.userId, ctx.user.uid))
          .orderBy(desc(kycProfiles.createdAt))
          .limit(1);
        if (!kyc || kyc.status !== "valide") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Documents non validés : finalisez votre vérification (KYC) avant de souscrire un abonnement professionnel.",
          });
        }
      }
      const price = plan.priceEur;
      const stripe = getStripe();

      // Enregistre un paiement "pending" (référence locale)
      const [pay] = await db
        .insert(payments)
        .values({
          userId: ctx.user.uid,
          type: plan.audience === "particulier" ? "vehicle_boost" : "pro_subscription",
          amount: String(price),
          currency: "EUR",
          status: "pending",
          metadata: { planCode: plan.code, annonceId: input.annonceId } as any,
        })
        .returning();

      if (!stripe) {
        // Mode dégradé (Stripe non configuré) : on renvoie une URL de simulation
        return { url: `/paiement/simulation?payment=${pay.id}`, configured: false };
      }

      const session = await safeCheckoutSession(
        stripe,
        {
        mode: plan.recurring ? "subscription" : "payment",
        client_reference_id: String(ctx.user.uid),
        metadata: {
          user_id: String(ctx.user.uid),
          plan_code: plan.code,
          payment_id: String(pay.id),
          annonce_id: input.annonceId ? String(input.annonceId) : "",
        },
        // Pour un boost à l'unité (mode payment), propage les métadonnées au
        // PaymentIntent afin de rattacher un éventuel échec de paiement.
        ...(plan.recurring
          ? {}
          : {
              payment_intent_data: {
                metadata: {
                  user_id: String(ctx.user.uid),
                  plan_code: plan.code,
                  payment_id: String(pay.id),
                },
              },
            }),
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `MKA.P-MS — ${plan.label}` },
              unit_amount: Math.round(price * 100),
              ...(plan.recurring ? { recurring: { interval: "month" } } : {}),
            },
            quantity: 1,
          },
        ],
        success_url: `${env.PUBLIC_URL}/compte/abonnements?success=1`,
        cancel_url: `${env.PUBLIC_URL}/abonnements?canceled=1`,
        },
        {
          operation: `checkout:abonnement:${plan.code}`,
          userId: ctx.user.uid,
          onFailure: async () => {
            await db.update(payments).set({ status: "failed" }).where(eq(payments.id, pay.id));
          },
        },
      );

      await db
        .update(payments)
        .set({ stripeSessionId: session.id })
        .where(eq(payments.id, pay.id));

      return { url: session.url, configured: true };
    }),

  // ─── Customer Portal Stripe ────────────────────────────────────
  // Ouvre le portail client Stripe où l'abonné gère seul son
  // abonnement (changement de plan, annulation, mise à jour carte,
  // téléchargement des factures). Retourne l'URL du portail.
  openPortal: protectedProcedure
    .input(z.object({ returnUrl: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe n'est pas encore configuré sur ce déploiement.",
        });
      }
      // L'identifiant client Stripe est stocké sur l'utilisateur (renseigné par
      // le webhook `checkout.session.completed`), pas sur la subscription.
      const [u] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, ctx.user.uid))
        .limit(1);
      const customerId = u?.stripeCustomerId ?? undefined;
      if (!customerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Aucun abonnement actif à gérer. Souscrivez d'abord une offre depuis le catalogue.",
        });
      }
      const returnUrl = input?.returnUrl || `${env.PUBLIC_URL}/compte/abonnements`;
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return { url: session.url };
    }),

  // ─── Back-office (superadmin/AdminAbonnements.tsx) ─────────────────────
  // Changer un statut ou un montant ici modifierait la base sans jamais
  // toucher le vrai abonnement Stripe — la gestion (annulation, changement
  // de plan) reste au client via openPortal, jamais imitée côté admin.
  adminList: adminProcedure
    .input(z.object({ status: z.enum(["pending", "active", "cancelled", "past_due", "expired"]).optional() }).default({}))
    .query(async ({ input }) => {
      const conds = input.status ? [eq(subscriptions.status, input.status)] : [];
      return db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          userName: users.name,
          userEmail: users.email,
          planCode: subscriptions.planCode,
          category: subscriptions.category,
          status: subscriptions.status,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          createdAt: subscriptions.createdAt,
          quotaAnnonces: subscriptions.quotaAnnonces,
          quotaPhotos: subscriptions.quotaPhotos,
          quotaVehicules: subscriptions.quotaVehicules,
          quotaEmployes: subscriptions.quotaEmployes,
        })
        .from(subscriptions)
        .leftJoin(users, eq(users.id, subscriptions.userId))
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(subscriptions.createdAt))
        .limit(200);
    }),

  adminStats: adminProcedure.query(async () => {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const [actifs] = await db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(eq(subscriptions.status, "active"));
    const [expires] = await db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(eq(subscriptions.status, "expired"));
    const [nouveaux] = await db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(gte(subscriptions.createdAt, debutMois));
    const mrrParDevise = await db
      .select({ currency: subscriptions.currency, total: sql<string>`coalesce(sum(${subscriptions.amount}), 0)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"))
      .groupBy(subscriptions.currency);
    return { actifs: actifs?.n ?? 0, expires: expires?.n ?? 0, nouveauxCeMois: nouveaux?.n ?? 0, mrrParDevise };
  }),

  // Historique de facturation réel d'un abonnement — jamais un montant recalculé.
  adminHistory: adminProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select({
          id: payments.id,
          amount: payments.amount,
          currency: payments.currency,
          status: payments.status,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.subscriptionId, input.subscriptionId))
        .orderBy(desc(payments.createdAt));
    }),
});
