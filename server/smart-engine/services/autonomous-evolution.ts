/**
 * Partie 16 — Évolution autonome (sous validation humaine)
 *
 * Le Système Intelligent observe la plateforme (qualité, alertes,
 * optimisations) et **génère automatiquement des propositions d'évolution**.
 * Ces propositions sont déposées en PRÉPRODUCTION (Partie 13) au statut
 * `brouillon` : elles ne sont JAMAIS appliquées seules. Elles suivent ensuite
 * le cycle test → attente de validation → approbation humaine → intégration.
 *
 * Le système ne prend aucune décision définitive : il analyse, propose et
 * prépare ; l'humain valide.
 *
 * Module additif : il n'écrit que dans `smart_staging` (Partie 13) et ne
 * modifie aucune donnée métier.
 */
import { db } from "../../db.js";
import { desc, inArray } from "drizzle-orm";
import { smartQualityAudits, smartStaging, smartAlerts } from "../schema.js";
import { createStagingItem, type StagingType } from "./preproduction.js";
import { logActivity } from "./activity-log.js";

interface ProposalDraft {
  type: StagingType;
  title: string;
  description: string;
  riskNote?: string;
}

/**
 * Analyse les données du Smart Engine et déduit des propositions d'évolution.
 * Aucune écriture ici : fonction pure de suggestion.
 */
async function buildProposals(): Promise<ProposalDraft[]> {
  const proposals: ProposalDraft[] = [];

  // 1. À partir des derniers audits qualité faibles/moyens.
  const audits = await db
    .select()
    .from(smartQualityAudits)
    .orderBy(desc(smartQualityAudits.createdAt))
    .limit(24);

  // On garde le dernier audit par catégorie.
  const seenCat = new Set<string>();
  for (const a of audits) {
    if (seenCat.has(a.category)) continue;
    seenCat.add(a.category);
    if (a.status === "bon") continue;
    proposals.push({
      type: "optimisation",
      title: `Améliorer la qualité : ${a.category} (score ${a.score}/100)`,
      description:
        a.recommendation ??
        `Le domaine « ${a.category} » a un score de ${a.score}/100. ${a.headline}`,
      riskNote: "Amélioration additive proposée automatiquement — à valider.",
    });
  }

  // 2. À partir des alertes non résolues importantes/critiques.
  const alerts = await db
    .select()
    .from(smartAlerts)
    .where(inArray(smartAlerts.status, ["open", "acknowledged"]))
    .orderBy(desc(smartAlerts.createdAt))
    .limit(20);

  for (const al of alerts) {
    if (al.severity !== "important" && al.severity !== "critical") continue;
    proposals.push({
      type: "correction",
      title: `Traiter l'alerte : ${al.title}`,
      description: al.description ?? "Alerte importante détectée par le Système Intelligent.",
      riskNote: "Correction proposée automatiquement — à valider avant application.",
    });
  }

  return proposals;
}

/**
 * Génère les propositions et les dépose en préproduction (statut brouillon).
 * Évite les doublons de titre avec les items déjà en cours (non intégrés).
 */
export async function generateEvolutionProposals() {
  const drafts = await buildProposals();

  // Titres déjà présents en préproduction (hors rejetés/intégrés) → anti-doublon.
  const existing = await db
    .select({ title: smartStaging.title, status: smartStaging.status })
    .from(smartStaging)
    .orderBy(desc(smartStaging.createdAt))
    .limit(300);
  const active = new Set(
    existing
      .filter((e) => e.status !== "rejete" && e.status !== "integre")
      .map((e) => e.title),
  );

  let created = 0;
  for (const d of drafts) {
    if (active.has(d.title)) continue;
    await createStagingItem({
      type: d.type,
      title: d.title,
      description: d.description,
      riskNote: d.riskNote,
      metadata: { origin: "evolution_autonome" },
    });
    created += 1;
  }

  try {
    await logActivity({
      action: "evolution_autonome",
      result: `${created} proposition(s) d'évolution déposée(s) en préproduction (en attente de validation).`,
      proposedDecision: "À tester puis valider par un humain.",
    });
  } catch {
    /* isolé */
  }

  return { analysed: drafts.length, created };
}
