/**
 * MKA.P-MS Estimate Gateway — schéma canonique.
 *
 * LOT IA02E : un seul format de sortie pour toute estimation de prix,
 * quel que soit le moteur métier interrogé (VO Engine, Vehicle Delivery,
 * Country Policy, Import Risk, catalogue pièces, devis garage, devises).
 *
 * Règle absolue : `amount` ne peut être renseigné que si `status === "ok"`.
 * Quand la donnée réelle manque, la passerelle renvoie `UNAVAILABLE` (ou
 * `BUSINESS_ENGINE_MISSING` quand aucun moteur métier n'existe pour cette
 * question) avec `missingData` rempli — jamais un chiffre déduit ou moyen.
 */

/** Niveau de vérité de l'estimation, affiché tel quel côté client. */
export const QUALITES_ESTIMATION = [
  "LIVE_QUOTE", // prix confirmé par un devis/barème vérifié, engageant
  "REAL_DATA_ESTIMATE", // calculé à partir de données réelles (comparables, catalogue, médiane)
  "REFERENCE_RANGE", // fourchette indicative (barème non vérifié, taux de repli)
  "UNAVAILABLE", // aucune donnée réelle suffisante — rien n'est inventé
] as const;
export type QualiteEstimation = (typeof QUALITES_ESTIMATION)[number];

export const STATUTS_ESTIMATION = ["ok", "unavailable", "business_engine_missing"] as const;
export type StatutEstimation = (typeof STATUTS_ESTIMATION)[number];

export interface ParametresEstimation {
  [cle: string]: string | number | boolean | null | undefined;
}

export interface ResultatEstimation {
  estimateId: string;
  estimateType: string;
  status: StatutEstimation;
  quality: QualiteEstimation;
  amount: number | null;
  currency: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  confidence: "haute" | "moyenne" | "faible" | null;
  /** Nom interne du moteur — jamais un nom de fournisseur externe. */
  sourceType: string;
  /** Identifiants des lignes réelles utilisées (devis, comparables, tarifs) — traçabilité interne uniquement. */
  sourceIds: string[];
  engineId: string;
  country: string | null;
  origin: string | null;
  destination: string | null;
  parameters: ParametresEstimation;
  calculatedAt: string;
  validUntil: string | null;
  isLiveQuote: boolean;
  isBinding: boolean;
  assumptions: string[];
  missingData: string[];
  warnings: string[];
  traceId: string;
}

export function nouvelleEstimationVide(input: {
  estimateType: string;
  engineId: string;
  traceId: string;
  country?: string | null;
  origin?: string | null;
  destination?: string | null;
  parameters?: ParametresEstimation;
}): Omit<ResultatEstimation, "status" | "quality" | "amount" | "currency" | "minAmount" | "maxAmount" | "confidence" | "sourceIds" | "assumptions" | "missingData" | "warnings" | "isLiveQuote" | "isBinding" | "validUntil"> {
  return {
    estimateId: `est_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    estimateType: input.estimateType,
    sourceType: input.engineId,
    engineId: input.engineId,
    country: input.country ?? null,
    origin: input.origin ?? null,
    destination: input.destination ?? null,
    parameters: input.parameters ?? {},
    calculatedAt: new Date().toISOString(),
    traceId: input.traceId,
  };
}

/** Estimation refusée — aucune donnée réelle suffisante. Jamais de montant. */
export function estimationIndisponible(
  base: ReturnType<typeof nouvelleEstimationVide>,
  motifs: string[],
): ResultatEstimation {
  return {
    ...base,
    status: "unavailable",
    quality: "UNAVAILABLE",
    amount: null,
    currency: null,
    minAmount: null,
    maxAmount: null,
    confidence: null,
    sourceIds: [],
    assumptions: [],
    missingData: motifs,
    warnings: [],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

/** Aucun moteur métier n'existe pour répondre à cette question — pas de politique à inventer. */
export function moteurMetierAbsent(
  base: ReturnType<typeof nouvelleEstimationVide>,
  detail: string,
): ResultatEstimation {
  return {
    ...base,
    status: "business_engine_missing",
    quality: "UNAVAILABLE",
    amount: null,
    currency: null,
    minAmount: null,
    maxAmount: null,
    confidence: null,
    sourceIds: [],
    assumptions: [],
    missingData: [detail],
    warnings: ["BUSINESS_ENGINE_MISSING : aucun moteur métier MKA.P-MS ne calcule ceci aujourd'hui."],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}
