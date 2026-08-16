import type { Request, Response } from "express";
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "./db.js";
import {
  payments,
  subscriptions,
  bookings,
  annonces,
  users,
  partsOrders,
  partsOrderTracking,
} from "./schema.js";
import { notifications } from "./modules/core.js";
import { getStripe } from "./lib/stripe.js";
import { getPlan } from "@shared/plans.js";
import { awardPoints } from "./routers/operations.js";
import { logActivity } from "./smart-engine/services/activity-log.js";
import { env } from "./env.js";
import { emitSafe } from "./event-bus/service.js";

/**
 * Supervision d'un paiement (§2) — fire-and-forget, jamais bloquant pour le
 * webhook : notifie le client en base, et enregistre l'événement au Journal du
 * Système Intelligent (visible dans le Control Center PDG). La validation
 * financière reste celle du webhook Stripe signé.
 */
async function superviserPaiement(opts: {
  userId: number | null;
  title: string;
  body: string;
  url?: string;
  action: string;
  targetType?: string;
  targetId?: number | null;
  data?: Record<string, unknown>;
  result?: string;
}) {
  try {
    if (opts.userId) {
      await db.insert(notifications).values({
        userId: opts.userId,
        type: "paiement",
        title: opts.title.slice(0, 160),
        body: opts.body,
        url: opts.url ?? "/compte",
      });
    }
  } catch (err) {
    console.error("[payment] notification client échouée:", (err as Error).message);
  }
  try {
    await logActivity({
      action: opts.action,
      userId: opts.userId ?? undefined,
      targetType: opts.targetType ?? "payment",
      targetId: opts.targetId ?? undefined,
      data: opts.data,
      result: opts.result ?? "success",
    });
  } catch (err) {
    console.error("[payment] journal Smart Engine échoué:", (err as Error).message);
  }
}

