/**
 * Feature 9 — Journal d'activité
 * Chaque action du système est enregistrée : date, heure, action,
 * utilisateur concerné, donnée analysée, résultat, décision proposée,
 * validation humaine. Rien ne doit être invisible.
 */
import { db } from "../../db.js";
import { smartActivityLog } from "../schema.js";
import { desc, eq, and, gte, sql } from "drizzle-orm";

interface ActivityInput {
  action: string;
  userId?: number;
  targetType?: string;
  targetId?: number;
  data?: Record<string, unknown>;
  result?: string;
  proposedDecision?: string;
}

export async function logActivity(input: ActivityInput) {
  const [row] = await db
    .insert(smartActivityLog)
    .values({
      action: input.action,
      userId: input.userId ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      data: input.data ?? null,
      result: input.result ?? null,
      proposedDecision: input.proposedDecision ?? null,
    })
    .returning();
  return row;
}

export async function getActivityLog(limit = 100, offset = 0) {
  return db
    .select()
    .from(smartActivityLog)
    .orderBy(desc(smartActivityLog.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityByUser(userId: number, limit = 50) {
  return db
    .select()
    .from(smartActivityLog)
    .where(eq(smartActivityLog.userId, userId))
    .orderBy(desc(smartActivityLog.createdAt))
    .limit(limit);
}

export async function getActivityStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      success: sql<number>`count(*) filter (where ${smartActivityLog.result} = 'success')::int`,
      failure: sql<number>`count(*) filter (where ${smartActivityLog.result} = 'failure')::int`,
      pending: sql<number>`count(*) filter (where ${smartActivityLog.result} = 'pending')::int`,
      needsValidation: sql<number>`count(*) filter (where ${smartActivityLog.humanValidation} is null and ${smartActivityLog.proposedDecision} is not null)::int`,
    })
    .from(smartActivityLog)
    .where(gte(smartActivityLog.createdAt, since));
  return stats;
}

export async function validateActivity(id: number, approved: boolean, validatedBy: number) {
  await db
    .update(smartActivityLog)
    .set({ humanValidation: approved, validatedBy })
    .where(eq(smartActivityLog.id, id));
}
