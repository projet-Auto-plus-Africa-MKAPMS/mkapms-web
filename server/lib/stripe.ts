import Stripe from "stripe";
import { env } from "../env.js";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-10-28.acacia" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export const stripeConfigured = () => !!env.STRIPE_SECRET_KEY;

export type StripeKeyKind = "secrete" | "restreinte" | "publiable" | "inconnue";

/** Nature de la clé configurée, déduite de son préfixe (jamais sa valeur). */
export function stripeKeyKind(): StripeKeyKind {
  const key = env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_")) return "secrete";
  if (key.startsWith("rk_")) return "restreinte";
  if (key.startsWith("pk_")) return "publiable";
  return "inconnue";
}

/** Mode de la clé : réel (live) ou test. */
export function stripeKeyMode(): "live" | "test" | "inconnu" {
  const key = env.STRIPE_SECRET_KEY ?? "";
  if (key.includes("_live_")) return "live";
  if (key.includes("_test_")) return "test";
  return "inconnu";
}

export interface StripeKeyStatus {
  configured: boolean;
  /** La clé est acceptée par Stripe. */
  valid: boolean;
  /** Elle permet réellement de créer un encaissement (Checkout en écriture). */
  canCharge: boolean;
  kind: StripeKeyKind;
  mode: "live" | "test" | "inconnu";
  reason: string;
  checkedAt: string;
}

let cache: { at: number; status: StripeKeyStatus } | null = null;
const CACHE_MS = 5 * 60 * 1000;

/**
 * Vérifie réellement la clé auprès de Stripe.
 *
 * Deux contrôles distincts, parce qu'une clé peut être valide et pourtant
 * incapable d'encaisser : une clé restreinte sans droit d'écriture sur les
 * sessions Checkout passe l'authentification et échoue au moment du paiement,
 * face au client. On préfère le découvrir ici.
 */
export async function checkStripeKey(force = false): Promise<StripeKeyStatus> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.status;

  const base = {
    kind: stripeKeyKind(),
    mode: stripeKeyMode(),
    checkedAt: new Date().toISOString(),
  };

  const stripe = getStripe();
  if (!stripe) {
    const status: StripeKeyStatus = {
      ...base,
      configured: false,
      valid: false,
      canCharge: false,
      reason: "Aucune clé Stripe configurée (STRIPE_SECRET_KEY absente).",
    };
    cache = { at: Date.now(), status };
    return status;
  }

  let valid = false;
  let reason = "";
  try {
    await stripe.balance.retrieve();
    valid = true;
  } catch (err) {
    const e = err as { type?: string; message?: string };
    reason =
      e.type === "StripeAuthenticationError"
        ? `Clé ${base.kind} refusée par Stripe : elle est invalide, révoquée ou appartient à un autre compte.`
        : e.type === "StripePermissionError"
          ? `Clé ${base.kind} valide mais sans droit de lecture du solde : droits insuffisants.`
          : `Stripe injoignable lors de la vérification (${e.type ?? "erreur inconnue"}).`;
    // Une clé restreinte peut refuser la lecture du solde tout en encaissant :
    // on ne conclut pas à l'invalidité, on teste le droit d'encaissement.
    valid = e.type === "StripePermissionError";
  }

  let canCharge = false;
  if (valid) {
    try {
      // Lecture seule sur la ressource réellement utilisée à l'encaissement.
      await stripe.checkout.sessions.list({ limit: 1 });
      canCharge = true;
      reason = reason || "Clé valide, accès Checkout confirmé.";
    } catch (err) {
      const e = err as { type?: string };
      canCharge = false;
      reason =
        e.type === "StripePermissionError"
          ? "Clé valide mais sans accès aux sessions Checkout : ajoute le droit « Checkout Sessions : write »."
          : `Accès Checkout impossible (${e.type ?? "erreur inconnue"}).`;
    }
  }

  const status: StripeKeyStatus = {
    ...base,
    configured: true,
    valid,
    canCharge,
    reason,
  };
  cache = { at: Date.now(), status };
  return status;
}
