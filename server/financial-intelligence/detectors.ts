/**
 * MKA.P-MS Financial Intelligence — détecteurs d'anomalies (point 27).
 *
 * Chaque détecteur est une requête ciblée sur les données réelles. Aucun
 * détecteur n'invente de montant ni ne corrige quoi que ce soit : il constate
 * et décrit. La correction reste une décision humaine.
 *
 * Règle : une anomalie financière ne doit jamais rester silencieuse — mais
 * elle ne doit pas non plus être inventée. Un détecteur qui ne peut pas
 * s'exécuter (table absente) est rapporté comme tel, pas comme « rien à
 * signaler ».
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";

export type Severity = "critique" | "important" | "a_surveiller";

export interface DetectedAnomaly {
  code: string;
  severity: Severity;
  entityType: string;
  entityId: string;
  userId: number | null;
  amount: string | null;
  currency: string | null;
  detail: string;
}

export interface Detector {
  code: string;
  label: string;
  severity: Severity;
  run(): Promise<DetectedAnomaly[]>;
}

interface RawRow {
  entity_id: string | number;
  user_id: number | null;
  amount: string | null;
  currency: string | null;
  detail: string;
}

async function query(text: string): Promise<RawRow[]> {
  const res = await db.execute(sql.raw(text));
  return (res.rows ?? []) as unknown as RawRow[];
}

function build(
  code: string,
  severity: Severity,
  entityType: string,
  rows: RawRow[],
): DetectedAnomaly[] {
  return rows.map((r) => ({
    code,
    severity,
    entityType,
    entityId: String(r.entity_id),
    userId: r.user_id ?? null,
    amount: r.amount ?? null,
    currency: r.currency ?? null,
    detail: r.detail,
  }));
}

export const DETECTORS: Detector[] = [
  {
    code: "paiement_echoue",
    label: "Paiement échoué",
    severity: "important",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Paiement refusé par le prestataire — le client n''a pas obtenu son service.' AS detail
        FROM payments
        WHERE status = 'failed' AND created_at > now() - interval '30 days'
        ORDER BY created_at DESC LIMIT 200
      `);
      return build("paiement_echoue", "important", "payment", rows);
    },
  },
  {
    code: "paiement_bloque",
    label: "Paiement en attente depuis trop longtemps",
    severity: "important",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Paiement resté « en attente » plus de 24 h : ni encaissé, ni refusé.' AS detail
        FROM payments
        WHERE status = 'pending' AND created_at < now() - interval '24 hours'
        ORDER BY created_at DESC LIMIT 200
      `);
      return build("paiement_bloque", "important", "payment", rows);
    },
  },
  {
    code: "double_paiement",
    label: "Double paiement probable",
    severity: "critique",
    async run() {
      // Même client, même montant, même devise, à moins de 10 minutes.
      const rows = await query(`
        SELECT p2.id AS entity_id, p2.user_id, p2.amount::text AS amount, p2.currency,
               'Montant identique déjà encaissé pour ce client il y a moins de 10 minutes (paiement n°' || p1.id || ').' AS detail
        FROM payments p1
        JOIN payments p2
          ON p2.user_id = p1.user_id
         AND p2.amount = p1.amount
         AND p2.currency = p1.currency
         AND p2.id > p1.id
         AND p2.created_at - p1.created_at < interval '10 minutes'
        WHERE p1.status = 'paid' AND p2.status = 'paid'
        ORDER BY p2.created_at DESC LIMIT 100
      `);
      return build("double_paiement", "critique", "payment", rows);
    },
  },
  {
    code: "montant_incoherent",
    label: "Montant incohérent",
    severity: "critique",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Montant hors bornes acceptables (nul, négatif ou anormalement élevé).' AS detail
        FROM payments
        WHERE amount::numeric <= 0 OR amount::numeric > 500000
        ORDER BY created_at DESC LIMIT 100
      `);
      return build("montant_incoherent", "critique", "payment", rows);
    },
  },
  {
    code: "abonnement_expire_actif",
    label: "Abonnement expiré toujours actif",
    severity: "critique",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Abonnement encore actif alors que la période payée est terminée depuis le '
               || to_char(current_period_end, 'DD/MM/YYYY') || '.' AS detail
        FROM subscriptions
        WHERE status = 'active' AND current_period_end IS NOT NULL AND current_period_end < now()
        ORDER BY current_period_end ASC LIMIT 200
      `);
      return build("abonnement_expire_actif", "critique", "subscription", rows);
    },
  },
  {
    code: "abonnement_impaye",
    label: "Abonnement impayé",
    severity: "important",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Renouvellement d''abonnement non encaissé — le service reste ouvert sans paiement.' AS detail
        FROM subscriptions
        WHERE status = 'past_due'
        ORDER BY updated_at DESC LIMIT 200
      `);
      return build("abonnement_impaye", "important", "subscription", rows);
    },
  },
  {
    code: "remboursement",
    label: "Remboursement effectué",
    severity: "a_surveiller",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Paiement remboursé : vérifier l''avoir et l''annulation du service associé.' AS detail
        FROM payments
        WHERE status = 'refunded' AND updated_at > now() - interval '30 days'
        ORDER BY updated_at DESC LIMIT 200
      `);
      return build("remboursement", "a_surveiller", "payment", rows);
    },
  },
  {
    code: "commande_sans_paiement",
    label: "Réservation confirmée sans paiement",
    severity: "critique",
    async run() {
      const rows = await query(`
        SELECT b.id AS entity_id, b.user_id, NULL::text AS amount, b.caution_currency AS currency,
               'Réservation confirmée alors qu''aucun paiement encaissé ne lui est rattaché.' AS detail
        FROM bookings b
        LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'paid'
        WHERE b.status = 'confirmed' AND p.id IS NULL
        ORDER BY b.id DESC LIMIT 200
      `);
      return build("commande_sans_paiement", "critique", "booking", rows);
    },
  },
  {
    code: "paiement_sans_commande",
    label: "Paiement encaissé sans objet rattaché",
    severity: "important",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Paiement encaissé sans réservation, véhicule ni abonnement associé : service dû non identifié.' AS detail
        FROM payments
        WHERE status = 'paid'
          AND booking_id IS NULL AND vehicle_id IS NULL AND subscription_id IS NULL
          AND rental_application_id IS NULL
          AND created_at > now() - interval '90 days'
        ORDER BY created_at DESC LIMIT 200
      `);
      return build("paiement_sans_commande", "important", "payment", rows);
    },
  },
  {
    code: "facture_manquante",
    label: "Facture manquante",
    severity: "important",
    async run() {
      const rows = await query(`
        SELECT id AS entity_id, user_id, amount::text AS amount, currency,
               'Transaction validée sans référence de facture : obligation comptable non satisfaite.' AS detail
        FROM payment_transactions
        WHERE status IN ('valide', 'recu') AND (invoice_ref IS NULL OR invoice_ref = '')
        ORDER BY created_at DESC LIMIT 200
      `);
      return build("facture_manquante", "important", "transaction", rows);
    },
  },
  {
    code: "devise_incoherente",
    label: "Changement de devise",
    severity: "a_surveiller",
    async run() {
      const rows = await query(`
        SELECT user_id::text AS entity_id, user_id, NULL::text AS amount,
               string_agg(DISTINCT currency, ' / ') AS currency,
               'Ce client a payé dans plusieurs devises : vérifier la conversion et le rattachement comptable.' AS detail
        FROM payments
        WHERE status = 'paid' AND created_at > now() - interval '90 days'
        GROUP BY user_id
        HAVING count(DISTINCT currency) > 1
        LIMIT 100
      `);
      return build("devise_incoherente", "a_surveiller", "user", rows);
    },
  },
];
