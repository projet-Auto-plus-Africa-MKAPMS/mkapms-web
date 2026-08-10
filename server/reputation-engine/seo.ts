/**
 * Point 51 — avis et notes dans le référencement.
 *
 * Google exige que la note publiée dans les données structurées soit **celle que
 * le visiteur voit sur la page**. Le JSON-LD du garage utilisait
 * `garages_publics.rating` / `review_count`, deux colonnes que le module d'avis
 * ne met jamais à jour et que la base de démonstration remplit en dur (4.8 /
 * 128) : la note envoyée à Google pouvait donc n'exister nulle part. Ici la note
 * vient des avis réellement publiés (`review_aggregates`, alimentés par
 * `reviews_v2`), et l'absence d'avis renvoie `null` — aucun bloc `aggregateRating`
 * n'est alors émis.
 *
 * Voir https://developers.google.com/search/docs/appearance/structured-data/review-snippet
 * — l'affichage des étoiles reste décidé par Google, il n'est jamais garanti.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { reviewsV2 } from "../modules/reviews.js";
import { users } from "../schema.js";
import { reputationOf } from "./service.js";

export interface AggregateRatingLd {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  bestRating: 5;
  worstRating: 1;
}

export interface ReviewLd {
  "@type": "Review";
  reviewRating: { "@type": "Rating"; ratingValue: number; bestRating: 5; worstRating: 1 };
  author: { "@type": "Person"; name: string };
  datePublished: string;
  reviewBody?: string;
}

/** Nom d'auteur conforme au mode d'affichage choisi par le client. */
function nomAuteur(mode: string | null, nom: string | null): string {
  const brut = (nom ?? "").trim();
  if (!brut || mode === "anonyme") return "Client MKA.P-MS";
  if (mode === "initiales") {
    return brut
      .split(/\s+/)
      .map((p) => `${p.charAt(0).toUpperCase()}.`)
      .join(" ");
  }
  if (mode === "prenom") return brut.split(/\s+/)[0];
  return brut;
}

/**
 * Note agrégée d'une cible, ou `null` si aucun avis publié.
 * Le second membre du retour est la valeur affichable côté page, pour que le
 * visible et le structuré ne puissent pas diverger.
 */
export async function aggregateRatingFor(input: {
  targetType: string;
  targetId: number;
  univers?: string | null;
}): Promise<{ ld: AggregateRatingLd; average: number; total: number } | null> {
  const rep = await reputationOf({
    targetType: input.targetType,
    targetId: input.targetId,
    univers: input.univers ?? null,
  });
  if (rep.averageRating === null || rep.totalReviews < 1) return null;
  return {
    ld: {
      "@type": "AggregateRating",
      ratingValue: rep.averageRating,
      reviewCount: rep.totalReviews,
      bestRating: 5,
      worstRating: 1,
    },
    average: rep.averageRating,
    total: rep.totalReviews,
  };
}

/** Avis publics récents d'une cible, au format `Review` de schema.org. */
export async function reviewsLdFor(
  input: { targetType: string; targetId: number; univers?: string | null },
  limit = 5,
): Promise<ReviewLd[]> {
  const conds = [
    eq(reviewsV2.targetType, input.targetType),
    eq(reviewsV2.targetId, input.targetId),
    eq(reviewsV2.status, "publie"),
    eq(reviewsV2.visibility, "public"),
  ];
  if (input.univers) conds.push(eq(reviewsV2.univers, input.univers));

  const rows = await db
    .select({
      ratingGlobal: reviewsV2.ratingGlobal,
      comment: reviewsV2.comment,
      createdAt: reviewsV2.createdAt,
      displayMode: reviewsV2.authorDisplayMode,
      authorName: users.name,
    })
    .from(reviewsV2)
    .leftJoin(users, eq(users.id, reviewsV2.authorId))
    .where(and(...conds))
    .orderBy(desc(reviewsV2.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    "@type": "Review" as const,
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: r.ratingGlobal,
      bestRating: 5 as const,
      worstRating: 1 as const,
    },
    author: { "@type": "Person" as const, name: nomAuteur(r.displayMode, r.authorName) },
    datePublished: r.createdAt.toISOString().slice(0, 10),
    ...(r.comment ? { reviewBody: r.comment.slice(0, 500) } : {}),
  }));
}

/**
 * Bloc prêt à fusionner dans un JSON-LD de type LocalBusiness / AutoRepair.
 * Vide s'il n'y a aucun avis : mieux vaut aucune donnée structurée qu'une note
 * inventée, qui expose le site à une sanction et trompe le visiteur.
 */
export async function reputationJsonLdBlock(input: {
  targetType: string;
  targetId: number;
  univers?: string | null;
}): Promise<Record<string, unknown>> {
  const agg = await aggregateRatingFor(input);
  if (!agg) return {};
  const reviews = await reviewsLdFor(input);
  return {
    aggregateRating: agg.ld,
    ...(reviews.length > 0 ? { review: reviews } : {}),
  };
}
