/**
 * MKA.P-MS Payment Engine — Constantes métier.
 */

/** Statuts d'une transaction (cahier des charges §30). */
export const PAYMENT_STATUSES = [
  "cree",
  "en_attente",
  "en_attente_virement",
  "autorise",
  "recu",
  "a_verifier",
  "valide",
  "refuse",
  "expire",
  "annule",
  "rembourse",
  "conteste",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Moyens de paiement. */
export const PAYMENT_METHODS = [
  "card",
  "bank_transfer",
  "deposit",
  "full",
  "installment",
  "wallet",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Un statut est-il "terminal" (aucune transition attendue) ? */
export const TERMINAL_STATUSES: PaymentStatus[] = [
  "valide",
  "refuse",
  "expire",
  "annule",
  "rembourse",
];

/** Un statut compte-t-il comme "payé / actif" côté service ? */
export function isPaidStatus(status: string): boolean {
  return status === "valide" || status === "recu";
}
