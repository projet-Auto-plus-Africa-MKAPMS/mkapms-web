/**
 * Point 50 — réponses aux avis.
 *
 * Le Système Intelligent **propose** une réponse ; il ne publie rien. La
 * suggestion est construite à partir de ce que l'avis contient réellement
 * (note, critères mal notés, points à améliorer) : aucune promesse commerciale,
 * aucun remboursement, aucun engagement n'est inventé à la place du
 * professionnel. La publication reste une action explicite (`reviewsV2.respond`).
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewsV2 } from "../modules/reviews.js";
import { garagesPublics } from "../schema.js";
import { partsShops } from "../modules/pieces.js";
import { deliveryProfiles } from "../modules/livraison.js";
import { breakdownProviders } from "../modules/depannage.js";

export interface ResponseSuggestion {
  reviewId: number;
  /** Texte proposé — à relire et à valider par le professionnel. */
  suggestion: string;
  /** Ce sur quoi la proposition s'appuie, pour que le pro puisse la corriger. */
  bases: string[];
  /** Toujours vrai : la suggestion n'est jamais publiée par le moteur. */
  requiresValidation: true;
}

const CRITERE_LABELS: Record<string, string> = {
  qualite: "la qualité de la prestation",
  delai: "le délai",
  accueil: "l'accueil",
  prix: "le rapport qualité-prix",
  proprete: "la propreté",
  communication: "la communication",
  conformite: "la conformité de la prestation",
  ponctualite: "la ponctualité",
};

/** Critères notés 1 ou 2 — ce que le client reproche vraiment. */
function faibles(criterias: unknown): string[] {
  if (!criterias || typeof criterias !== "object") return [];
  const out: string[] = [];
  for (const [cle, valeur] of Object.entries(criterias as Record<string, unknown>)) {
    if (typeof valeur === "number" && valeur <= 2) {
      out.push(CRITERE_LABELS[cle] ?? cle);
    }
  }
  return out;
}

export async function suggestResponse(reviewId: number): Promise<ResponseSuggestion | null> {
  const [review] = await db
    .select({
      id: reviewsV2.id,
      ratingGlobal: reviewsV2.ratingGlobal,
      comment: reviewsV2.comment,
      consText: reviewsV2.consText,
      prosText: reviewsV2.prosText,
      criterias: reviewsV2.criterias,
      verified: reviewsV2.verified,
    })
    .from(reviewsV2)
    .where(eq(reviewsV2.id, reviewId))
    .limit(1);
  if (!review) return null;

  const bases: string[] = [`Note globale : ${review.ratingGlobal}/5.`];
  const critiques = faibles(review.criterias);
  if (critiques.length > 0) bases.push(`Critères notés 1 ou 2 : ${critiques.join(", ")}.`);
  if (review.consText) bases.push(`Points à améliorer signalés : « ${review.consText} ».`);
  if (review.prosText) bases.push(`Points positifs signalés : « ${review.prosText} ».`);
  if (review.verified) bases.push("Expérience vérifiée par une transaction MKA.P-MS.");

  const phrases: string[] = ["Bonjour, merci d'avoir pris le temps de partager votre expérience."];

  if (review.ratingGlobal >= 4) {
    if (review.prosText) {
      phrases.push(`Nous sommes heureux que ${review.prosText.trim().replace(/\.$/, "")} vous ait convenu.`);
    }
    phrases.push("Votre retour encourage toute l'équipe et nous espérons vous revoir bientôt.");
  } else {
    phrases.push("Nous regrettons que votre expérience n'ait pas été à la hauteur de vos attentes.");
    if (critiques.length > 0) {
      phrases.push(`Nous prenons note de votre remarque sur ${critiques.join(" et ")}.`);
    }
    if (review.consText) {
      phrases.push("Nous examinons en interne le point que vous soulevez.");
    }
    phrases.push(
      "Nous restons à votre disposition pour en discuter directement afin de comprendre ce qui s'est passé.",
    );
  }

  return {
    reviewId: review.id,
    suggestion: phrases.join(" "),
    bases,
    requiresValidation: true,
  };
}

export interface OwnedTarget {
  targetType: string;
  targetId: number;
  nom: string;
}

/** Fiches professionnelles réellement détenues par un compte. */
export async function targetsOwnedBy(userId: number): Promise<OwnedTarget[]> {
  const [garages, shops, transporteurs, depanneurs] = await Promise.all([
    db
      .select({ id: garagesPublics.id, nom: garagesPublics.name })
      .from(garagesPublics)
      .where(eq(garagesPublics.ownerId, userId)),
    db
      .select({ id: partsShops.id, nom: partsShops.nom })
      .from(partsShops)
      .where(eq(partsShops.ownerId, userId)),
    db
      .select({ id: deliveryProfiles.id, nom: deliveryProfiles.nom })
      .from(deliveryProfiles)
      .where(eq(deliveryProfiles.userId, userId)),
    db
      .select({ id: breakdownProviders.id, nom: breakdownProviders.nom })
      .from(breakdownProviders)
      .where(eq(breakdownProviders.userId, userId)),
  ]);

  return [
    ...garages.map((g) => ({ targetType: "garage", targetId: g.id, nom: g.nom })),
    ...shops.map((s) => ({ targetType: "boutique_pieces", targetId: s.id, nom: s.nom })),
    ...transporteurs.map((t) => ({ targetType: "transporteur", targetId: t.id, nom: t.nom })),
    ...depanneurs.map((d) => ({ targetType: "depanneur", targetId: d.id, nom: d.nom })),
    { targetType: "user", targetId: userId, nom: "Mon compte professionnel" },
  ];
}

/** Avis portant sur les fiches d'un professionnel, réponses en attente d'abord. */
export async function reviewsForOwner(userId: number, limit = 50) {
  const cibles = await targetsOwnedBy(userId);
  if (cibles.length === 0) return { cibles, avis: [] };

  const avis = await db
    .select({
      id: reviewsV2.id,
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      univers: reviewsV2.univers,
      ratingGlobal: reviewsV2.ratingGlobal,
      comment: reviewsV2.comment,
      prosText: reviewsV2.prosText,
      consText: reviewsV2.consText,
      verified: reviewsV2.verified,
      status: reviewsV2.status,
      countryCode: reviewsV2.countryCode,
      responseText: reviewsV2.responseText,
      responseAt: reviewsV2.responseAt,
      officialResponseText: reviewsV2.officialResponseText,
      createdAt: reviewsV2.createdAt,
    })
    .from(reviewsV2)
    .where(
      and(
        inArray(
          reviewsV2.targetType,
          Array.from(new Set(cibles.map((c) => c.targetType))),
        ),
        inArray(
          reviewsV2.targetId,
          Array.from(new Set(cibles.map((c) => c.targetId))),
        ),
      ),
    )
    .orderBy(sql`case when ${reviewsV2.responseText} is null then 0 else 1 end`, desc(reviewsV2.createdAt))
    .limit(limit);

  // Le filtre SQL croise les types et les identifiants séparément : on ne garde
  // que les couples réellement détenus.
  const cles = new Set(cibles.map((c) => `${c.targetType}#${c.targetId}`));
  return { cibles, avis: avis.filter((a) => cles.has(`${a.targetType}#${a.targetId}`)) };
}
