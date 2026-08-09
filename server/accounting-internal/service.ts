/**
 * Comptabilité interne MKA.P-MS (point 26 A).
 *
 * Univers strictement interne : paiements → écritures → commissions →
 * remboursements → abonnements → rapprochements → anomalies. Il ne connaît
 * PAS la marketplace de comptables indépendants, et réciproquement : les deux
 * univers sont séparés pour pouvoir être exploités séparément.
 *
 * Le rapprochement est la pièce qui manquait : un paiement encaissé sans
 * écriture, c'est de l'argent en banque absent des comptes.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { payments } from "../schema.js";
import { comptaEcritures } from "../modules/comptabilite.js";
import { comptaRapprochements } from "./schema.js";

/** Traduction du type de paiement vers le type d'écriture comptable. */
const ECRITURE_TYPE: Record<string, "abonnement" | "vente_vehicule" | "commission" | "facture_client"> = {
  pro_subscription: "abonnement",
  franchise_subscription: "abonnement",
  vehicle_purchase: "vente_vehicule",
  vehicle_boost: "facture_client",
  rental_caution: "facture_client",
  society_acompte: "facture_client",
};

export interface ReconcileResult {
  examines: number;
  rapproches: number;
  ecarts: number;
  deja_traites: number;
}

/**
 * Crée l'écriture comptable manquante de chaque paiement encaissé.
 * Idempotent : un paiement déjà rapproché est ignoré (contrainte d'unicité).
 */
export async function reconcilePayments(limit = 500): Promise<ReconcileResult> {
  const rows = await db
    .select({
      id: payments.id,
      userId: payments.userId,
      type: payments.type,
      amount: payments.amount,
      currency: payments.currency,
      vehicleId: payments.vehicleId,
      subscriptionId: payments.subscriptionId,
      createdAt: payments.createdAt,
      rapprochementId: comptaRapprochements.id,
    })
    .from(payments)
    .leftJoin(comptaRapprochements, eq(comptaRapprochements.paymentId, sql`${payments.id}::int`))
    .where(eq(payments.status, "paid"))
    .orderBy(desc(payments.createdAt))
    .limit(limit);

  let rapproches = 0;
  let ecarts = 0;
  let dejaTraites = 0;

  for (const p of rows) {
    if (p.rapprochementId !== null) {
      dejaTraites += 1;
      continue;
    }
    const montant = Number(p.amount);
    if (!Number.isFinite(montant) || montant <= 0) {
      await db.insert(comptaRapprochements).values({
        paymentId: Number(p.id),
        ecritureId: null,
        amount: String(p.amount ?? 0),
        currency: p.currency,
        status: "impossible",
        detail: "Montant inexploitable : écriture comptable non générée, contrôle humain requis.",
      });
      ecarts += 1;
      continue;
    }

    const [ecriture] = await db
      .insert(comptaEcritures)
      .values({
        type: ECRITURE_TYPE[p.type] ?? "autre",
        label: `Paiement n°${p.id} — ${p.type}`,
        // Le montant encaissé est TTC : la ventilation TVA est reprise par le
        // module TVA selon le pays, on ne l'invente pas ici.
        montantHT: String(montant),
        tvaRate: "0.00",
        tvaMontant: "0",
        montantTTC: String(montant),
        sens: "credit",
        statut: "a_valider",
        clientId: Number(p.userId),
        vehiculeId: p.vehicleId === null ? null : Number(p.vehicleId),
        abonnementId: p.subscriptionId === null ? null : Number(p.subscriptionId),
        reference: `PAY-${p.id}`,
        notes: "Écriture générée par rapprochement automatique — à valider.",
      })
      .returning();

    await db.insert(comptaRapprochements).values({
      paymentId: Number(p.id),
      ecritureId: ecriture?.id ?? null,
      amount: String(montant),
      currency: p.currency,
      status: "rapproche",
    });
    rapproches += 1;
  }

  return { examines: rows.length, rapproches, ecarts, deja_traites: dejaTraites };
}

export interface InternalAccountingHealth {
  health: "ok" | "degraded" | "down";
  paiementsEncaisses: number;
  paiementsNonRapproches: number;
  ecartsOuverts: number;
  ecrituresAValider: number;
  details: string[];
}

/**
 * Santé de l'univers interne. Des écritures à valider sont du travail métier
 * normal ; seuls les paiements non rapprochés dégradent réellement le moteur.
 */
export async function internalAccountingHealth(): Promise<InternalAccountingHealth> {
  const [paid] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(payments)
    .where(eq(payments.status, "paid"));

  const [notReconciled] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(payments)
    .leftJoin(comptaRapprochements, eq(comptaRapprochements.paymentId, sql`${payments.id}::int`))
    .where(sql`${payments.status} = 'paid' AND ${comptaRapprochements.id} IS NULL`);

  const [ecarts] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(comptaRapprochements)
    .where(eq(comptaRapprochements.status, "impossible"));

  const [aValider] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(comptaEcritures)
    .where(eq(comptaEcritures.statut, "a_valider"));

  const nonRapproches = Number(notReconciled?.n ?? 0);
  const details = [
    `${Number(paid?.n ?? 0)} paiement(s) encaissé(s), ${nonRapproches} sans écriture comptable.`,
    `${Number(aValider?.n ?? 0)} écriture(s) en attente de validation humaine.`,
  ];
  if (Number(ecarts?.n ?? 0) > 0) {
    details.push(`${Number(ecarts?.n)} paiement(s) impossible(s) à rapprocher automatiquement.`);
  }

  return {
    health: nonRapproches === 0 ? "ok" : "degraded",
    paiementsEncaisses: Number(paid?.n ?? 0),
    paiementsNonRapproches: nonRapproches,
    ecartsOuverts: Number(ecarts?.n ?? 0),
    ecrituresAValider: Number(aValider?.n ?? 0),
    details,
  };
}

export async function listRapprochements(limit = 100) {
  return db
    .select()
    .from(comptaRapprochements)
    .orderBy(desc(comptaRapprochements.createdAt))
    .limit(limit);
}

/** Paiements encaissés qui n'ont encore aucune écriture. */
export async function listUnreconciled(limit = 100) {
  return db
    .select({
      paymentId: payments.id,
      userId: payments.userId,
      type: payments.type,
      amount: payments.amount,
      currency: payments.currency,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(comptaRapprochements, eq(comptaRapprochements.paymentId, sql`${payments.id}::int`))
    .where(sql`${payments.status} = 'paid' AND ${comptaRapprochements.id} IS NULL`)
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}
