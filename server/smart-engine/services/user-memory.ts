/**
 * Feature 2 — Mémoire utilisateur
 * Retrouver recherches, filtres, favoris, alertes, annonces consultées, besoins non trouvés.
 * Les données restent dans le compte même si l'utilisateur change d'appareil.
 */
import { db } from "../../db.js";
import { smartUserMemory } from "../schema.js";
import { and, desc, eq } from "drizzle-orm";

type MemoryType = "search" | "filter" | "view" | "alert" | "need";

export async function saveMemory(userId: number, type: MemoryType, data: Record<string, unknown>) {
  const [row] = await db
    .insert(smartUserMemory)
    .values({ userId, type, data })
    .returning();
  return row;
}

export async function getUserMemory(userId: number, type?: MemoryType, limit = 50) {
  const conditions = [eq(smartUserMemory.userId, userId)];
  if (type) conditions.push(eq(smartUserMemory.type, type));
  return db
    .select()
    .from(smartUserMemory)
    .where(and(...conditions))
    .orderBy(desc(smartUserMemory.createdAt))
    .limit(limit);
}

export async function recordView(userId: number, annonceId: number) {
  return saveMemory(userId, "view", { annonceId, viewedAt: new Date().toISOString() });
}

export async function recordNeed(userId: number, description: string, filters?: Record<string, unknown>) {
  return saveMemory(userId, "need", { description, filters: filters ?? {} });
}

export async function recordSearch(userId: number, query: string, filters: Record<string, unknown>, resultCount: number) {
  return saveMemory(userId, "search", { query, filters, resultCount, at: new Date().toISOString() });
}
