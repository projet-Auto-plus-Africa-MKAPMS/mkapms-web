/**
 * Feature 9 — Journal d'activité
 * Chaque action du système est enregistrée : date, heure, action,
 * utilisateur concerné, donnée analysée, résultat, décision proposée,
 * validation humaine. Rien ne doit être invisible.
 */
import { db } from "../../db.js";
import { smartActivityLog } from "../schema.js";
import { desc, eq, and, gte, isNull, isNotNull, sql } from "drizzle-orm";

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

/**
 * `needsValidationOnly` isole les actions réellement en attente d'une
 * décision humaine (humanValidation null + proposedDecision renseigné) —
 * sans ce filtre, la carte "À valider" du tableau de bord (Smart Engine)
 * renvoyait vers ce même journal borné aux 50 dernières lignes toutes
 * confondues : avec 929 actions en attente sur un total de plusieurs
 * milliers, elles étaient presque toujours absentes des 50 plus récentes,
 * donnant l'impression d'un écran vide malgré un compteur non nul.
 */
export async function getActivityLog(limit = 100, offset = 0, needsValidationOnly = false) {
  return db
    .select()
    .from(smartActivityLog)
    .where(
      needsValidationOnly
        ? and(isNull(smartActivityLog.humanValidation), isNotNull(smartActivityLog.proposedDecision))
        : undefined,
    )
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
