/**
 * Partie 8 — Auto-optimisation
 *
 * Le Smart Engine analyse la plateforme et PROPOSE des optimisations :
 * vitesse de recherche, classement des annonces, qualité des résultats,
 * mots-clés, filtres, suggestions.
 *
 * RÈGLE ABSOLUE : il ne modifie JAMAIS une règle métier sans validation.
 * Chaque proposition reste "proposed" jusqu'à ce que le PDG l'applique ou la
 * rejette. Le module est en lecture seule sur les données de la plateforme :
 * il ne fait qu'analyser et suggérer. Additif, isolé, jamais bloquant.
 */
import { db } from "../../db.js";
import { smartOptimizations, smartSearchLogs, smartKbEntries } from "../schema.js";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export const OPTIMIZATION_CATEGORIES = [
  "vitesse_recherche",
  "classement_annonces",
  "qualite_resultats",
  "mots_cles",
  "filtres",
  "suggestions",
] as const;
export type OptimizationCategory = (typeof OPTIMIZATION_CATEGORIES)[number];

interface ProposeInput {
  category: OptimizationCategory;
  title: string;
  detail?: string;
  recommendation?: string;
  impact?: "faible" | "moyen" | "eleve";
  evidence?: Record<string, unknown>;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Enregistre une proposition d'optimisation (idempotent par signature).
 * Si une proposition identique existe déjà et n'a pas été traitée, on met
 * simplement à jour ses données factuelles — on ne recrée pas de doublon.
 */
export async function proposeOptimization(input: ProposeInput) {
  const signature = [input.category, normalize(input.title)].join("|").slice(0, 400);

  const [existing] = await db
    .select()
    .from(smartOptimizations)
    .where(eq(smartOptimizations.signature, signature))
    .limit(1);

  if (existing) {
    // On ne réanime pas une proposition déjà appliquée/rejetée par le PDG.
    if (existing.status === "proposed") {
      await db
        .update(smartOptimizations)
        .set({
          detail: input.detail ?? existing.detail,
          recommendation: input.recommendation ?? existing.recommendation,
          impact: input.impact ?? existing.impact,
          evidence: input.evidence ?? existing.evidence,
          updatedAt: new Date(),
        })
        .where(eq(smartOptimizations.id, existing.id));
    }
    return existing;
  }

  const [row] = await db
    .insert(smartOptimizations)
    .values({
      category: input.category,
      title: input.title,
      detail: input.detail ?? null,
      recommendation: input.recommendation ?? null,
      impact: input.impact ?? "moyen",
      evidence: input.evidence ?? null,
      signature,
    })
    .returning();
  return row;
}

/**
 * Analyse les données du Smart Engine (recherches, base de connaissances) et
 * génère des propositions d'optimisation concrètes. Rejoué à la demande du PDG.
 */
export async function generateOptimizations() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let created = 0;
  const propose = async (i: ProposeInput) => {
    const before = await db
      .select({ id: smartOptimizations.id })
      .from(smartOptimizations)
      .where(eq(smartOptimizations.signature, [i.category, normalize(i.title)].join("|").slice(0, 400)))
      .limit(1);
    await proposeOptimization(i);
    if (before.length === 0) created += 1;
  };

  // 1. Recherches sans résultat les plus fréquentes → mots-clés / filtres manquants
  const failed = await db
    .select({
      query: smartSearchLogs.query,
      n: sql<number>`count(*)::int`,
    })
    .from(smartSearchLogs)
    .where(and(eq(smartSearchLogs.hasResults, false), gte(smartSearchLogs.createdAt, since)))
    .groupBy(smartSearchLogs.query)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  for (const f of failed) {
    const q = (f.query ?? "").trim();
    if (q.length < 2 || f.n < 2) continue;
    await propose({
      category: "mots_cles",
      title: `Recherche sans résultat récurrente : « ${q} »`,
      detail: `Les utilisateurs ont cherché « ${q} » ${f.n} fois sans aucun résultat sur les 30 derniers jours.`,
      recommendation: `Ajouter des synonymes/mots-clés pour « ${q} », ou créer une redirection/annonce correspondante afin de ne plus renvoyer une page vide.`,
      impact: f.n >= 5 ? "eleve" : "moyen",
      evidence: { query: q, occurrences: f.n, periode: "30j" },
    });
  }

