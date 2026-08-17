/**
 * Point 61 — connaissance ≠ publication.
 *
 * Une découverte est enregistrée immédiatement (on ne perd pas l'information),
 * mais elle n'est jamais publiée par le système. Le PDG répond
 * OUI / NON / PLUS TARD / ANALYSER DAVANTAGE, et seul « oui » crée une action
 * réelle via le cycle de vie du point 69 — donc traçable, exécutée ou marquée
 * « intervention humaine », jamais silencieuse.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { akeDiscoveries } from "./schema.js";
import { createActionTask, validateActionTask } from "../smart-engine/services/action-tasks.js";

export const AKE_CLASSIFICATIONS: Record<string, string> = {
  critique: "Critique",
  important: "Important",
  opportunite: "Opportunité",
  information: "Information",
};

export const AKE_DECISIONS: Record<string, string> = {
  attente: "En attente de décision",
  oui: "Oui — intégrer",
  non: "Non",
  plus_tard: "Plus tard",
  analyser: "Analyser davantage",
};

export interface RecordDiscoveryInput {
  title: string;
  domain: string;
  detail?: string;
  interest?: string;
  relatedService?: string;
  countryCode?: string | null;
  sourceCode?: string;
  sourceRef?: string;
  classification?: string;
  evidence?: Record<string, unknown>;
  nodeId?: number;
}

/**
 * Enregistre une découverte. La signature empêche qu'une même observation
 * revienne polluer la file de décision à chaque analyse.
 */
export async function recordDiscovery(input: RecordDiscoveryInput) {
  const signature = [
    input.domain,
    input.title.trim().toLowerCase(),
    input.countryCode ?? "*",
  ]
    .join("|")
    .slice(0, 400);

  const [existing] = await db
    .select({ id: akeDiscoveries.id, decision: akeDiscoveries.decision })
    .from(akeDiscoveries)
    .where(eq(akeDiscoveries.signature, signature))
    .limit(1);

  if (existing) {
    // Une découverte déjà tranchée n'est pas ressuscitée ; une découverte en
    // attente est simplement mise à jour avec les derniers éléments constatés.
    if (existing.decision === "attente" || existing.decision === "analyser") {
      await db
        .update(akeDiscoveries)
        .set({
          detail: input.detail ?? undefined,
          interest: input.interest ?? undefined,
          evidence: input.evidence ?? undefined,
          classification: input.classification ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(akeDiscoveries.id, existing.id));
    }
    return { id: existing.id, created: false };
  }

  const [row] = await db
    .insert(akeDiscoveries)
    .values({
      title: input.title,
      domain: input.domain,
      detail: input.detail ?? null,
      interest: input.interest ?? null,
      relatedService: input.relatedService ?? null,
      countryCode: input.countryCode ?? null,
      sourceCode: input.sourceCode ?? null,
      sourceRef: input.sourceRef ?? null,
      classification: input.classification ?? "information",
      evidence: input.evidence ?? {},
      nodeId: input.nodeId ?? null,
      signature,
    })
    .returning({ id: akeDiscoveries.id });
  return { id: row.id, created: true };
}

export async function listDiscoveries(input: {
  decision?: string;
  classification?: string;
  domain?: string;
  limit?: number;
}) {
  const conds = [];
  if (input.decision) conds.push(eq(akeDiscoveries.decision, input.decision));
  if (input.classification) conds.push(eq(akeDiscoveries.classification, input.classification));
  if (input.domain) conds.push(eq(akeDiscoveries.domain, input.domain));

  return db
    .select()
    .from(akeDiscoveries)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(
      sql`case ${akeDiscoveries.classification}
            when 'critique' then 0 when 'important' then 1
            when 'opportunite' then 2 else 3 end`,
      desc(akeDiscoveries.updatedAt),
    )
    .limit(input.limit ?? 60);
}

/**
 * Décision du PDG. « Oui » ne se contente pas de changer un mot : il crée une
 * tâche d'action et la valide, donc la suite est visible dans le Centre
 * d'Actions avec son résultat ou son échec.
 */
export async function decideDiscovery(input: {
  id: number;
  decision: "oui" | "non" | "plus_tard" | "analyser";
  note?: string;
  actorId: number;
}) {
  const [row] = await db
    .select()
    .from(akeDiscoveries)
    .where(eq(akeDiscoveries.id, input.id))
    .limit(1);
  if (!row) return { ok: false as const, raison: "Découverte introuvable." };

  const now = new Date();
  let actionTaskId: number | null = row.actionTaskId ?? null;
  let statutAction: string | null = null;

  if (input.decision === "oui" && actionTaskId === null) {
    const task = await createActionTask({
      source: "connaissance",
      sourceId: row.id,
      actionType: `manuel:integration_connaissance_${row.domain}`,
      title: `Intégrer : ${row.title}`,
      description: row.interest ?? row.detail ?? undefined,
      params: {
        domaine: row.domain,
        service: row.relatedService ?? null,
        source: row.sourceCode ?? null,
        reference: row.sourceRef ?? null,
      },
      riskLevel: 2,
      countryCode: row.countryCode,
      requestedBy: input.actorId,
    });
    actionTaskId = task.id;
    const run = await validateActionTask(task.id, input.actorId);
    statutAction = run.status;
  }

  await db
    .update(akeDiscoveries)
    .set({
      decision: input.decision,
      decisionNote: input.note ?? null,
      decidedBy: input.actorId,
      decidedAt: now,
      actionTaskId,
      updatedAt: now,
    })
    .where(eq(akeDiscoveries.id, input.id));

  return { ok: true as const, actionTaskId, statutAction };
}

/** Compteurs de la file de décision, par classification et par décision. */
export async function discoveryStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      attente: sql<number>`count(*) filter (where ${akeDiscoveries.decision} = 'attente')::int`,
      analyser: sql<number>`count(*) filter (where ${akeDiscoveries.decision} = 'analyser')::int`,
      plusTard: sql<number>`count(*) filter (where ${akeDiscoveries.decision} = 'plus_tard')::int`,
      integrees: sql<number>`count(*) filter (where ${akeDiscoveries.decision} = 'oui')::int`,
      refusees: sql<number>`count(*) filter (where ${akeDiscoveries.decision} = 'non')::int`,
      critiques: sql<number>`count(*) filter (where ${akeDiscoveries.classification} = 'critique' and ${akeDiscoveries.decision} = 'attente')::int`,
      importantes: sql<number>`count(*) filter (where ${akeDiscoveries.classification} = 'important' and ${akeDiscoveries.decision} = 'attente')::int`,
      opportunites: sql<number>`count(*) filter (where ${akeDiscoveries.classification} = 'opportunite' and ${akeDiscoveries.decision} = 'attente')::int`,
    })
    .from(akeDiscoveries);
  return {
    total: row?.total ?? 0,
    attente: row?.attente ?? 0,
    analyser: row?.analyser ?? 0,
    plusTard: row?.plusTard ?? 0,
    integrees: row?.integrees ?? 0,
    refusees: row?.refusees ?? 0,
    critiques: row?.critiques ?? 0,
    importantes: row?.importantes ?? 0,
    opportunites: row?.opportunites ?? 0,
  };
}

/** Découvertes rattachées à des nœuds donnés (pour l'écran de mémoire). */
export async function discoveriesForNodes(nodeIds: number[]) {
  if (nodeIds.length === 0) return [];
  return db
    .select()
    .from(akeDiscoveries)
    .where(inArray(akeDiscoveries.nodeId, nodeIds))
    .limit(100);
}
