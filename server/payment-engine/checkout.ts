/**
 * Payment Engine — helper Checkout unifié.
 *
 * Une seule fonction pour brancher n'importe quel moteur métier
 * (dépannage, livraison, pièces, dépôt-vente, annonces, garages…)
 * au flow de paiement Stripe.
 *
 * Utilisation type :
 *   const { url } = await createPaymentCheckout({
 *     userId: ctx.user.uid,
 *     kind: "depannage_mission",
 *     amount: 149.90,
 *     currency: "EUR",
 *     label: "Dépannage véhicule — 15 avenue Foch",
 *     metadata: { missionId },
 *     successPath: `/depannage/mission/${missionId}?paid=1`,
 *     cancelPath: `/depannage/mission/${missionId}?canceled=1`,
 *   });
 *   return { url };
 *
 * En cas de non-configuration Stripe (mode dégradé), retourne une
 * URL de simulation locale. Le webhook Stripe (server/stripeWebhook.ts)
 * marquera le payment 'succeeded' à la confirmation.
 */
import { db } from "../db.js";
import { payments } from "../schema.js";
import { getStripe } from "../lib/stripe.js";
import { env } from "../env.js";
import { eq } from "drizzle-orm";

/** Types de paiement supportés — reflet des kinds acceptés par le webhook. */
export type PaymentKind =
  | "depannage_mission"      // mission de dépannage payée par le client
  | "livraison_mission"      // livraison payée par le client
  | "pieces_order"           // commande de pièces auto
  | "depotvente_frais"       // frais de dépôt-vente
  | "annonce_boost"          // mise en avant d'une annonce
  | "garage_prestation"      // prestation garage payée en ligne
  | "kyc_verification"       // vérification KYC payante
  | "carte_grise_service";   // service carte grise

export interface CheckoutInput {
  userId: number;
  kind: PaymentKind;
  amount: number;
  currency?: string;
  label: string;
  /** Métadonnées propagées à Stripe et au webhook. */
  metadata?: Record<string, string | number>;
  /** Chemin de succès (relatif à PUBLIC_URL). */
  successPath: string;
  /** Chemin d'annulation (relatif à PUBLIC_URL). */
  cancelPath: string;
  /** Type SQL du payment (fk vers l'énumération DB). */
  paymentTypeSql?: string;
  /** ID facultatif du véhicule ou de la réservation liés. */
  vehicleId?: number | null;
  bookingId?: number | null;
}

export interface CheckoutResult {
  /** URL de redirection (Stripe Checkout ou page simulation). */
  url: string;
  /** Vrai si Stripe est actif et a créé une vraie session. */
  configured: boolean;
  /** ID du payment créé en base (utile pour debug / lien back). */
  paymentId: number;
}

export async function createPaymentCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  if (!(input.amount > 0)) {
    throw new Error("Montant de paiement invalide");
  }
  const currency = (input.currency || "EUR").toUpperCase();

  // 1. Enregistrement du paiement en base (statut pending)
  // Note : l'enum paymentTypeEnum en DB est limité à certaines valeurs.
  // Les nouveaux kinds (depannage, livraison, etc.) sont mappés vers
  // vehicle_boost (service ponctuel) ou vehicle_purchase (achat), la
  // vraie nature reste dans metadata.payment_kind pour le webhook.
  const sqlTypeMap: Record<PaymentKind, string> = {
    depannage_mission: "vehicle_boost",
    livraison_mission: "vehicle_boost",
    pieces_order: "vehicle_purchase",
    depotvente_frais: "vehicle_boost",
    annonce_boost: "vehicle_boost",
    garage_prestation: "vehicle_boost",
    kyc_verification: "vehicle_boost",
    carte_grise_service: "vehicle_boost",
  };
  const paymentTypeSql = input.paymentTypeSql ?? sqlTypeMap[input.kind] ?? "vehicle_boost";

  const [pay] = await db
    .insert(payments)
    .values({
      userId: input.userId,
      type: paymentTypeSql as any,
      amount: String(input.amount),
      currency,
      status: "pending",
      vehicleId: input.vehicleId ?? undefined,
      bookingId: input.bookingId ?? undefined,
    })
    .returning();

  // 2. Stripe indisponible → mode simulation local
  const stripe = getStripe();
  if (!stripe) {
    return {
      url: `/paiement/simulation?payment=${pay.id}`,
      configured: false,
      paymentId: pay.id,
    };
  }

  // 3. Création de la session Stripe Checkout
  const stringifiedMeta: Record<string, string> = {
    user_id: String(input.userId),
    payment_id: String(pay.id),
    payment_kind: input.kind,
  };
  if (input.metadata) {
    for (const [k, v] of Object.entries(input.metadata)) {
      stringifiedMeta[k] = String(v);
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: String(input.userId),
    metadata: stringifiedMeta,
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: input.label.slice(0, 200) },
          unit_amount: Math.round(input.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${env.PUBLIC_URL}${input.successPath}`,
    cancel_url: `${env.PUBLIC_URL}${input.cancelPath}`,
  });

  await db
    .update(payments)
    .set({ stripeSessionId: session.id })
    .where(eq(payments.id, pay.id));

  return {
    url: session.url as string,
    configured: true,
    paymentId: pay.id,
  };
}