  // 2. Volume global de recherches infructueuses → qualité des résultats
  const [failStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      sansResultat: sql<number>`count(*) filter (where ${smartSearchLogs.hasResults} = false)::int`,
    })
    .from(smartSearchLogs)
    .where(gte(smartSearchLogs.createdAt, since));

  if (failStats && failStats.total >= 20) {
    const ratio = failStats.sansResultat / failStats.total;
    if (ratio >= 0.3) {
      await propose({
        category: "qualite_resultats",
        title: "Taux élevé de recherches sans résultat",
        detail: `${Math.round(ratio * 100)}% des recherches (${failStats.sansResultat}/${failStats.total}) ne renvoient aucun résultat sur 30 jours.`,
        recommendation: "Élargir automatiquement le rayon géographique quand 0 résultat, proposer des annonces proches, et suggérer des filtres alternatifs.",
        impact: "eleve",
        evidence: { ratio: Math.round(ratio * 100), sansResultat: failStats.sansResultat, total: failStats.total },
      });
    }
  }

  // 3. Mots-clés populaires confirmés dans la base de connaissances → suggestions
  const topKeywords = await db
    .select({ value: smartKbEntries.value, obs: smartKbEntries.observations })
    .from(smartKbEntries)
    .where(and(eq(smartKbEntries.domain, "mot_cle"), gte(smartKbEntries.observations, 5)))
    .orderBy(desc(smartKbEntries.observations))
    .limit(8);

  if (topKeywords.length >= 3) {
    const list = topKeywords.map((k) => k.value).join(", ");
    await propose({
      category: "suggestions",
      title: "Suggestions de recherche basées sur les tendances",
      detail: `Mots-clés les plus recherchés : ${list}.`,
      recommendation: "Afficher ces termes en suggestions rapides sous la barre de recherche pour accélérer l'accès aux annonces les plus demandées.",
      impact: "moyen",
      evidence: { topKeywords: topKeywords.map((k) => ({ terme: k.value, observations: k.obs })) },
    });
  }

  // 4. Marques les plus recherchées → classement / mise en avant
  const topMarques = await db
    .select({ value: smartKbEntries.value, obs: smartKbEntries.observations })
    .from(smartKbEntries)
    .where(and(eq(smartKbEntries.domain, "vehicule"), eq(smartKbEntries.type, "marque"), gte(smartKbEntries.observations, 3)))
    .orderBy(desc(smartKbEntries.observations))
    .limit(6);

  if (topMarques.length >= 2) {
    await propose({
      category: "classement_annonces",
      title: "Mettre en avant les marques les plus demandées",
      detail: `Marques les plus recherchées : ${topMarques.map((m) => m.value).join(", ")}.`,
      recommendation: "Favoriser (sans les imposer) les annonces de ces marques dans le classement par défaut de la page d'accueil et des univers concernés.",
      impact: "moyen",
      evidence: { topMarques: topMarques.map((m) => ({ marque: m.value, observations: m.obs })) },
    });
  }

  return { created };
}

export async function listOptimizations(category?: string, status?: string, limit = 100) {
  const conditions = [];
  if (category) conditions.push(eq(smartOptimizations.category, category));
  if (status) conditions.push(eq(smartOptimizations.status, status as "proposed" | "applied" | "rejected"));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(smartOptimizations)
    .where(where)
    .orderBy(desc(smartOptimizations.updatedAt))
    .limit(limit);
}

export async function optimizationStats() {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      proposed: sql<number>`count(*) filter (where ${smartOptimizations.status} = 'proposed')::int`,
      applied: sql<number>`count(*) filter (where ${smartOptimizations.status} = 'applied')::int`,
      rejected: sql<number>`count(*) filter (where ${smartOptimizations.status} = 'rejected')::int`,
    })
    .from(smartOptimizations);
  return totals;
}

/**
 * Le PDG valide (applique) ou rejette une proposition. C'est le seul moment où
 * une optimisation change d'état : le système ne s'applique jamais lui-même.
 */
export async function reviewOptimization(id: number, decision: "applied" | "rejected", reviewedBy?: number) {
  await db
    .update(smartOptimizations)
    .set({ status: decision, reviewedBy: reviewedBy ?? null, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(smartOptimizations.id, id));
  return { ok: true };
}
