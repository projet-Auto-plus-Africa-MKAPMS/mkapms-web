/**
 * MKA.P-MS Investissement — Investor Revenue Engine + écriture au Ledger.
 *
 * Calcule ce qui revient à l'investisseur à partir du modèle financier réel
 * de son contrat — jamais une règle de marge inventée sans politique
 * explicite de la direction :
 *  - fixed_price : l'investisseur a acheté le périmètre pour la durée
 *    (Dossier Investisseur §8, Formule 1) — les revenus de ce périmètre lui
 *    reviennent entièrement pendant le contrat ; la commission MKA.P-MS pour
 *    CE mouvement est 0 (MKA.P-MS a déjà été payée via le prix fixe, suivi
 *    séparément, jamais mélangé à ce ledger par transaction) ;
 *  - revenue_share : l'investisseur reçoit exactement la fraction
 *    contractuelle (revenueShare) du brut, MKA.P-MS garde le reste comme
 *    commission ;
 *  - hybrid : même partage que revenue_share (le prix fixe est le droit
 *    d'entrée, le pourcentage gouverne le partage courant — Dossier
 *    Investisseur §8, Formule 2).
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { investments, investorLedger } from "./schema.js";

export interface EntreeRevenu {
  investmentId: number;
  transactionRef: string;
  montantBrut: number;
  taxe?: number;
  remboursement?: number;
  devise: string;
}

export interface AttributionCalculee {
  montantBrut: number;
  commission: number;
  taxe: number;
  remboursement: number;
  montantNet: number;
}

/** Calcul pur, sans accès base — testable sans dépendance. */
export function calculerAttribution(
  pricingModel: "fixed_price" | "revenue_share" | "hybrid",
  revenueShare: number | null,
  montantBrut: number,
  taxe = 0,
  remboursement = 0,
): AttributionCalculee {
  if (pricingModel === "fixed_price") {
    const montantNet = Math.max(0, montantBrut - taxe - remboursement);
    return { montantBrut, commission: 0, taxe, remboursement, montantNet };
  }
  // revenue_share ou hybrid : la fraction contractuelle doit être définie, sinon aucune part inventée.
  const fraction = revenueShare ?? 0;
  const partInvestisseur = montantBrut * fraction;
  const commission = Math.max(0, montantBrut - partInvestisseur);
  const montantNet = Math.max(0, partInvestisseur - taxe - remboursement);
  return { montantBrut, commission, taxe, remboursement, montantNet };
}

export interface ResultatEcritureLedger {
  ok: boolean;
  motif: string;
  ligne?: typeof investorLedger.$inferSelect;
}

/**
 * Écrit un mouvement réel au Ledger de l'investisseur, uniquement si
 * l'investissement est ACTIVE — jamais un revenu attribué à un contrat qui
 * n'a pas encore franchi l'activation réelle (voir contrat.ts::activer).
 */
export async function attribuerRevenu(entree: EntreeRevenu): Promise<ResultatEcritureLedger> {
  const [investissement] = await db.select().from(investments).where(eq(investments.id, entree.investmentId)).limit(1);
  if (!investissement) return { ok: false, motif: `Investissement #${entree.investmentId} introuvable.` };
  if (investissement.status !== "ACTIVE") {
    return { ok: false, motif: `Investissement #${entree.investmentId} au statut ${investissement.status} : aucun revenu attribué tant qu'il n'est pas ACTIVE.` };
  }

  const revenueShare = investissement.revenueShare != null ? Number(investissement.revenueShare) : null;
  const attribution = calculerAttribution(
    investissement.pricingModel,
    revenueShare,
    entree.montantBrut,
    entree.taxe ?? 0,
    entree.remboursement ?? 0,
  );

  const [ligne] = await db
    .insert(investorLedger)
    .values({
      investmentId: entree.investmentId,
      investorId: investissement.investorId,
      countryCode: investissement.countryCode,
      universeId: investissement.universeId,
      transactionRef: entree.transactionRef,
      montantBrut: String(attribution.montantBrut),
      commission: String(attribution.commission),
      taxe: String(attribution.taxe),
      remboursement: String(attribution.remboursement),
      montantNet: String(attribution.montantNet),
      devise: entree.devise,
      statut: "en_attente",
    })
    .returning();

  return { ok: true, motif: `Mouvement #${ligne.id} attribué à l'investisseur #${investissement.investorId}.`, ligne };
}
