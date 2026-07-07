/**
 * Feature 3 — Recommandations simples
 * Propose annonces similaires, nouveaux véhicules, garages proches, pièces compatibles.
 *
 * Exemple : un client cherche "Peugeot 206" → plus tard, une Peugeot 206 est ajoutée
 * → le système lui propose automatiquement cette annonce.
 */
import { db } from "../../db.js";
import { smartRecommendations, smartSearchLogs, smartUserMemory } from "../schema.js";
import { annonces } from "../../schema.js";
import { and, desc, eq, sql, ilike, gte } from "drizzle-orm";

export async function generateRecommendations(userId: number) {
  // Récupérer les recherches récentes de l'utilisateur
  const recentSearches = await db
    .select()
    .from(smartSearchLogs)
    .where(eq(smartSearchLogs.userId, userId))
    .orderBy(desc(smartSearchLogs.createdAt))
    .limit(10);

  // Récupérer les annonces consultées
  const viewedMemory = await db
    .select()
    .from(smartUserMemory)
    .where(and(eq(smartUserMemory.userId, userId), eq(smartUserMemory.type, "view")))
    .orderBy(desc(smartUserMemory.createdAt))
    .limit(20);

  const recommendations: Array<{ type: string; targetId: number; reason: string; score: number }> = [];

  // Pour chaque recherche, trouver des annonces correspondantes
  for (const search of recentSearches) {
    if (!search.query) continue;
    const keywords = search.query.split(/\s+/).filter(Boolean);
    if (keywords.length === 0) continue;

    const matchingAnnonces = await db
      .select({ id: annonces.id, titre: annonces.titre })
      .from(annonces)
      .where(
        and(
          eq(annonces.status, "publiee"),
          sql`(${annonces.titre} ILIKE ${"%" + keywords[0] + "%"} OR ${annonces.marque} ILIKE ${"%" + keywords[0] + "%"} OR ${annonces.modele} ILIKE ${"%" + keywords[0] + "%"})`
        )
      )
      .limit(5);

    for (const a of matchingAnnonces) {
      recommendations.push({
        type: "annonce",
        targetId: a.id,
        reason: `Correspond à votre recherche "${search.query}"`,
        score: 80,
      });
    }
  }

  // Déduplication par targetId
  const seen = new Set<number>();
  const unique = recommendations.filter((r) => {
    if (seen.has(r.targetId)) return false;
    seen.add(r.targetId);
    return true;
  });

  // Sauvegarder les recommandations
  if (unique.length > 0) {
    await db.insert(smartRecommendations).values(
      unique.map((r) => ({
        userId,
        type: r.type,
        targetId: r.targetId,
        reason: r.reason,
        score: r.score,
      }))
    );
  }

  return unique;
}

export async function getUserRecommendations(userId: number, limit = 20) {
  return db
    .select()
    .from(smartRecommendations)
    .where(and(eq(smartRecommendations.userId, userId), eq(smartRecommendations.seen, false)))
    .orderBy(desc(smartRecommendations.score), desc(smartRecommendations.createdAt))
    .limit(limit);
}

export async function markRecommendationSeen(id: number) {
  await db.update(smartRecommendations).set({ seen: true }).where(eq(smartRecommendations.id, id));
}

export async function markRecommendationClicked(id: number) {
  await db.update(smartRecommendations).set({ clicked: true, seen: true }).where(eq(smartRecommendations.id, id));
}
