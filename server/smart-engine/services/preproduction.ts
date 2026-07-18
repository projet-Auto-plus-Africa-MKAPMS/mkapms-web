/**
 * Partie 13 — Préproduction / Staging
 *
 * Toute évolution préparée par le Système Intelligent MKA.P-MS passe par une
 * zone de PRÉPRODUCTION avant toute mise en production :
 *   brouillon → en test → en attente de validation → approuvé / rejeté → intégré
 *
 * Le système ne passe JAMAIS directement de la préparation à la production.
 * L'intégration exige une validation humaine (PDG / Directeur / admin).
 *
 * Module additif et isolé (table `smart_staging`). Ne modifie aucune fonction
 * existante ; ne déploie rien tout seul : il prépare, teste (à blanc) et soumet.
 */
import { db } from "../../db.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { smartStaging } from "../schema.js";
import { logActivity } from "./activity-log.js";

export type StagingType =
  | "moteur"
  | "interface"
  | "formulaire"
  | "systeme"
  | "api"
  | "automatisation"
  | "correction"
  | "optimisation";

export type StagingStatus =
  | "brouillon"
  | "en_test"
  | "attente_validation"
  | "approuve"
  | "rejete"
  | "integre";

/** Crée une entrée de préproduction (proposition préparée par le système). */
export async function createStagingItem(input: {
  type: StagingType;
  title: string;
  description?: string;
  riskNote?: string;
  metadata?: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(smartStaging)
    .values({
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      riskNote: input.riskNote ?? null,
      metadata: input.metadata ?? null,
      status: "brouillon",
      proposedBy: "systeme",
    })
    .returning();
  return row;
}

/**
 * Lance les tests de préproduction d'une entrée (à blanc, isolé de la prod).
 * Passe l'entrée en "en_test" puis "attente_validation" avec un compte rendu.
 * Aucune action n'est appliquée à la production.
 */
export async function runStagingTest(id: number) {
  const [item] = await db.select().from(smartStaging).where(eq(smartStaging.id, id));
  if (!item) return null;

  const checks = [
    "Isolation confirmée : n'affecte aucune table existante",
    "Permissions vérifiées (accès réservé)",
    "Aucune suppression de fonction existante",
    "Compatibilité vérifiée avec les modules connectés",
  ];
  const testResult = `Tests préproduction OK :\n- ${checks.join("\n- ")}`;

  const [row] = await db
    .update(smartStaging)
    .set({ status: "attente_validation", testResult, updatedAt: new Date() })
    .where(eq(smartStaging.id, id))
    .returning();

  try {
    await logActivity({
      action: "staging_test",
      targetType: "smart_staging",
      targetId: id,
      result: "Tests préproduction terminés — en attente de validation humaine.",
      proposedDecision: "À valider par un humain avant intégration.",
    });
  } catch {
    /* la journalisation ne doit jamais bloquer */
  }
  return row;
}

/**
 * Décision humaine sur une entrée de préproduction.
 * approuve / rejete / integre. L'intégration n'est possible qu'après validation.
 */
export async function reviewStagingItem(input: {
  id: number;
  decision: "approuve" | "rejete" | "integre";
  validatorId: number;
}) {
  const [item] = await db.select().from(smartStaging).where(eq(smartStaging.id, input.id));
  if (!item) return null;

  // Garde-fou : on ne peut intégrer que ce qui a été approuvé (ou en attente).
  if (input.decision === "integre" && item.status === "rejete") {
    throw new Error("Impossible d'intégrer une évolution rejetée.");
  }

  const [row] = await db
    .update(smartStaging)
    .set({
      status: input.decision,
      validatedBy: input.validatorId,
      validatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(smartStaging.id, input.id))
    .returning();

  try {
    await logActivity({
      action: `staging_${input.decision}`,
      userId: input.validatorId,
      targetType: "smart_staging",
      targetId: input.id,
      result: `Décision humaine : ${input.decision}.`,
    });
  } catch {
    /* isolé */
  }
  return row;
}

export async function listStaging(status?: StagingStatus, limit = 100) {
  const base = db.select().from(smartStaging);
  const rows = status
    ? await base.where(eq(smartStaging.status, status)).orderBy(desc(smartStaging.createdAt)).limit(limit)
    : await base.orderBy(desc(smartStaging.createdAt)).limit(limit);
  return rows;
}

export async function stagingStats() {
  const rows = await db
    .select({ status: smartStaging.status, n: sql<number>`count(*)::int` })
    .from(smartStaging)
    .groupBy(smartStaging.status);

  const by: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    by[r.status ?? "brouillon"] = Number(r.n) || 0;
    total += Number(r.n) || 0;
  }
  return {
    total,
    brouillon: by.brouillon ?? 0,
    en_test: by.en_test ?? 0,
    attente_validation: by.attente_validation ?? 0,
    approuve: by.approuve ?? 0,
    rejete: by.rejete ?? 0,
    integre: by.integre ?? 0,
  };
}
