/**
 * Partie 16 — Préproduction / Staging (fait partie du Smart Engine).
 *
 * Les propositions d'évolution générées par le Système Intelligent sont
 * déposées ici au statut `brouillon`. Elles ne sont JAMAIS appliquées seules :
 *
 *   brouillon → (en_test) → a_valider → approuve (PDG) → integre
 *                                     ↘ rejete (PDG)
 *
 * Toute transition sensible (approuver / rejeter / intégrer) est réservée au
 * PDG côté routeur. Ce service ne modifie AUCUNE donnée métier : il ne fait que
 * gérer la file de propositions dans la table isolée `smart_staging`.
 */
import { db } from "../../db.js";
import { desc, eq } from "drizzle-orm";
import { smartStaging } from "../schema.js";
import { createActionTask, validateActionTask } from "./action-tasks.js";

export type StagingType = "optimisation" | "correction" | "evolution";
export type StagingStatus =
  | "brouillon"
  | "en_test"
  | "a_valider"
  | "approuve"
  | "integre"
  | "rejete";

interface CreateStagingInput {
  type: StagingType;
  title: string;
  description?: string;
  riskNote?: string;
  metadata?: Record<string, unknown>;
}

export async function createStagingItem(input: CreateStagingInput) {
  const [row] = await db
    .insert(smartStaging)
    .values({
      type: input.type,
      title: input.title.slice(0, 240),
      description: input.description ?? null,
      riskNote: input.riskNote ?? null,
      metadata: input.metadata ?? null,
      status: "brouillon",
      origin: "evolution_autonome",
    })
    .returning();
  return row;
}

export async function listStaging(limit = 100) {
  return db
    .select()
    .from(smartStaging)
    .orderBy(desc(smartStaging.createdAt))
    .limit(limit);
}

export async function getStagingStats() {
  const rows = await db.select({ status: smartStaging.status }).from(smartStaging);
  const stats = {
    total: rows.length,
    brouillon: 0,
    en_test: 0,
    a_valider: 0,
    approuve: 0,
    integre: 0,
    rejete: 0,
  };
  for (const r of rows) {
    const k = r.status as keyof typeof stats;
    if (k in stats && k !== "total") stats[k] += 1;
  }
  return stats;
}

/**
 * Transition de statut — décision humaine (PDG).
 *
 * Point 69 : approuver une proposition ne la faisait que changer de colonne.
 * L'approbation crée maintenant une tâche du Centre d'Actions, exécutée quand
 * un exécuteur existe, sinon laissée en attente d'intervention humaine avec la
 * raison écrite. Le `metadata.actionType` de la proposition indique l'action à
 * réaliser ; sans lui, la tâche est marquée non automatisable.
 *
 * Constat direction (18/09) : « Marquer intégré » était accessible dès
 * l'approbation, sans aucun lien avec le résultat réel de la tâche exécutée —
 * 667 propositions étaient passées « intégré » alors que la quasi-totalité
 * des corrections de boutons n'ont ni exécuteur ni code réellement changé
 * (restent honnêtement « manuel_requis » côté Centre d'Actions). Rien
 * n'empêchait de cliquer « intégré » quand même : le statut mentait sur ce qui
 * a été fait. Corrigé : le résultat réel de l'exécution est mémorisé sur la
 * proposition, et passer à « intégré » est refusé tant qu'il n'est pas un
 * vrai succès (« termine »).
 */
export async function transitionStaging(
  id: number,
  next: StagingStatus,
  reviewedBy?: number,
) {
  if (next === "integre") {
    const [current] = await db.select().from(smartStaging).where(eq(smartStaging.id, id)).limit(1);
    const meta = current?.metadata ?? {};
    const executionStatus = typeof meta.executionStatus === "string" ? meta.executionStatus : null;
    if (executionStatus !== "termine") {
      const detail =
        typeof meta.executionDetail === "string"
          ? meta.executionDetail
          : "Aucune exécution automatique n'a encore réussi pour cette proposition.";
      throw new Error(
        `Impossible de marquer « intégré » : ${detail} Corrigez réellement le code (ou l'action) puis relancez l'exécution avant de clore cette proposition — sinon rejetez-la.`,
      );
    }
  }

  const [row] = await db
    .update(smartStaging)
    .set({
      status: next,
      reviewedBy: reviewedBy ?? null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(smartStaging.id, id))
    .returning();

  if (!row || next !== "approuve" || !reviewedBy) return row;

  const meta = row.metadata ?? {};
  const actionType = typeof meta.actionType === "string" ? meta.actionType : `manuel:${row.type}`;
  const params =
    typeof meta.params === "object" && meta.params !== null
      ? (meta.params as Record<string, unknown>)
      : {};
  const countryCode = typeof meta.countryCode === "string" ? meta.countryCode : null;
  const task = await createActionTask({
    source: "staging",
    sourceId: row.id,
    actionType,
    title: row.title,
    description: row.description ?? undefined,
    params,
    riskLevel: row.riskNote ? 3 : 2,
    countryCode,
    requestedBy: reviewedBy,
  });
  const outcome = await validateActionTask(task.id, reviewedBy);
  await db
    .update(smartStaging)
    .set({
      metadata: { ...meta, executionStatus: outcome.status, executionDetail: outcome.detail },
      updatedAt: new Date(),
    })
    .where(eq(smartStaging.id, row.id));
  return { ...row, metadata: { ...meta, executionStatus: outcome.status, executionDetail: outcome.detail } };
}
