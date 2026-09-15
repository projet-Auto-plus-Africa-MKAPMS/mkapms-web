/**
 * Payout Engine — contrat (LOT 5 du Plan Maître Fournisseurs, §32 PAYOUT
 * ENGINE). Décide QUAND et COMMENT l'argent bloqué au Ledger (`wallets`,
 * §29 INTERNAL LEDGER) devient disponible pour un fournisseur ou un
 * transporteur — jamais QUI encaisse (ça, c'est le Payment Orchestrator,
 * §28) ni le paiement du client lui-même (Payment Engine).
 *
 * Aucune donnée financière n'est jamais fabriquée : sans politique
 * explicite, la politique par défaut honnête (100 % à la livraison,
 * validation humaine) s'applique — jamais un versement immédiat inventé.
 */

/** À qui s'applique une politique de versement. */
export const PAYOUT_TARGET_TYPES = ["supplier", "carrier"] as const;
export type PayoutTargetType = (typeof PAYOUT_TARGET_TYPES)[number];

/**
 * Déclencheurs de versement (plan §32) : "Paiement immédiat / enlèvement /
 * livraison / documents / par étape".
 */
export const PAYOUT_TRIGGERS = [
  "immediate",
  "enlevement",
  "livraison",
  "documents",
  "etape",
] as const;
export type PayoutTrigger = (typeof PAYOUT_TRIGGERS)[number];

export interface PayoutStage {
  trigger: PayoutTrigger;
  /** Pourcentage du montant net versé à ce déclencheur. La somme des étapes d'une politique doit faire 100. */
  pct: number;
}

export interface PayoutSplitPreset {
  code: string;
  label: string;
  stages: PayoutStage[];
}

/** Préréglages nommés par le plan (§32) : « 50/50 possible, 30/70 possible, 100 % possible ». */
export const PAYOUT_SPLIT_PRESETS: PayoutSplitPreset[] = [
  {
    code: "100_immediate",
    label: "100 % au paiement immédiat",
    stages: [{ trigger: "immediate", pct: 100 }],
  },
  {
    code: "100_enlevement",
    label: "100 % à l'enlèvement",
    stages: [{ trigger: "enlevement", pct: 100 }],
  },
  {
    code: "100_livraison",
    label: "100 % à la livraison",
    stages: [{ trigger: "livraison", pct: 100 }],
  },
  {
    code: "100_documents",
    label: "100 % à réception des documents",
    stages: [{ trigger: "documents", pct: 100 }],
  },
  {
    code: "50_50_enlevement_livraison",
    label: "50 % à l'enlèvement / 50 % à la livraison",
    stages: [
      { trigger: "enlevement", pct: 50 },
      { trigger: "livraison", pct: 50 },
    ],
  },
  {
    code: "30_70_enlevement_livraison",
    label: "30 % à l'enlèvement / 70 % à la livraison",
    stages: [
      { trigger: "enlevement", pct: 30 },
      { trigger: "livraison", pct: 70 },
    ],
  },
] as const;

/** Politique honnête appliquée quand rien n'a été configuré : jamais de versement immédiat par défaut. */
export const DEFAULT_PAYOUT_SPLIT_CODE = "100_livraison";

export function findSplitPreset(code: string): PayoutSplitPreset | null {
  return PAYOUT_SPLIT_PRESETS.find((p) => p.code === code) ?? null;
}

export function validateStages(stages: PayoutStage[]): string | null {
  if (stages.length === 0) return "Une politique doit comporter au moins une étape.";
  const total = stages.reduce((s, st) => s + st.pct, 0);
  if (Math.round(total * 100) !== 10000) return `La somme des étapes doit faire 100 % (obtenu ${total}%).`;
  for (const s of stages) {
    if (!PAYOUT_TRIGGERS.includes(s.trigger)) return `Déclencheur inconnu : ${s.trigger}`;
    if (s.pct <= 0 || s.pct > 100) return `Pourcentage invalide pour ${s.trigger} : ${s.pct}`;
  }
  return null;
}

/** Origine d'un versement — jamais un moteur métier qui gère lui-même l'argent. */
export const PAYOUT_SOURCE_TYPES = ["vehicle_sale", "logistics_leg"] as const;
export type PayoutSourceType = (typeof PAYOUT_SOURCE_TYPES)[number];

export const PAYOUT_SCHEDULE_STATUSES = ["pending", "partial", "completed", "blocked"] as const;
export type PayoutScheduleStatus = (typeof PAYOUT_SCHEDULE_STATUSES)[number];

export const PAYOUT_STAGE_STATUSES = ["pending", "eligible", "validated", "released"] as const;
export type PayoutStageStatus = (typeof PAYOUT_STAGE_STATUSES)[number];

export interface PayoutStageState {
  trigger: PayoutTrigger;
  pct: number;
  amount: number;
  status: PayoutStageStatus;
  eligibleAt?: string;
  validatedAt?: string;
  validatedBy?: number | null;
  releasedAt?: string;
}

export const PAYOUT_ENGINE_META = {
  name: "payout_engine",
  label: "Payout Engine",
  version: "0.1.0",
  planReference: "Plan Maître Fournisseurs §32 (LOT 5)",
} as const;

/** Événements typés publiés par ce moteur (voir server/event-bus/catalog.ts). */
export type PayoutEngineEvent =
  | { type: "payout.eligible"; payload: { scheduleId: number; targetType: PayoutTargetType; trigger: PayoutTrigger; amount: number; currency: string } }
  | { type: "payout.released"; payload: { scheduleId: number; targetType: PayoutTargetType; trigger: PayoutTrigger; amount: number; currency: string } };
