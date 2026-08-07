/**
 * MKA.P-MS Payment Engine — Audit de couverture (Phase 23).
 *
 * OBSERVE et RAPPORTE uniquement l'état réel du moteur de paiement existant :
 *  - cas d'usage demandés vs cas réellement observés (transactions) ;
 *  - kinds de checkout branchés ;
 *  - statuts et moyens de paiement définis ;
 *  - règles par pays ;
 *  - événements webhook Stripe traités.
 *
 * Ne crée aucun second Payment Engine, ne modifie aucune transaction.
 * Sert de base au chantier de finalisation (Phases 24 → 41).
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { paymentTransactions, paymentCountryRules } from "./schema.js";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "./constants.js";

/** Cas de paiement demandés au cahier des charges (Phase 23). */
export const REQUIRED_PAYMENT_CASES: { key: string; label: string }[] = [
  { key: "achat_vehicule", label: "Achat de véhicule" },
  { key: "reservation_vehicule", label: "Réservation de véhicule" },
  { key: "acompte", label: "Acompte" },
  { key: "paiement_integral", label: "Paiement intégral" },
  { key: "location", label: "Location" },
  { key: "garage", label: "Prestation garage" },
  { key: "devis", label: "Devis" },
  { key: "facture", label: "Facture" },
  { key: "abonnement", label: "Abonnement" },
  { key: "depot_annonce", label: "Dépôt d'annonce payant" },
  { key: "boost_annonce", label: "Boost d'annonce" },
  { key: "photos_supplementaires", label: "Photos supplémentaires" },
  { key: "options_premium", label: "Options premium" },
  { key: "commissions", label: "Commissions" },
  { key: "encheres", label: "Enchères" },
  { key: "remboursement", label: "Remboursement" },
  { key: "annulation", label: "Annulation" },
  { key: "litige", label: "Litige" },
  { key: "paiement_echoue", label: "Paiement échoué" },
  { key: "paiement_en_attente", label: "Paiement en attente" },
  { key: "international", label: "Moyens de paiement internationaux" },
];

/** Kinds de checkout réellement branchés (voir checkout.ts). */
export const SUPPORTED_CHECKOUT_KINDS = [
  "depannage_mission",
  "livraison_mission",
  "pieces_order",
  "depotvente_frais",
  "annonce_boost",
  "garage_prestation",
  "kyc_verification",
  "carte_grise_service",
] as const;

/** Événements webhook Stripe actuellement traités (voir stripeWebhook.ts). */
export const HANDLED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "charge.refunded",
  "payment_intent.payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

/** Événements webhook attendus au cahier des charges (Phase 35). */
export const REQUIRED_WEBHOOK_EVENTS: { event: string; label: string }[] = [
  { event: "checkout.session.completed", label: "Paiement réussi" },
  { event: "payment_intent.payment_failed", label: "Paiement échoué" },
  { event: "checkout.session.expired", label: "Paiement annulé / expiré" },
  { event: "charge.refunded", label: "Remboursement" },
  { event: "customer.subscription.created", label: "Abonnement créé" },
  { event: "customer.subscription.updated", label: "Abonnement modifié" },
  { event: "customer.subscription.deleted", label: "Abonnement annulé" },
  { event: "invoice.paid", label: "Facture payée" },
  { event: "invoice.payment_failed", label: "Facture impayée" },
  { event: "charge.dispute.created", label: "Litige créé" },
  { event: "charge.dispute.closed", label: "Litige fermé" },
  { event: "account.updated", label: "Compte professionnel vérifié" },
  { event: "transfer.created", label: "Reversement effectué" },
  { event: "transfer.failed", label: "Reversement échoué" },
];

export interface PaymentAuditItem {
  key: string;
  label: string;
  observed: number; // nb de transactions rapprochées de ce cas
  covered: boolean; // au moins une transaction OU un kind checkout branché
}

export interface PaymentAuditReport {
  cases: PaymentAuditItem[];
  checkoutKinds: string[];
  webhooks: { event: string; label: string; handled: boolean }[];
  statuses: string[];
  methods: string[];
  countryRulesCount: number;
  totals: { transactions: number; byStatus: { status: string; count: number }[] };
  gaps: string[];
  generatedAt: string;
}

