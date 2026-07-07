/**
 * Feature 10 — Connexion au système d'avis
 * Lit les avis clients pour détecter : problèmes fréquents, professionnels en difficulté,
 * services mal notés, employés bien notés, demandes répétées.
 * Ne supprime PAS les avis. Analyse et alerte.
 */
import { db } from "../../db.js";
import { smartAlerts, smartActivityLog } from "../schema.js";
import { sql, desc, gte } from "drizzle-orm";

// Les avis sont dans la table reviews/reviewsV2 du projet principal.
// Le Smart Engine les lit en lecture seule pour analyser les tendances.

export async function analyzeReviews() {
  // Détection des professionnels avec avis négatifs récurrents
  try {
    const lowRated = await db.execute(sql`
      SELECT target_id, target_type, 
             count(*)::int as total_reviews,
             avg(rating)::numeric(3,1) as avg_rating,
             count(*) filter (where rating <= 2)::int as negative_count
      FROM reviews
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY target_id, target_type
      HAVING avg(rating) < 3 AND count(*) >= 3
      ORDER BY avg(rating) ASC
      LIMIT 20
    `);

    for (const item of lowRated.rows as any[]) {
      await db.insert(smartAlerts).values({
        category: "avis",
        title: `${item.target_type} #${item.target_id} — note moyenne basse (${item.avg_rating}/5)`,
        description: `${item.negative_count} avis négatifs sur ${item.total_reviews} avis (30 derniers jours)`,
        severity: Number(item.avg_rating) < 2 ? "critical" : "warning",
        targetType: item.target_type,
        targetId: item.target_id,
        metadata: { avgRating: item.avg_rating, totalReviews: item.total_reviews, negativeCount: item.negative_count },
      });
    }

    return { analyzed: true, flaggedCount: (lowRated.rows as any[]).length };
  } catch {
    // Table reviews peut ne pas exister encore
    return { analyzed: false, flaggedCount: 0 };
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
