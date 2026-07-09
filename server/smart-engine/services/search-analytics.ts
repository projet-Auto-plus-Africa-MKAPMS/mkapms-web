/**
 * Feature 1 — Analyse des recherches
 * Enregistre et analyse les recherches, mots-clés, filtres, résultats.
 */
import { db } from "../../db.js";
import { smartSearchLogs } from "../schema.js";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import { learnFromSearch } from "./knowledge-base.js";

export interface SearchLogInput {
  userId?: number;
  sessionId?: string;
  query?: string;
  filters?: Record<string, unknown>;
  ville?: string;
  pays?: string;
  rayon?: number;
  budgetMin?: number;
  budgetMax?: number;
  resultCount: number;
  clickedAnnonceId?: number;
}

export async function logSearch(input: SearchLogInput) {
  const [row] = await db
    .insert(smartSearchLogs)
    .values({
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      query: input.query ?? null,
      filters: input.filters ?? null,
      ville: input.ville ?? null,
      pays: input.pays ?? null,
      rayon: input.rayon ?? null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      resultCount: input.resultCount,
      hasResults: input.resultCount > 0,
      clickedAnnonceId: input.clickedAnnonceId ?? null,
    })
    .returning();

  // Apprentissage automatique (best-effort, jamais bloquant)
  void learnFromSearch({
    query: input.query,
    filters: input.filters,
    ville: input.ville,
    userId: input.userId,
  }).catch(() => {});

  return row;
}

export async function getSearchesWithoutResults(limit = 50) {
  return db
    .select()
    .from(smartSearchLogs)
    .where(eq(smartSearchLogs.hasResults, false))
    .orderBy(desc(smartSearchLogs.createdAt))
    .limit(limit);
}

export async function getTopSearches(days = 30, limit = 20) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      query: smartSearchLogs.query,
      count: sql<number>`count(*)::int`.as("count"),
      avgResults: sql<number>`avg(${smartSearchLogs.resultCount})::int`.as("avg_results"),
    })
    .from(smartSearchLogs)
    .where(and(gte(smartSearchLogs.createdAt, since), sql`${smartSearchLogs.query} IS NOT NULL`))
    .groupBy(smartSearchLogs.query)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);
}

export async function getSearchStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withResults: sql<number>`count(*) filter (where ${smartSearchLogs.hasResults} = true)::int`,
      withoutResults: sql<number>`count(*) filter (where ${smartSearchLogs.hasResults} = false)::int`,
      uniqueUsers: sql<number>`count(distinct ${smartSearchLogs.userId})::int`,
    })
    .from(smartSearchLogs)
    .where(gte(smartSearchLogs.createdAt, since));
  return stats;
}
