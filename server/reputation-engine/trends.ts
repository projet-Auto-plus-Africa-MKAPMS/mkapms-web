/**
 * Point 54 — tendances de réputation, remontées au Système Intelligent.
 *
 * Le but n'est pas d'afficher une note mais d'expliquer POURQUOI elle bouge :
 * dégradation installée sur plusieurs semaines, motif de plainte récurrent,
 * afflux inhabituel d'avis. Aucun constat n'est produit sans un volume minimal :
 * une seule mauvaise expérience n'est pas une tendance, et un professionnel ne
 * doit pas être signalé à la direction sur un avis isolé.
 *
 * Ce module ne modifie ni ne masque aucun avis : il constate.
 */
import { and, gte, lt, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewsV2 } from "../modules/reviews.js";

/** Volume minimal pour qu'une évolution soit considérée comme une tendance. */
const MIN_VOLUME_PERIODE = 3;

export type TrendKind =
  | "degradation"
  | "amelioration"
  | "motif_recurrent"
  | "afflux_inhabituel";

export interface ReputationTrend {
  kind: TrendKind;
  targetType: string;
  targetId: number;
  /** Phrase directement affichable, sans reformulation. */
  constat: string;
  /** Chiffres sur lesquels le constat repose, pour pouvoir le contester. */
  preuve: Record<string, number>;
  severity: "info" | "attention" | "critique";
}

interface PeriodRow {
  targetType: string;
  targetId: number;
  total: number;
  moyenne: number;
}

async function periodStats(from: Date, to: Date): Promise<PeriodRow[]> {
  const rows = await db
    .select({
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      total: sql<number>`count(*)::int`,
      moyenne: sql<number>`avg(${reviewsV2.ratingGlobal})::float8`,
    })
    .from(reviewsV2)
    .where(
      and(
        sql`${reviewsV2.status} = 'publie'`,
        gte(reviewsV2.createdAt, from),
        lt(reviewsV2.createdAt, to),
      ),
    )
    .groupBy(reviewsV2.targetType, reviewsV2.targetId);

  return rows.map((r) => ({
    targetType: r.targetType,
    targetId: r.targetId,
    total: Number(r.total),
    moyenne: Number(r.moyenne),
  }));
}

/** Motifs de plainte cherchés dans les commentaires, par thème métier. */
const MOTIFS: { theme: string; mots: string[] }[] = [
  { theme: "délais", mots: ["delai", "délai", "retard", "attente", "trop long", "jamais rappel"] },
  { theme: "accueil", mots: ["accueil", "malpoli", "impoli", "desagreable", "désagréable", "aimable"] },
  { theme: "prix", mots: ["prix", "cher", "facture", "supplement", "supplément", "devis non respect"] },
  { theme: "qualité de la réparation", mots: ["mal repare", "mal réparé", "revenu en panne", "meme probleme", "même problème"] },
];

function cle(t: ReputationTrend): string {
  return `${t.kind}:${t.targetType}:${t.targetId}`;
}

/**
 * Compare les 4 dernières semaines aux 4 précédentes et relève les motifs
 * récurrents. Renvoie des constats, jamais des décisions.
 */
export async function reputationTrends(): Promise<ReputationTrend[]> {
  const now = Date.now();
  const semaine = 7 * 24 * 60 * 60 * 1000;
  const debutRecent = new Date(now - 4 * semaine);
  const debutPrecedent = new Date(now - 8 * semaine);

  const [recent, precedent] = await Promise.all([
    periodStats(debutRecent, new Date(now)),
    periodStats(debutPrecedent, debutRecent),
  ]);

  const precedentParCible = new Map(
    precedent.map((p) => [`${p.targetType}:${p.targetId}`, p]),
  );
  const trends: ReputationTrend[] = [];

  for (const r of recent) {
    const p = precedentParCible.get(`${r.targetType}:${r.targetId}`);
    if (r.total < MIN_VOLUME_PERIODE) continue;

    if (p && p.total >= MIN_VOLUME_PERIODE) {
      const ecart = r.moyenne - p.moyenne;
      if (ecart <= -0.7) {
        trends.push({
          kind: "degradation",
          targetType: r.targetType,
          targetId: r.targetId,
          constat: `Les avis se dégradent : ${r.moyenne.toFixed(1)}/5 sur les 4 dernières semaines contre ${p.moyenne.toFixed(1)}/5 sur les 4 précédentes.`,
          preuve: {
            moyenneRecente: Math.round(r.moyenne * 10) / 10,
            moyennePrecedente: Math.round(p.moyenne * 10) / 10,
            avisRecents: r.total,
            avisPrecedents: p.total,
          },
          severity: ecart <= -1.5 ? "critique" : "attention",
        });
      } else if (ecart >= 0.7) {
        trends.push({
          kind: "amelioration",
          targetType: r.targetType,
          targetId: r.targetId,
          constat: `Les avis s'améliorent : ${r.moyenne.toFixed(1)}/5 sur les 4 dernières semaines contre ${p.moyenne.toFixed(1)}/5 sur les 4 précédentes.`,
          preuve: {
            moyenneRecente: Math.round(r.moyenne * 10) / 10,
            moyennePrecedente: Math.round(p.moyenne * 10) / 10,
            avisRecents: r.total,
            avisPrecedents: p.total,
          },
          severity: "info",
        });
      }

      // Un volume qui triple sans explication mérite une vérification : c'est
      // le signe d'une campagne, pas forcément d'une fraude — d'où « info ».
      if (r.total >= 3 * p.total && r.total >= 10) {
        trends.push({
          kind: "afflux_inhabituel",
          targetType: r.targetType,
          targetId: r.targetId,
          constat: `Augmentation inhabituelle du nombre d'avis : ${r.total} en 4 semaines contre ${p.total} sur la période précédente. Vérification recommandée.`,
          preuve: { avisRecents: r.total, avisPrecedents: p.total },
          severity: "attention",
        });
      }
    }
  }

  // Motifs récurrents dans les commentaires négatifs récents.
  const negatifs = await db
    .select({
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      comment: reviewsV2.comment,
    })
    .from(reviewsV2)
    .where(
      and(
        sql`${reviewsV2.status} = 'publie'`,
        sql`${reviewsV2.ratingGlobal} <= 3`,
        sql`${reviewsV2.comment} is not null`,
        gte(reviewsV2.createdAt, debutRecent),
      ),
    );

  const compte = new Map<string, { theme: string; targetType: string; targetId: number; n: number }>();
  for (const avis of negatifs) {
    const texte = (avis.comment ?? "").toLowerCase();
    for (const motif of MOTIFS) {
      if (!motif.mots.some((m) => texte.includes(m))) continue;
      const k = `${avis.targetType}:${avis.targetId}:${motif.theme}`;
      const actuel = compte.get(k);
      if (actuel) actuel.n += 1;
      else
        compte.set(k, {
          theme: motif.theme,
          targetType: avis.targetType,
          targetId: avis.targetId,
          n: 1,
        });
    }
  }
  for (const c of compte.values()) {
    if (c.n < MIN_VOLUME_PERIODE) continue;
    trends.push({
      kind: "motif_recurrent",
      targetType: c.targetType,
      targetId: c.targetId,
      constat: `${c.n} clients signalent un problème de ${c.theme} sur les 4 dernières semaines.`,
      preuve: { avisConcernes: c.n },
      severity: c.n >= 6 ? "critique" : "attention",
    });
  }

  return trends;
}

/** Signature stable d'un constat — évite de rouvrir la même alerte à chaque scan. */
export function trendSignature(t: ReputationTrend): string {
  return `reputation:${cle(t)}`;
}