// Webhook Stripe — monté AVANT express.json() avec express.raw().
export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(200).json({ received: true, configured: false });
  }

  let event: Stripe.Event;
  try {
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const m = session.metadata || {};
        const paymentId = m.payment_id ? Number(m.payment_id) : null;
        const userId = m.user_id ? Number(m.user_id) : null;
        const planCode = m.plan_code;

        if (paymentId) {
          await db
            .update(payments)
            .set({
              status: "paid",
              stripePaymentIntentId: (session.payment_intent as string) || null,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId));
          // Partie 18 — fidélité : 1 point MKA par euro payé.
          const amount = session.amount_total ? Math.round(session.amount_total / 100) : 0;
          if (userId && amount > 0) await awardPoints(userId, amount, "paiement", "payment", paymentId);
          // Supervision (§2) : notifier le client + journal Smart Engine.
          const montantTxt =
            session.amount_total != null
              ? `${(session.amount_total / 100).toLocaleString("fr-FR")} ${(session.currency ?? "eur").toUpperCase()}`
              : "";
          await superviserPaiement({
            userId,
            title: "Paiement confirmé",
            body: `Votre paiement${montantTxt ? ` de ${montantTxt}` : ""} a bien été reçu. Merci.`,
            url: "/compte",
            action: "payment_succeeded",
            targetId: paymentId,
            data: { kind: m.payment_kind ?? null, amount, currency: session.currency ?? null },
          });
          await emitSafe({
            source: "payment",
            type: "paiement.reussi",
            payload: { reference: String(paymentId), montant: amount, devise: session.currency ?? "eur" },
          });
        }
        if (userId && session.customer) {
          await db
            .update(users)
            .set({ stripeCustomerId: session.customer as string })
            .where(eq(users.id, userId));
        }
        // Abonnement
        if (session.mode === "subscription" && userId && planCode) {
          const plan = getPlan(planCode);
          await db.insert(subscriptions).values({
            userId,
            planCode: planCode as any,
            category:
              plan?.audience === "franchise"
                ? "franchise_subscription"
                : plan?.audience === "pro"
                  ? "pro_subscription"
                  : "particulier_boost",
            status: "active",
            stripeSessionId: session.id,
            stripeSubscriptionId: (session.subscription as string) || null,
            amount: plan ? String(plan.priceEur) : null,
            currency: "EUR",
            quotaAnnonces: plan?.quotas.maxAnnonces ?? null,
            quotaPhotos: plan?.quotas.maxPhotos ?? null,
          });
          if (plan?.audience === "pro" || plan?.audience === "franchise") {
            await db.update(users).set({ accountType: "professionnel" }).where(eq(users.id, userId));
          }
          await superviserPaiement({
            userId,
            title: "Abonnement activé",
            body: `Votre abonnement ${plan?.label ?? planCode} est maintenant actif.`,
            url: "/abonnements",
            action: "subscription_activated",
            targetType: "subscription",
            data: { planCode },
          });
        }
        // Acompte réservation
        if (m.payment_kind === "reservation_acompte" && m.booking_id) {
          await db
            .update(bookings)
            .set({ status: "accepted", cautionStatus: "paid", updatedAt: new Date() })
            .where(eq(bookings.id, Number(m.booking_id)));
          await superviserPaiement({
            userId,
            title: "Réservation confirmée",
            body: "Votre acompte a été reçu : le véhicule est bloqué pour vous.",
            url: "/compte",
            action: "reservation_confirmed",
            targetType: "booking",
            targetId: Number(m.booking_id),
          });
        }
        // Commande de pièces : le paiement fait réellement avancer la commande.
        // Sans cela, une commande payée restait au statut « panier ».
        if (m.payment_kind === "pieces_order" && m.order_id) {
          const orderId = Number(m.order_id);
          const [order] = await db
            .update(partsOrders)
            .set({ status: "confirme", updatedAt: new Date() })
            .where(and(eq(partsOrders.id, orderId), eq(partsOrders.status, "panier")))
            .returning();
          if (order) {
            await db.insert(partsOrderTracking).values({
              orderId,
              status: "confirme",
              label: "Paiement reçu — commande confirmée",
              detail: `Référence ${order.reference ?? orderId}`,
            });
          }
          await superviserPaiement({
            userId,
            title: "Commande de pièces confirmée",
            body: "Votre paiement a été reçu : la boutique prépare votre commande.",
            url: `/pieces/commande/${orderId}`,
            action: "pieces_order_paid",
            targetType: "parts_order",
            targetId: orderId,
          });
        }
        // Boost annonce
        if (session.mode === "payment" && m.annonce_id && planCode) {
          const plan = getPlan(planCode);
          const days = plan?.durationDays ?? 30;
          await db
            .update(annonces)
            .set({
              boosted: true,
              boostedUntil: new Date(Date.now() + days * 86400000),
              updatedAt: new Date(),
            })
            .where(eq(annonces.id, Number(m.annonce_id)));
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          const [refunded] = await db
            .update(payments)
            .set({ status: "refunded", updatedAt: new Date() })
            .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string))
            .returning();
          if (refunded) {
            await superviserPaiement({
              userId: refunded.userId ?? null,
              title: "Remboursement effectué",
              body: "Votre paiement a été remboursé.",
              url: "/compte",
              action: "payment_refunded",
              targetId: refunded.id,
              result: "success",
            });
          }
        }
        break;
      }
      case "checkout.session.expired": {
        // Paiement abandonné/expiré → on repasse le payment en 'cancelled'
        // (jamais 'paid' sans confirmation signée) + journal Smart Engine.
        const session = event.data.object as Stripe.Checkout.Session;
        const m = session.metadata || {};
        const paymentId = m.payment_id ? Number(m.payment_id) : null;
        const userId = m.user_id ? Number(m.user_id) : null;
        if (paymentId) {
          await db
            .update(payments)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(payments.id, paymentId));
          await superviserPaiement({
            userId,
            title: "Paiement non finalisé",
            body: "Votre paiement n'a pas été finalisé. Vous pouvez réessayer quand vous le souhaitez.",
            url: "/compte",
            action: "payment_expired",
            targetId: paymentId,
            result: "failure",
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        // Paiement refusé (carte, fonds…) → le payment ne doit plus rester
        // 'pending' : on le passe en 'failed' et on informe le client.
        const pi = event.data.object as Stripe.PaymentIntent;
        const m = pi.metadata || {};
        const paymentId = m.payment_id ? Number(m.payment_id) : null;
        const userId = m.user_id ? Number(m.user_id) : null;
        let updatedUserId: number | null = userId;
        if (paymentId) {
          const [failed] = await db
            .update(payments)
            .set({ status: "failed", stripePaymentIntentId: pi.id, updatedAt: new Date() })
            .where(eq(payments.id, paymentId))
            .returning();
          updatedUserId = failed?.userId ?? userId;
        } else if (pi.id) {
          await db
            .update(payments)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(payments.stripePaymentIntentId, pi.id));
        }
        const reason = pi.last_payment_error?.message ?? "Votre paiement a été refusé.";
        await superviserPaiement({
          userId: updatedUserId,
          title: "Paiement échoué",
          body: `${reason} Vous pouvez réessayer quand vous le souhaitez.`,
          url: "/compte",
          action: "payment_failed",
          targetId: paymentId,
          data: { kind: m.payment_kind ?? null },
          result: "failure",
        });
        await emitSafe({
          source: "payment",
          type: "paiement.echoue",
          payload: { reference: String(paymentId ?? pi.id), motif: reason },
        });
        break;
      }
      case "invoice.paid": {
        // Renouvellement d'abonnement réussi → maintien de l'abonnement actif.
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice.subscription as string) || null;
        if (subId) {
          const [sub] = await db
            .update(subscriptions)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, subId))
            .returning();
          if (sub) {
            await superviserPaiement({
              userId: sub.userId ?? null,
              title: "Abonnement renouvelé",
              body: "Votre abonnement a été renouvelé avec succès.",
              url: "/abonnements",
              action: "subscription_renewed",
              targetType: "subscription",
              targetId: sub.id,
            });
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        // Échec de renouvellement → abonnement en impayé (past_due) + alerte.
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice.subscription as string) || null;
        if (subId) {
          const [sub] = await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, subId))
            .returning();
          if (sub) {
            await superviserPaiement({
              userId: sub.userId ?? null,
              title: "Renouvellement d'abonnement échoué",
              body: "Le paiement de votre abonnement a échoué. Merci de mettre à jour votre moyen de paiement.",
              url: "/abonnements",
              action: "subscription_payment_failed",
              targetType: "subscription",
              targetId: sub.id,
              result: "failure",
            });
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        // Synchronise le statut local avec Stripe (actif / impayé / annulé).
        const sub = event.data.object as Stripe.Subscription;
        const mapped =
          sub.status === "active" || sub.status === "trialing"
            ? "active"
            : sub.status === "past_due" || sub.status === "unpaid"
              ? "past_due"
              : sub.status === "canceled"
                ? "cancelled"
                : null;
        if (mapped) {
          await db
            .update(subscriptions)
            .set({ status: mapped, updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .update(subscriptions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return res.status(200).json({ received: true, processed: false, error: (err as Error).message });
  }
  return res.json({ received: true });
}
