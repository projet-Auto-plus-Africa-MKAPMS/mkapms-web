/**
 * Feature 10 / point 54 — Connexion du Système Intelligent au module d'avis.
 *
 * Lit les avis en lecture seule pour détecter les professionnels en difficulté
 * et les tendances (délais, accueil, dégradation, afflux). Ne masque et ne
 * supprime jamais un avis : il constate et alerte.
 *
 * Deux corrections importantes par rapport à la première version :
 *  - la source est `reviews_v2` (le module d'avis réellement alimenté) et non
 *    l'ancienne table `reviews`, qui pouvait ne contenir aucun avis récent ;
 *  - les alertes passent par la déduplication du moteur d'alertes : chaque scan
 *    ne recrée plus la même alerte, qui s'empilait à l'infini.
 */
import { db } from "../../db.js";
import { smartAlerts } from "../schema.js";
import { and, gte, sql, desc } from "drizzle-orm";
import { reviewsV2 } from "../../modules/reviews.js";
import { reputationTrends, trendSignature } from "../../reputation-engine/trends.js";
import { raiseAlert } from "./alert-engine.js";

const JOUR = 24 * 60 * 60 * 1000;

/** Volume minimal avant de signaler un professionnel : 3 avis ne font pas une réputation. */
const MIN_AVIS = 3;

export async function analyzeReviews() {
  let flagged = 0;
  try {
    const depuis = new Date(Date.now() - 30 * JOUR);
    const malNotes = await db
      .select({
        targetType: reviewsV2.targetType,
        targetId: reviewsV2.targetId,
        total: sql<number>`count(*)::int`,
        moyenne: sql<number>`avg(${reviewsV2.ratingGlobal})::float8`,
        negatifs: sql<number>`count(*) filter (where ${reviewsV2.ratingGlobal} <= 2)::int`,
      })
      .from(reviewsV2)
      .where(and(sql`${reviewsV2.status} = 'publie'`, gte(reviewsV2.createdAt, depuis)))
      .groupBy(reviewsV2.targetType, reviewsV2.targetId)
      .having(sql`avg(${reviewsV2.ratingGlobal}) < 3 and count(*) >= ${MIN_AVIS}`)
      .orderBy(sql`avg(${reviewsV2.ratingGlobal}) asc`)
      .limit(20);

    for (const item of malNotes) {
      const moyenne = Math.round(Number(item.moyenne) * 10) / 10;
      const cree = await raiseAlert({
        category: "avis",
        title: `${item.targetType} #${item.targetId} — note moyenne basse (${moyenne}/5)`,
        description: `${item.negatifs} avis négatifs sur ${item.total} avis publiés (30 derniers jours).`,
        level: moyenne < 2 ? "critical" : "warning",
        targetType: item.targetType,
        targetId: item.targetId,
        signature: `avis:note_basse:${item.targetType}:${item.targetId}`,
        lastOccurredAt: new Date(),
      });
      if (cree) flagged += 1;
    }

    for (const t of await reputationTrends()) {
      const cree = await raiseAlert({
        category: "avis",
        title: t.constat,
        description: Object.entries(t.preuve)
          .map(([k, v]) => `${k} : ${v}`)
          .join(" · "),
        level:
          t.severity === "critique" ? "important" : t.severity === "attention" ? "warning" : "info",
        targetType: t.targetType,
        targetId: t.targetId,
        signature: trendSignature(t),
        lastOccurredAt: new Date(),
      });
      if (cree) flagged += 1;
    }

    return { analyzed: true, flaggedCount: flagged };
  } catch {
    // Le module d'avis peut ne pas être migré sur cet environnement.
    return { analyzed: false, flaggedCount: flagged };
  }
}

export async function getReviewAlerts(limit = 20) {
  return db
    .select()
    .from(smartAlerts)
    .where(sql`${smartAlerts.category} = 'avis'`)
    .orderBy(desc(smartAlerts.createdAt))
    .limit(limit);
}
