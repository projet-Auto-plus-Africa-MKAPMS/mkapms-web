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
import { resolveProduct, computePrice } from "./products.js";
import { routePayment, NO_PROVIDER_REASON } from "../payment-orchestrator/service.js";

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
  /**
   * Code produit du registre central (Phase 24). Si fourni, le montant, la
   * devise et le libellé sont résolus CÔTÉ SERVEUR depuis le registre — le prix
   * du navigateur est ignoré. À privilégier pour tout nouveau flux.
   */
  productCode?: string;
  quantity?: number;
  /** Montant (déprécié pour les nouveaux flux : préférer productCode). */
  amount?: number;
  currency?: string;
  label?: string;
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
  /** Pays de l'acheteur : détermine le prestataire retenu par l'orchestrateur. */
  countryCode?: string | null;
  /** Prestataire souhaité par l'utilisateur, respecté s'il est utilisable. */
  preferredProvider?: string | null;
}

export interface CheckoutResult {
  /** URL de redirection (Stripe Checkout ou page simulation). */
  url: string;
  /** Vrai si Stripe est actif et a créé une vraie session. */
  configured: boolean;
  /** ID du payment créé en base (utile pour debug / lien back). */
  paymentId: number;
  /** Prestataire retenu par l'orchestrateur pour cet encaissement. */
  provider?: string;
}

export async function createPaymentCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  // Résolution du prix côté serveur depuis le registre central (Phase 24).
  // Si un productCode est fourni, le prix du navigateur est totalement ignoré.
  let amount: number;
  let currency: string;
  let label: string;
  if (input.productCode) {
    const product = await resolveProduct(input.productCode);
    const priced = computePrice(product, input.quantity ?? 1);
    amount = priced.total;
    currency = priced.currency.toUpperCase();
    label = input.label ?? product.name;
  } else {
    if (typeof input.amount !== "number" || !(input.amount > 0)) {
      throw new Error("Montant de paiement invalide");
    }
    amount = input.amount;
    currency = (input.currency || "EUR").toUpperCase();
    label = input.label ?? "Paiement MKA.P-MS";
  }
  // Les produits gratuits (prix 0) ne passent pas par le paiement.
  if (!(amount > 0)) {
    throw new Error("Ce produit est gratuit — aucun paiement requis");
  }

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
      amount: String(amount),
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

  // 3. Orchestrateur : quel prestataire encaisse ce paiement ?
  // Le checkout ne présume plus d'un prestataire unique ; ajouter un
  // connecteur ne demandera pas de réécrire ce parcours.
  const decision = await routePayment({
    countryCode: (input.countryCode || "FR").toUpperCase(),
    currency,
    service: input.kind,
    preferred: input.preferredProvider ?? null,
    userId: input.userId,
  });
  if (!decision.providerCode) {
    await db.update(payments).set({ status: "failed" }).where(eq(payments.id, pay.id));
    throw new Error(
      `${NO_PROVIDER_REASON} — pays ${(input.countryCode || "FR").toUpperCase()}, devise ${currency}`,
    );
  }

  // 4. Création de la session Stripe Checkout
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
    // Propage les métadonnées au PaymentIntent : indispensable pour rattacher
    // l'événement `payment_intent.payment_failed` au bon paiement en base.
    payment_intent_data: { metadata: stringifiedMeta },
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: label.slice(0, 200) },
          unit_amount: Math.round(amount * 100),
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
    provider: decision.providerCode,
  };
}