/** Associe un cas demandé aux valeurs entityType/service/univers observées. */
function matchesCase(caseKey: string, row: { entityType: string | null; service: string | null; univers: string | null; status: string; method: string }): boolean {
  const hay = `${row.entityType ?? ""} ${row.service ?? ""} ${row.univers ?? ""}`.toLowerCase();
  switch (caseKey) {
    case "achat_vehicule": return row.entityType === "vehicle" || hay.includes("achat");
    case "reservation_vehicule": return hay.includes("reserv");
    case "acompte": return row.method === "deposit" || hay.includes("acompte");
    case "paiement_integral": return row.method === "full" || hay.includes("integral");
    case "location": return hay.includes("location") || row.univers === "location";
    case "garage": return hay.includes("garage");
    case "devis": return hay.includes("devis");
    case "facture": return hay.includes("facture");
    case "abonnement": return row.entityType === "subscription" || hay.includes("abonnement");
    case "depot_annonce": return hay.includes("depot") || hay.includes("annonce");
    case "boost_annonce": return hay.includes("boost");
    case "photos_supplementaires": return hay.includes("photo");
    case "options_premium": return hay.includes("premium") || hay.includes("option");
    case "commissions": return hay.includes("commission");
    case "encheres": return hay.includes("enchere");
    case "remboursement": return row.status === "rembourse";
    case "annulation": return row.status === "annule";
    case "litige": return row.status === "conteste";
    case "paiement_echoue": return row.status === "refuse";
    case "paiement_en_attente": return ["cree", "en_attente", "en_attente_virement", "autorise"].includes(row.status);
    case "international": return false; // détecté via countryRules, pas via transactions
    default: return false;
  }
}

/** Cas déjà couverts par un kind de checkout branché (même sans transaction). */
const CASE_HAS_CHECKOUT: Record<string, boolean> = {
  boost_annonce: true,        // annonce_boost
  garage: true,               // garage_prestation
  photos_supplementaires: false,
  depot_annonce: true,        // depotvente_frais
};

export async function paymentAudit(): Promise<PaymentAuditReport> {
  const rows = await db
    .select({
      entityType: paymentTransactions.entityType,
      service: paymentTransactions.service,
      univers: paymentTransactions.univers,
      status: paymentTransactions.status,
      method: paymentTransactions.method,
    })
    .from(paymentTransactions);

  const cases: PaymentAuditItem[] = REQUIRED_PAYMENT_CASES.map((c) => {
    const observed = rows.filter((r) => matchesCase(c.key, r)).length;
    const covered = observed > 0 || CASE_HAS_CHECKOUT[c.key] === true;
    return { key: c.key, label: c.label, observed, covered };
  });

  const byStatusRows = await db
    .select({ status: paymentTransactions.status, count: sql<number>`count(*)::int` })
    .from(paymentTransactions)
    .groupBy(paymentTransactions.status);

  let countryRulesCount = 0;
  try {
    const [cr] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(paymentCountryRules);
    countryRulesCount = Number(cr?.n ?? 0);
  } catch { /* table absente */ }

  const webhooks = REQUIRED_WEBHOOK_EVENTS.map((w) => ({
    ...w,
    handled: (HANDLED_WEBHOOK_EVENTS as readonly string[]).includes(w.event),
  }));

  const gaps: string[] = [];
  const missingCases = cases.filter((c) => !c.covered && c.key !== "international");
  if (missingCases.length > 0) {
    gaps.push(`${missingCases.length} cas de paiement sans transaction ni checkout branché : ${missingCases.map((c) => c.label).join(", ")}.`);
  }
  const missingWebhooks = webhooks.filter((w) => !w.handled);
  if (missingWebhooks.length > 0) {
    gaps.push(`${missingWebhooks.length} événements webhook non traités (Phase 35) : ${missingWebhooks.map((w) => w.label).join(", ")}.`);
  }
  if (countryRulesCount === 0) {
    gaps.push("Aucune règle par pays configurée (paiements internationaux non paramétrés).");
  }

  return {
    cases,
    checkoutKinds: [...SUPPORTED_CHECKOUT_KINDS],
    webhooks,
    statuses: [...PAYMENT_STATUSES],
    methods: [...PAYMENT_METHODS],
    countryRulesCount,
    totals: {
      transactions: rows.length,
      byStatus: byStatusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
    },
    gaps,
    generatedAt: new Date().toISOString(),
  };
}
