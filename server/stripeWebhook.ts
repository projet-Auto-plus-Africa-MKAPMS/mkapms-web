import type { Request, Response } from "express";
import type Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  payments,
  subscriptions,
  bookings,
  annonces,
  users,
  partsOrders,
  partsOrderTracking,
  wallets,
  payouts as ledgerPayouts,
  rentalApplications,
} from "./schema.js";
import { cgDossiers, cgEtapes } from "./modules/cartegrise.js";
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

  // Un secret de webhook configuré rend la signature obligatoire : sans cela,
  // n'importe qui pourrait poster un « checkout.session.completed » et faire
  // passer une commande en payée sans avoir jamais payé.
  let event: Stripe.Event;
  try {
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (env.STRIPE_WEBHOOK_SECRET) {
      if (!sig) return res.status(400).send("Webhook Error: signature Stripe absente.");
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
      console.warn(
        "[payment] webhook accepté sans signature : STRIPE_WEBHOOK_SECRET absente.",
      );
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
        // Frais de dossier carte grise : le paiement fait réellement avancer
        // le dossier. Gap découvert lors du chantier location (tâche #56) —
        // payerDossier (server/routers/cartegrise.ts) crée bien un vrai
        // checkout Stripe depuis PR #407, mais aucun gestionnaire ici ne
        // faisait jamais avancer le dossier à la confirmation du paiement :
        // il restait indéfiniment à son statut d'avant paiement.
        if (m.payment_kind === "carte_grise_service" && m.dossierId) {
          const dossierId = Number(m.dossierId);
          await db
            .update(cgDossiers)
            .set({ status: "en_traitement", updatedAt: new Date() })
            .where(eq(cgDossiers.id, dossierId));
          await db.insert(cgEtapes).values({
            dossierId,
            status: "en_traitement",
            statusLabel: "Paiement reçu — dossier en traitement",
          });
          await superviserPaiement({
            userId,
            title: "Paiement carte grise confirmé",
            body: "Votre paiement a été reçu : votre dossier est maintenant en traitement.",
            url: `/demarches/messagerie-demarches/${dossierId}`,
            action: "cg_dossier_paid",
            targetType: "cg_dossier",
            targetId: dossierId,
          });
        }
        // Caution/acompte de candidature de location flotte (tâche #56) :
        // le paiement fait réellement passer la candidature au statut payé,
        // jamais une simple redirection sans effet en base.
        if (m.payment_kind === "rental_deposit" && m.applicationId) {
          const applicationId = Number(m.applicationId);
          await db
            .update(rentalApplications)
            .set({ depositPaid: true, status: "paid", updatedAt: new Date() })
            .where(eq(rentalApplications.id, applicationId));
          await superviserPaiement({
            userId,
            title: "Caution de location reçue",
            body: "Votre caution a été payée : votre demande de location est confirmée.",
            url: "/location/mes-candidatures",
            action: "rental_deposit_paid",
            targetType: "rental_application",
            targetId: applicationId,
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
            await emitSafe({
              source: "payment",
              type: "refund.completed",
              payload: { reference: String(refunded.id) },
            });
          }
        }
        break;
      }
      // LOT 5 du Plan Maître Fournisseurs — litiges (§28 PAYMENT ORCHESTRATOR
      // : "Litige"). `payments.status` n'est jamais modifié ici : son enum
      // (pending/paid/failed/refunded/cancelled) appartient à la table
      // historique, 100 % additive par doctrine du Payment Engine — un litige
      // est un fait à côté du statut d'encaissement, pas un nouveau statut de
      // paiement. Il est journalisé (Smart Engine + Event Bus) sans jamais
      // fabriquer une issue : "closed" ne dit "gagné/perdu" que si Stripe le
      // dit explicitement (`dispute.status`).
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const [related] = dispute.payment_intent
          ? await db.select().from(payments).where(eq(payments.stripePaymentIntentId, dispute.payment_intent as string)).limit(1)
          : [];
        await superviserPaiement({
          userId: related?.userId ?? null,
          title: "Litige ouvert sur un paiement",
          body: "Un litige a été ouvert sur l'un de vos paiements par votre banque. La Direction a été informée.",
          url: "/compte",
          action: "payment_dispute_opened",
          targetId: related?.id ?? null,
          data: { disputeId: dispute.id, reason: dispute.reason ?? null, amount: dispute.amount },
          result: "failure",
        });
        await emitSafe({
          source: "payment",
          type: "dispute.opened",
          payload: { reference: String(related?.id ?? dispute.id) },
        });
        break;
      }
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        const [related] = dispute.payment_intent
          ? await db.select().from(payments).where(eq(payments.stripePaymentIntentId, dispute.payment_intent as string)).limit(1)
          : [];
        const outcome = dispute.status; // "won" | "lost" | autre statut Stripe réel — jamais déduit.
        await superviserPaiement({
          userId: related?.userId ?? null,
          title: "Litige clos",
          body: `Le litige sur votre paiement est clos (issue : ${outcome}).`,
          url: "/compte",
          action: "payment_dispute_closed",
          targetId: related?.id ?? null,
          data: { disputeId: dispute.id, outcome },
          result: outcome === "won" ? "success" : "failure",
        });
        await emitSafe({
          source: "payment",
          type: "dispute.closed",
          payload: { reference: String(related?.id ?? dispute.id), outcome },
        });
        break;
      }
      // LOT 5 — reversements Stripe Connect vers les wallets fournisseur/
      // transporteur (Ledger, `payouts.stripePayoutId`). Sans transfert Stripe
      // réellement initié depuis ce payout (Sprint 2 : aucun connecteur
      // n'appelle encore `stripe.transfers.create`), ce cas ne trouve
      // honnêtement rien à mettre à jour — jamais un succès fabriqué.
      // Note : Stripe n'émet pas de "transfer.failed" — l'échec/l'annulation
      // d'un transfert existant est notifié par "transfer.reversed".
      case "transfer.created":
      case "transfer.reversed": {
        const transfer = event.data.object as Stripe.Transfer;
        const [related] = await db.select().from(ledgerPayouts).where(eq(ledgerPayouts.stripePayoutId, transfer.id)).limit(1);
        if (related) {
          const newStatus = event.type === "transfer.created" ? "paye" : "echoue";
          await db
            .update(ledgerPayouts)
            .set({ status: newStatus, processedAt: newStatus === "paye" ? new Date() : undefined, updatedAt: new Date() })
            .where(eq(ledgerPayouts.id, related.id));
          if (newStatus === "paye") {
            await db
              .update(wallets)
              .set({ totalVire: sql`${wallets.totalVire} + ${related.montant}`, updatedAt: new Date() })
              .where(eq(wallets.id, related.walletId));
          }
          await logActivity({
            action: newStatus === "paye" ? "payout_transfer_completed" : "payout_transfer_failed",
            targetType: "payout",
            targetId: related.id,
            data: { stripeTransferId: transfer.id },
            result: newStatus === "paye" ? "success" : "failure",
          });
        }
        break;
      }
      // Compte Stripe Connect d'un fournisseur/transporteur mis à jour
      // (KYC, capacités d'encaissement). Journalisé pour la Direction ;
      // aucune capacité de versement n'est activée automatiquement ici —
      // décision humaine (§32 "Validation humaine possible").
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await logActivity({
          action: "stripe_connect_account_updated",
          targetType: "stripe_account",
          data: {
            accountId: account.id,
            chargesEnabled: account.charges_enabled ?? null,
            payoutsEnabled: account.payouts_enabled ?? null,
          },
          result: "success",
        });
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
      case "customer.subscription.created": {
        // Synchronisation défensive : la création normale passe par
        // checkout.session.completed (qui insère déjà la ligne `subscriptions`).
        // Ce cas ne fait que réaligner le statut si Stripe livre l'événement
        // avant, ou pour une souscription créée hors du parcours checkout.
        const sub = event.data.object as Stripe.Subscription;
        const mapped = sub.status === "active" || sub.status === "trialing" ? "active" : null;
        if (mapped) {
          await db
            .update(subscriptions)
            .set({ status: mapped, updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
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
