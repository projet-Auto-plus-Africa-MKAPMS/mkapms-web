/**
 * MKA.P-MS — SEO OS : tableau de bord temps réel (Phase 21).
 *
 * Centralise les métriques SEO mesurables en interne :
 *  - pages indexables / non indexables ;
 *  - soumissions d'indexation (succès / échecs) ;
 *  - erreurs 404 et liens/redirections cassés (moteur de redirection) ;
 *  - durée moyenne des parcours (proxy vitesse).
 *
 * Les métriques Google (clics, impressions, position moyenne) nécessitent la
 * Google Search Console API : tant que la clé n'est pas fournie, `google.connected`
 * est faux et le tableau de bord n'affiche que l'interne.
 *
 * Ce module OBSERVE uniquement — aucune écriture.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { seoPages, seoIndexingLog } from "./schema.js";
import { redirLogs } from "./redirection-engine/schema.js";
import { env } from "./env.js";

export interface SeoDashboard {
  pages: { total: number; indexable: number; nonIndexable: number };
  byType: { pageType: string; count: number }[];
  indexation: { submissions24h: number; success24h: number; failed24h: number; lastAt: string | null };
  errors: { notFound24h: number; notFound7d: number; brokenLinks7d: number };
  topNotFound: { path: string; count: number }[];
  performance: { avgParcoursMs: number | null; sampleParcours: number };
  google: { connected: boolean; note: string };
  generatedAt: string;
}

export async function seoDashboard(): Promise<SeoDashboard> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ─── Pages ────────────────────────────────────────────────────────────────
  let pages = { total: 0, indexable: 0, nonIndexable: 0 };
  let byType: { pageType: string; count: number }[] = [];
  try {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        indexable: sql<number>`count(*) filter (where ${seoPages.indexed} = true)::int`,
      })
      .from(seoPages);
    pages = {
      total: row?.total ?? 0,
      indexable: row?.indexable ?? 0,
      nonIndexable: (row?.total ?? 0) - (row?.indexable ?? 0),
    };
    byType = (
      await db
        .select({ pageType: seoPages.pageType, count: sql<number>`count(*)::int` })
        .from(seoPages)
        .groupBy(seoPages.pageType)
        .orderBy(desc(sql`count(*)`))
    ).map((r) => ({ pageType: r.pageType, count: Number(r.count) }));
  } catch { /* tables absentes */ }

  // ─── Indexation (24h) ───────────────────────────────────────────────────────
  let indexation = { submissions24h: 0, success24h: 0, failed24h: 0, lastAt: null as string | null };
  try {
    const [row] = await db
      .select({
        submissions: sql<number>`count(*)::int`,
        success: sql<number>`count(*) filter (where ${seoIndexingLog.success} = true)::int`,
        failed: sql<number>`count(*) filter (where ${seoIndexingLog.success} = false)::int`,
      })
      .from(seoIndexingLog)
      .where(sql`${seoIndexingLog.createdAt} >= ${since24h}`);
    const [last] = await db
      .select({ at: sql<Date>`max(${seoIndexingLog.createdAt})` })
      .from(seoIndexingLog);
    indexation = {
      submissions24h: row?.submissions ?? 0,
      success24h: row?.success ?? 0,
      failed24h: row?.failed ?? 0,
      lastAt: last?.at ? new Date(last.at).toISOString() : null,
    };
  } catch { /* table absente */ }

  // ─── 404 & liens cassés (moteur de redirection) ────────────────────────────
  let errors = { notFound24h: 0, notFound7d: 0, brokenLinks7d: 0 };
  let topNotFound: { path: string; count: number }[] = [];
  let performance = { avgParcoursMs: null as number | null, sampleParcours: 0 };
  try {
    const [row] = await db
      .select({
        notFound24h: sql<number>`count(*) filter (where ${redirLogs.outcome} = 'not_found' and ${redirLogs.createdAt} >= ${since24h})::int`,
        notFound7d: sql<number>`count(*) filter (where ${redirLogs.outcome} = 'not_found' and ${redirLogs.createdAt} >= ${since7d})::int`,
        brokenLinks7d: sql<number>`count(*) filter (where ${redirLogs.outcome} in ('unmatched','error') and ${redirLogs.createdAt} >= ${since7d})::int`,
      })
      .from(redirLogs);
    errors = {
      notFound24h: row?.notFound24h ?? 0,
      notFound7d: row?.notFound7d ?? 0,
      brokenLinks7d: row?.brokenLinks7d ?? 0,
    };

    topNotFound = (
      await db
        .select({ path: redirLogs.key, count: sql<number>`count(*)::int` })
        .from(redirLogs)
        .where(and(eq(redirLogs.outcome, "not_found"), sql`${redirLogs.createdAt} >= ${since7d}`))
        .groupBy(redirLogs.key)
        .orderBy(desc(sql`count(*)`))
        .limit(10)
    ).map((r) => ({ path: r.path, count: Number(r.count) }));

    const [perf] = await db
      .select({
        avg: sql<number | null>`avg(${redirLogs.durationMs})`,
        n: sql<number>`count(${redirLogs.durationMs})::int`,
      })
      .from(redirLogs)
      .where(sql`${redirLogs.createdAt} >= ${since7d} and ${redirLogs.durationMs} is not null`);
    performance = {
      avgParcoursMs: perf?.avg != null ? Math.round(Number(perf.avg)) : null,
      sampleParcours: perf?.n ?? 0,
    };
  } catch { /* table absente */ }

  const connected = !!env.GOOGLE_SEARCH_CONSOLE_KEY;

  return {
    pages,
    byType,
    indexation,
    errors,
    topNotFound,
    performance,
    google: {
      connected,
      note: connected
        ? "Google Search Console connecté."
        : "Google Search Console non connecté — clics, impressions et position moyenne indisponibles tant que la clé n'est pas fournie.",
    },
    generatedAt: new Date().toISOString(),
  };
}
