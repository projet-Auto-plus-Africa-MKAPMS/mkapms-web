/**
 * MKA.P-MS Redirection Engine — Service (logique métier).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { redirRules, redirLogs } from "./schema.js";

export interface ResolveResult {
  matched: boolean;
  target: string | null;
  external: boolean;
  key: string;
}

/**
 * Résout une clé vers sa destination selon les règles actives (priorité la
 * plus haute d'abord). Journalise la résolution et incrémente le compteur.
 */
export async function resolveKey(
  key: string,
  who?: { userId?: number; role?: string },
): Promise<ResolveResult> {
  const [rule] = await db
    .select()
    .from(redirRules)
    .where(and(eq(redirRules.key, key), eq(redirRules.active, true)))
    .orderBy(desc(redirRules.priority), desc(redirRules.updatedAt))
    .limit(1);

  const matched = !!rule;

  await db.insert(redirLogs).values({
    key,
    matched,
    resolvedTo: rule?.target ?? null,
    userId: who?.userId ?? null,
    role: who?.role ?? null,
  });

  if (rule) {
    await db
      .update(redirRules)
      .set({ hitCount: sql`${redirRules.hitCount} + 1` })
      .where(eq(redirRules.id, rule.id));
    return { matched: true, target: rule.target, external: !!rule.external, key };
  }
  return { matched: false, target: null, external: false, key };
}

export async function listRules() {
  return db
    .select()
    .from(redirRules)
    .orderBy(desc(redirRules.priority), desc(redirRules.updatedAt));
}

export interface RuleInput {
  key: string;
  label: string;
  kind?: string;
  target: string;
  external?: boolean;
  active?: boolean;
  priority?: number;
  description?: string;
}

export async function createRule(input: RuleInput, userId: number) {
  const [row] = await db
    .insert(redirRules)
    .values({
      key: input.key.trim(),
      label: input.label.trim(),
      kind: input.kind ?? "button",
      target: input.target.trim(),
      external: input.external ?? false,
      active: input.active ?? true,
      priority: input.priority ?? 0,
      description: input.description ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();
  return row;
}

export async function updateRule(id: number, input: Partial<RuleInput>, userId: number) {
  const patch: Record<string, unknown> = { updatedBy: userId, updatedAt: new Date() };
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.target !== undefined) patch.target = input.target.trim();
  if (input.external !== undefined) patch.external = input.external;
  if (input.active !== undefined) patch.active = input.active;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.description !== undefined) patch.description = input.description;
  const [row] = await db.update(redirRules).set(patch).where(eq(redirRules.id, id)).returning();
  return row;
}

export async function deleteRule(id: number) {
  await db.delete(redirRules).where(eq(redirRules.id, id));
  return { deleted: true };
}

export async function getStats() {
  const [ruleTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${redirRules.active} = true)::int`,
      hits: sql<number>`coalesce(sum(${redirRules.hitCount}), 0)::int`,
    })
    .from(redirRules);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [logTotals] = await db
    .select({
      resolutions24h: sql<number>`count(*)::int`,
      unmatched24h: sql<number>`count(*) filter (where ${redirLogs.matched} = false)::int`,
    })
    .from(redirLogs)
    .where(sql`${redirLogs.createdAt} >= ${since24h}`);

  // Clés demandées sans règle (à configurer) — sur les 7 derniers jours.
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const unmatchedKeys = await db
    .select({ key: redirLogs.key, count: sql<number>`count(*)::int` })
    .from(redirLogs)
    .where(and(eq(redirLogs.matched, false), sql`${redirLogs.createdAt} >= ${since7d}`))
    .groupBy(redirLogs.key)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  return {
    totalRules: ruleTotals?.total ?? 0,
    activeRules: ruleTotals?.active ?? 0,
    totalHits: ruleTotals?.hits ?? 0,
    resolutions24h: logTotals?.resolutions24h ?? 0,
    unmatched24h: logTotals?.unmatched24h ?? 0,
    unmatchedKeys,
  };
}

export async function getRecentLogs(limit = 100) {
  return db.select().from(redirLogs).orderBy(desc(redirLogs.createdAt)).limit(limit);
}
