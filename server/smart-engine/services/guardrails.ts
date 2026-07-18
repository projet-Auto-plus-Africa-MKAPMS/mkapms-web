/**
 * Partie 15 — Règle finale / Garde-fous
 *
 * La charte finale du Système Intelligent MKA.P-MS :
 * le système analyse, propose, prépare et signale — mais **n'exécute jamais
 * seul** une action sensible. Toute action protégée est mise en file d'attente
 * et n'est exécutée qu'**après validation humaine** (PDG / Directeur / admin).
 *
 * Module additif et isolé (table `smart_action_approvals`).
 */
import { db } from "../../db.js";
import { desc, eq, sql } from "drizzle-orm";
import { smartActionApprovals } from "../schema.js";
import { logActivity } from "./activity-log.js";

export type RiskLevel = "faible" | "moyen" | "eleve" | "critique";
export type ApprovalStatus = "en_attente" | "approuve" | "rejete" | "execute";

/**
 * Actions que le système ne peut JAMAIS exécuter seul, sans validation humaine.
 * (Liste immuable — la « règle finale ».)
 */
export const PROTECTED_ACTIONS: { action: string; label: string; risk: RiskLevel }[] = [
  { action: "supprimer_compte", label: "Supprimer un compte", risk: "critique" },
  { action: "supprimer_annonce", label: "Supprimer une annonce sensible", risk: "eleve" },
  { action: "modifier_prix", label: "Modifier un prix", risk: "eleve" },
  { action: "modifier_abonnement", label: "Modifier un abonnement", risk: "eleve" },
  { action: "modifier_contrat", label: "Modifier un contrat", risk: "critique" },
  { action: "decision_financiere", label: "Prendre une décision financière importante", risk: "critique" },
  { action: "deployer_production", label: "Déployer directement en production", risk: "critique" },
];

const PROTECTED_SET = new Set(PROTECTED_ACTIONS.map((a) => a.action));

/** Retourne true si l'action exige une validation humaine avant exécution. */
export function requiresHumanValidation(action: string): boolean {
  return PROTECTED_SET.has(action);
}

/** La charte finale, exposée pour affichage (lecture seule). */
export function getGuardrailsPolicy() {
  return {
    principle:
      "Le Système Intelligent assiste, améliore, détecte, automatise les tâches répétitives, protège les données et prépare les évolutions — mais ne prend jamais de décision importante seul.",
    canDo: [
      "Analyser la plateforme et l'usage (anonyme, lecture seule)",
      "Proposer des améliorations et préparer des évolutions",
      "Signaler les anomalies (alertes 🟢🟡🟠🔴)",
      "Automatiser les tâches répétitives non sensibles",
      "Soumettre toute action sensible à validation humaine",
    ],
    neverAlone: PROTECTED_ACTIONS.map((a) => a.label),
    finalControl: "Le PDG, le Directeur et les administrateurs conservent toujours le contrôle final.",
  };
}

/** Met une action sensible en file d'attente pour validation humaine. */
export async function requestApproval(input: {
  action: string;
  targetType?: string;
  targetId?: number;
  reason?: string;
  riskLevel?: RiskLevel;
  metadata?: Record<string, unknown>;
}) {
  const preset = PROTECTED_ACTIONS.find((a) => a.action === input.action);
  const [row] = await db
    .insert(smartActionApprovals)
    .values({
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      reason: input.reason ?? null,
      riskLevel: input.riskLevel ?? preset?.risk ?? "moyen",
      status: "en_attente",
      requestedBy: "systeme",
      metadata: input.metadata ?? null,
    })
    .returning();

  try {
    await logActivity({
      action: "approval_requested",
      targetType: "smart_action_approvals",
      targetId: row?.id,
      result: `Demande de validation : ${input.action}.`,
      proposedDecision: "En attente de validation humaine.",
    });
  } catch {
    /* isolé */
  }
  return row;
}

/**
 * Décision humaine sur une demande.
 * - approuve / rejete : décision.
 * - execute : marque l'action comme exécutée (uniquement après approbation).
 */
export async function decideApproval(input: {
  id: number;
  decision: "approuve" | "rejete" | "execute";
  deciderId: number;
}) {
  const [item] = await db
    .select()
    .from(smartActionApprovals)
    .where(eq(smartActionApprovals.id, input.id));
  if (!item) return null;

  // Garde-fou : on ne peut « exécuter » qu'une action préalablement approuvée.
  if (input.decision === "execute" && item.status !== "approuve") {
    throw new Error("Une action ne peut être exécutée qu'après approbation humaine.");
  }

  const [row] = await db
    .update(smartActionApprovals)
    .set({
      status: input.decision,
      decidedBy: input.deciderId,
      decidedAt: new Date(),
    })
    .where(eq(smartActionApprovals.id, input.id))
    .returning();

  try {
    await logActivity({
      action: `approval_${input.decision}`,
      userId: input.deciderId,
      targetType: "smart_action_approvals",
      targetId: input.id,
      result: `Décision humaine : ${input.decision}.`,
    });
  } catch {
    /* isolé */
  }
  return row;
}

export async function listApprovals(status?: ApprovalStatus, limit = 100) {
  const base = db.select().from(smartActionApprovals);
  return status
    ? await base
        .where(eq(smartActionApprovals.status, status))
        .orderBy(desc(smartActionApprovals.createdAt))
        .limit(limit)
    : await base.orderBy(desc(smartActionApprovals.createdAt)).limit(limit);
}

export async function approvalStats() {
  const rows = await db
    .select({ status: smartActionApprovals.status, n: sql<number>`count(*)::int` })
    .from(smartActionApprovals)
    .groupBy(smartActionApprovals.status);
  const by: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    by[r.status ?? "en_attente"] = Number(r.n) || 0;
    total += Number(r.n) || 0;
  }
  return {
    total,
    en_attente: by.en_attente ?? 0,
    approuve: by.approuve ?? 0,
    rejete: by.rejete ?? 0,
    execute: by.execute ?? 0,
  };
}
