/**
 * Feature 4 — Apprentissage dépôt d'annonce
 * Quand un utilisateur remplit manuellement une donnée (version, finition, motorisation...),
 * le système l'enregistre comme "proposée". Elle devient officielle après validation
 * ou plusieurs confirmations.
 */
import { db } from "../../db.js";
import { smartLearnedData } from "../schema.js";
import { and, eq, sql, desc } from "drizzle-orm";

interface LearnInput {
  field: string;
  marque?: string;
  modele?: string;
  value: string;
  submittedBy?: number;
}

export async function learnFromInput(input: LearnInput) {
  // Vérifier si cette valeur existe déjà
  const conditions = [
    eq(smartLearnedData.field, input.field),
    eq(smartLearnedData.value, input.value),
  ];
  if (input.marque) conditions.push(eq(smartLearnedData.marque, input.marque));
  if (input.modele) conditions.push(eq(smartLearnedData.modele, input.modele));

  const [existing] = await db
    .select()
    .from(smartLearnedData)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    // Incrémenter les confirmations
    const newCount = (existing.confirmations ?? 1) + 1;
    await db
      .update(smartLearnedData)
      .set({
        confirmations: newCount,
        status: newCount >= 3 ? "confirmed" : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(smartLearnedData.id, existing.id));
    return { ...existing, confirmations: newCount };
  }

  // Nouvelle entrée
  const [row] = await db
    .insert(smartLearnedData)
    .values({
      field: input.field,
      marque: input.marque ?? null,
      modele: input.modele ?? null,
      value: input.value,
      submittedBy: input.submittedBy ?? null,
    })
    .returning();
  return row;
}

export async function getPendingValidations(limit = 50) {
  return db
    .select()
    .from(smartLearnedData)
    .where(eq(smartLearnedData.status, "proposed"))
    .orderBy(desc(smartLearnedData.confirmations), desc(smartLearnedData.createdAt))
    .limit(limit);
}

export async function validateLearned(id: number, approved: boolean) {
  await db
    .update(smartLearnedData)
    .set({ status: approved ? "confirmed" : "rejected", updatedAt: new Date() })
    .where(eq(smartLearnedData.id, id));
}

export async function getConfirmedValues(field: string, marque?: string, modele?: string) {
  const conditions = [eq(smartLearnedData.field, field), eq(smartLearnedData.status, "confirmed")];
  if (marque) conditions.push(eq(smartLearnedData.marque, marque));
  if (modele) conditions.push(eq(smartLearnedData.modele, modele));

  return db
    .select({ value: smartLearnedData.value, confirmations: smartLearnedData.confirmations })
    .from(smartLearnedData)
    .where(and(...conditions))
    .orderBy(desc(smartLearnedData.confirmations));
}
