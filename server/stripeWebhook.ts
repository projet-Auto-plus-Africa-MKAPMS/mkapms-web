import type { Request, Response } from "express";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { payments, subscriptions, bookings, annonces, users } from "./schema.js";
import { getStripe } from "./lib/stripe.js";
import { getPlan } from "@shared/plans.js";
import { env } from "./env.js";

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
        }
        // Acompte réservation
        if (m.payment_kind === "reservation_acompte" && m.booking_id) {
          await db
            .update(bookings)
            .set({ status: "accepted", cautionStatus: "paid", updatedAt: new Date() })
            .where(eq(bookings.id, Number(m.booking_id)));
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
          await db
            .update(payments)
            .set({ status: "refunded", updatedAt: new Date() })
            .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));
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
