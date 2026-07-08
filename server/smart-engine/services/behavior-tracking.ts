/**
 * Feature 15 — Suivi comportemental utilisateur
 * Enregistre chaque interaction : pages visitées, clics, temps passé,
 * parcours de navigation, actions réalisées.
 * Le système apprend les comportements pour s'adapter à chaque utilisateur.
 */
import { db } from "../../db.js";
import { smartActivityLog, smartUserMemory } from "../schema.js";
import { desc, eq, sql, gte, and } from "drizzle-orm";

interface PageVisit {
  userId?: number;
  page: string;
  referrer?: string;
  duration?: number;
  device?: string;
  country?: string;
}

interface UserAction {
  userId?: number;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

export async function trackPageVisit(visit: PageVisit) {
  return db.insert(smartActivityLog).values({
    action: "page.visit",
    userId: visit.userId ?? null,
    targetType: "page",
    data: {
      page: visit.page,
      referrer: visit.referrer ?? null,
      duration: visit.duration ?? null,
      device: visit.device ?? null,
      country: visit.country ?? null,
      at: new Date().toISOString(),
    },
    result: "tracked",
  }).returning();
}

export async function trackUserAction(action: UserAction) {
  return db.insert(smartActivityLog).values({
    action: `user.${action.action}`,
    userId: action.userId ?? null,
    targetType: action.target ?? null,
    data: { ...action.metadata, at: new Date().toISOString() },
    result: "tracked",
  }).returning();
}

export async function trackSession(userId: number, sessionData: {
  startedAt: string;
  pages: string[];
  actions: string[];
  duration: number;
  device?: string;
}) {
  return db.insert(smartUserMemory).values({
    userId,
    type: "session" as any,
    data: sessionData,
  }).returning();
}

export async function getPageStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      page: sql<string>`(${smartActivityLog.data}->>'page')`,
      visits: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${smartActivityLog.userId})::int`,
    })
    .from(smartActivityLog)
    .where(and(
      eq(smartActivityLog.action, "page.visit"),
      gte(smartActivityLog.createdAt, since),
    ))
    .groupBy(sql`${smartActivityLog.data}->>'page'`)
    .orderBy(sql`count(*) desc`)
    .limit(50);
  return rows;
}

export async function getUserBehaviorProfile(userId: number) {
  const views = await db
    .select({
      page: sql<string>`(${smartActivityLog.data}->>'page')`,
      count: sql<number>`count(*)::int`,
    })
    .from(smartActivityLog)
    .where(and(
      eq(smartActivityLog.action, "page.visit"),
      eq(smartActivityLog.userId, userId),
    ))
    .groupBy(sql`${smartActivityLog.data}->>'page'`)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  const actions = await db
    .select({
      action: smartActivityLog.action,
      count: sql<number>`count(*)::int`,
    })
    .from(smartActivityLog)
    .where(eq(smartActivityLog.userId, userId))
    .groupBy(smartActivityLog.action)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  const recentActivity = await db
    .select()
    .from(smartActivityLog)
    .where(eq(smartActivityLog.userId, userId))
    .orderBy(desc(smartActivityLog.createdAt))
    .limit(20);

  return { topPages: views, topActions: actions, recentActivity };
}

export async function getActiveUsers(minutes = 15) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  const rows = await db
    .select({
      userId: smartActivityLog.userId,
      lastAction: sql<string>`max(${smartActivityLog.createdAt}::text)`,
      actionCount: sql<number>`count(*)::int`,
    })
    .from(smartActivityLog)
    .where(gte(smartActivityLog.createdAt, since))
    .groupBy(smartActivityLog.userId)
    .orderBy(sql`max(${smartActivityLog.createdAt}) desc`)
    .limit(50);
  return rows;
}

export async function getPlatformPulse(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [stats] = await db
    .select({
      totalActions: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${smartActivityLog.userId})::int`,
      pageVisits: sql<number>`count(*) filter (where ${smartActivityLog.action} = 'page.visit')::int`,
      searches: sql<number>`count(*) filter (where ${smartActivityLog.action} like 'search%')::int`,
      annonceViews: sql<number>`count(*) filter (where ${smartActivityLog.action} = 'page.visit' and ${smartActivityLog.data}->>'page' like '%vehicule%')::int`,
      deposits: sql<number>`count(*) filter (where ${smartActivityLog.action} = 'annonce.created')::int`,
      modifications: sql<number>`count(*) filter (where ${smartActivityLog.action} = 'annonce.modified')::int`,
    })
    .from(smartActivityLog)
    .where(gte(smartActivityLog.createdAt, since));
  return stats;
}
