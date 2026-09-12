/**
 * MKA.P-MS Investissement — Investment Contract Engine.
 *
 * Gère le cycle de vie complet du contrat (12 statuts non négociables). Ne
 * duplique jamais le stockage de documents ni la signature électronique :
 * réutilise generated_documents/document_signatures (server/modules/contracts.ts,
 * déjà utilisés par contract-os) et le paiement réel (server/schema.ts::payments).
 *
 * Règle non négociable : ACTIVE n'est jamais atteint sur la seule confiance
 * d'un écran — ce module vérifie lui-même, côté serveur, la signature et le
 * paiement confirmé avant d'activer quoi que ce soit.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { documentSignatures } from "../modules/contracts.js";
import { payments } from "../schema.js";
import {
  investments,
  investmentStatusHistory,
  type investmentStatusEnum,
} from "./schema.js";
import { investisseurEligible } from "./kyc.js";

export type StatutInvestissement = (typeof investmentStatusEnum.enumValues)[number];

/** Graphe des transitions autorisées — toute transition hors de cette carte est refusée. Exporté pour être testé directement, sans base de données. */
export const TRANSITIONS_AUTORISEES: Record<StatutInvestissement, StatutInvestissement[]> = {
  DRAFT: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["AWAITING_SIGNATURE", "CANCELLED"],
  AWAITING_SIGNATURE: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["ACTIVATING", "CANCELLED"],
  ACTIVATING: ["ACTIVE", "AWAITING_PAYMENT", "CANCELLED"],
  ACTIVE: ["SUSPENDED", "EXPIRING", "TERMINATED"],
  SUSPENDED: ["ACTIVE", "TERMINATED", "EXPIRED"],
  EXPIRING: ["EXPIRED", "ACTIVE", "TERMINATED"],
  EXPIRED: [],
  TERMINATED: [],
  CANCELLED: [],
};

export interface ResultatTransition {
  ok: boolean;
  motif: string;
  investissement?: typeof investments.$inferSelect;
}

/**
 * Transition générique : vérifie le graphe, écrit l'historique immuable
 * (jamais un avenant qui remplace l'ancien état), jamais de logique métier
 * propre à un statut particulier ici — voir activer() pour la seule
 * transition qui exige des preuves supplémentaires.
 */
export async function transitionner(
  investmentId: number,
  vers: StatutInvestissement,
  motif: string,
  changedBy: number | null = null,
): Promise<ResultatTransition> {
  const [investissement] = await db.select().from(investments).where(eq(investments.id, investmentId)).limit(1);
  if (!investissement) return { ok: false, motif: `Investissement #${investmentId} introuvable.` };

  const autorisees = TRANSITIONS_AUTORISEES[investissement.status as StatutInvestissement];
  if (!autorisees?.includes(vers)) {
    return {
      ok: false,
      motif: `Transition ${investissement.status} → ${vers} refusée (autorisées depuis ${investissement.status} : ${autorisees?.join(", ") || "aucune, statut terminal"}).`,
    };
  }

  // KYC réel exigé avant de proposer la signature — jamais un contrat signé par une identité non vérifiée.
  if (vers === "AWAITING_SIGNATURE") {
    const eligibilite = await investisseurEligible(investissement.investorId);
    if (!eligibilite.eligible) {
      return { ok: false, motif: `Passage en AWAITING_SIGNATURE refusé : ${eligibilite.motif}` };
    }
  }

  const [mis] = await db
    .update(investments)
    .set({ status: vers, updatedAt: new Date() })
    .where(eq(investments.id, investmentId))
    .returning();

  await db.insert(investmentStatusHistory).values({
    investmentId,
    fromStatus: investissement.status,
    toStatus: vers,
    motif,
    changedBy,
  });

  return { ok: true, motif: `Transition ${investissement.status} → ${vers} effectuée.`, investissement: mis };
}

/**
 * Injectables uniquement pour les tests (aucun accès base de données dans cet
 * environnement de travail) : la production utilise toujours les vraies
 * requêtes ci-dessus.
 */
export type VerifierSignature = (documentId: number) => Promise<boolean>;
export type VerifierPaiement = (paymentId: number) => Promise<boolean>;

async function signatureReelleConfirmee(documentId: number): Promise<boolean> {
  const [sig] = await db
    .select()
    .from(documentSignatures)
    .where(and(eq(documentSignatures.documentId, documentId), eq(documentSignatures.signed, true)))
    .limit(1);
  return !!sig;
}

async function paiementReelConfirme(paymentId: number): Promise<boolean> {
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return !!p && p.status === "paid";
}

/**
 * Seule voie vers ACTIVE. Exige, vérifiés côté serveur — jamais sur la
 * confiance d'un écran :
 *  1) un document contractuel réellement signé (document_signatures.signed) ;
 *  2) un paiement réellement confirmé (payments.status = "paid").
 * Aucune des deux preuves n'est facultative, quel que soit le rôle appelant.
 */
export async function activer(
  investmentId: number,
  paymentId: number,
  changedBy: number | null = null,
  verifierSignature: VerifierSignature = signatureReelleConfirmee,
  verifierPaiement: VerifierPaiement = paiementReelConfirme,
): Promise<ResultatTransition> {
  const [investissement] = await db.select().from(investments).where(eq(investments.id, investmentId)).limit(1);
  if (!investissement) return { ok: false, motif: `Investissement #${investmentId} introuvable.` };

  if (!investissement.contractDocumentId) {
    return { ok: false, motif: "Aucun document contractuel rattaché : activation refusée." };
  }
  const signe = await verifierSignature(investissement.contractDocumentId);
  if (!signe) {
    return { ok: false, motif: "Document contractuel non signé (document_signatures) : activation refusée." };
  }
  const paye = await verifierPaiement(paymentId);
  if (!paye) {
    return { ok: false, motif: `Paiement #${paymentId} non confirmé côté serveur (payments.status ≠ "paid") : activation refusée.` };
  }

  const versActivating = await transitionner(investmentId, "ACTIVATING", "Signature et paiement vérifiés côté serveur.", changedBy);
  if (!versActivating.ok) return versActivating;
  return transitionner(investmentId, "ACTIVE", `Activation confirmée (document signé, paiement #${paymentId} confirmé).`, changedBy);
}

/**
 * Fin de contrat à échéance (end_at dépassé) : arrêt des nouvelles
 * attributions, retrait des droits, historique conservé, aucun
 * renouvellement automatique. Les montants déjà acquis dans le Ledger ne
 * sont jamais modifiés par cette fonction.
 */
export async function expirerSiEcheance(investmentId: number, now: Date = new Date()): Promise<ResultatTransition> {
  const [investissement] = await db.select().from(investments).where(eq(investments.id, investmentId)).limit(1);
  if (!investissement) return { ok: false, motif: `Investissement #${investmentId} introuvable.` };
  if (!investissement.endAt || investissement.endAt.getTime() > now.getTime()) {
    return { ok: false, motif: "Échéance non atteinte : aucune expiration à appliquer." };
  }
  if (investissement.status !== "ACTIVE" && investissement.status !== "EXPIRING" && investissement.status !== "SUSPENDED") {
    return { ok: false, motif: `Statut ${investissement.status} non éligible à l'expiration automatique.` };
  }
  return transitionner(investmentId, "EXPIRED", `Échéance atteinte (${investissement.endAt.toISOString()}) — aucun renouvellement automatique.`, null);
}
