/**
 * Point 53 — la réputation comme signal de la recherche interne.
 *
 * Le classement ne doit pas remonter « celui qui a 5,0 » : deux avis parfaits ne
 * valent pas plusieurs centaines d'expériences stables. La note est donc lissée
 * vers la moyenne de la plateforme proportionnellement au manque de volume
 * (moyenne bayésienne) :
 *
 *   score = (C × m + Σnotes) / (C + n)
 *
 * où `m` est la moyenne réelle observée sur la plateforme et `C` le volume à
 * partir duquel on accorde sa confiance à une note. Conséquence voulue :
 * 5,0 sur 2 avis se classe sous 4,6 sur 300 avis, sans qu'aucune note affichée
 * soit modifiée — seul le classement l'est.
 */
import { inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewAggregates } from "../modules/reviews.js";

/** Volume à partir duquel une note est considérée comme établie. */
export const CONFIDENCE_VOLUME = 20;

export interface TargetReputation {
  targetId: number;
  /** null = aucun avis : la cible n'est ni favorisée ni pénalisée. */
  average: number | null;
  total: number;
  verifiedCount: number;
  /** Note lissée par le volume, sur 5. null si aucun avis. */
  weighted: number | null;
  /** Part d'expériences vérifiées, 0-100. */
  verifiedPct: number;
}

/** Moyenne réelle de la plateforme — repère du lissage, jamais une constante. */
export async function platformAverage(): Promise<{ average: number; total: number }> {
  const [row] = await db
    .select({
      somme: sql<number>`coalesce(sum(${reviewAggregates.averageRatingX100} * ${reviewAggregates.totalReviews}), 0)::bigint`,
      total: sql<number>`coalesce(sum(${reviewAggregates.totalReviews}), 0)::int`,
    })
    .from(reviewAggregates);

  const total = Number(row?.total ?? 0);
  if (total === 0) return { average: 0, total: 0 };
  return { average: Number(row.somme) / total / 100, total };
}

/**
 * Réputation de plusieurs cibles en une requête (la recherche ne peut pas se
 * permettre une requête par résultat).
 */
export async function reputationForTargets(
  targetType: string,
  targetIds: number[],
): Promise<Map<number, TargetReputation>> {
  const out = new Map<number, TargetReputation>();
  if (targetIds.length === 0) return out;

  const rows = await db
    .select({
      targetId: reviewAggregates.targetId,
      total: sql<number>`sum(${reviewAggregates.totalReviews})::int`,
      somme: sql<number>`sum(${reviewAggregates.averageRatingX100} * ${reviewAggregates.totalReviews})::bigint`,
      verifies: sql<number>`sum(${reviewAggregates.verifiedCount})::int`,
    })
    .from(reviewAggregates)
    .where(
      sql`${reviewAggregates.targetType} = ${targetType} and ${inArray(reviewAggregates.targetId, targetIds)}`,
    )
    .groupBy(reviewAggregates.targetId);

  const { average: m } = await platformAverage();

  for (const id of targetIds) {
    out.set(id, {
      targetId: id,
      average: null,
      total: 0,
      verifiedCount: 0,
      weighted: null,
      verifiedPct: 0,
    });
  }

  for (const r of rows) {
    const total = Number(r.total ?? 0);
    if (total === 0) continue;
    const average = Number(r.somme) / total / 100;
    const weighted =
      m > 0
        ? (CONFIDENCE_VOLUME * m + average * total) / (CONFIDENCE_VOLUME + total)
        : average;
    out.set(r.targetId, {
      targetId: r.targetId,
      average: Math.round(average * 100) / 100,
      total,
      verifiedCount: Number(r.verifies ?? 0),
      weighted: Math.round(weighted * 100) / 100,
      verifiedPct: Math.round((Number(r.verifies ?? 0) / total) * 100),
    });
  }

  return out;
}

export interface RankInput {
  id: number;
  /** null quand le prestataire n'a pas de coordonnées. */
  distanceKm: number | null;
  /** Vrai si le prestataire est réellement disponible/publiable. */
  disponible?: boolean;
}

export interface RankedItem<T extends RankInput> {
  item: T;
  reputation: TargetReputation;
  score: number;
  /** Détail des composantes, affichable pour expliquer un classement. */
  composantes: { qualite: number; distance: number; verifie: number; disponibilite: number };
}

/**
 * Combine les critères objectifs du point 53. Les pondérations sont explicites
 * pour qu'un classement puisse être expliqué à un professionnel qui le contexte.
 */
export async function rankByReputation<T extends RankInput>(
  targetType: string,
  items: T[],
  options: { rayonKm?: number } = {},
): Promise<RankedItem<T>[]> {
  const reps = await reputationForTargets(
    targetType,
    items.map((i) => i.id),
  );
  const rayon = options.rayonKm ?? 50;

  const ranked = items.map((item) => {
    const reputation =
      reps.get(item.id) ?? {
        targetId: item.id,
        average: null,
        total: 0,
        verifiedCount: 0,
        weighted: null,
        verifiedPct: 0,
      };

    // Sans avis, la qualité est neutre : une nouvelle fiche n'est pas reléguée
    // au dernier rang, mais elle ne devance pas une réputation établie.
    const qualite = reputation.weighted === null ? 0.5 : reputation.weighted / 5;
    const distance =
      item.distanceKm === null ? 0.5 : Math.max(0, 1 - Math.min(item.distanceKm, rayon) / rayon);
    const verifie = reputation.total === 0 ? 0 : reputation.verifiedPct / 100;
    const disponibilite = item.disponible === false ? 0 : 1;

    const score =
      0.4 * qualite + 0.35 * distance + 0.15 * verifie + 0.1 * disponibilite;

    return {
      item,
      reputation,
      score: Math.round(score * 1000) / 1000,
      composantes: {
        qualite: Math.round(qualite * 100) / 100,
        distance: Math.round(distance * 100) / 100,
        verifie: Math.round(verifie * 100) / 100,
        disponibilite,
      },
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
