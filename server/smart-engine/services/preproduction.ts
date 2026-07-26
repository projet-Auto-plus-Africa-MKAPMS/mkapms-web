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
 * Transition de statut — décision humaine (PDG). On ne permet que des
 * transitions cohérentes ; aucune action métier n'est déclenchée ici (les
 * propositions décrivent un travail à faire, elles ne l'exécutent pas).
 */
export async function transitionStaging(
  id: number,
  next: StagingStatus,
  reviewedBy?: number,
) {
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
  return row;
}
