/**
 * Feature 5 — Détection doublon annonce
 * Vérifie avant publication : même plaque, même VIN, mêmes photos, même vendeur,
 * même description, même véhicule déjà actif.
 * Une même plaque ne peut pas créer plusieurs annonces actives dans le même pays.
 */
import { db } from "../../db.js";
import { annonces } from "../../schema.js";
import { smartDuplicates, smartPhotoFingerprints } from "../schema.js";
import { and, eq, ne, sql, desc } from "drizzle-orm";
import { logActivity } from "./activity-log.js";

interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: Array<{
    annonceId: number;
    type: string;
    confidence: number;
  }>;
}

export async function checkDuplicates(annonceId: number): Promise<DuplicateCheckResult> {
  const [annonce] = await db.select().from(annonces).where(eq(annonces.id, annonceId)).limit(1);
  if (!annonce) return { isDuplicate: false, matches: [] };

  const matches: DuplicateCheckResult["matches"] = [];

  // 1. Même plaque d'immatriculation (confiance 95%)
  if (annonce.plaque) {
    const plaqueMatches = await db
      .select({ id: annonces.id })
      .from(annonces)
      .where(
        and(
          eq(annonces.plaque, annonce.plaque),
          ne(annonces.id, annonceId),
          eq(annonces.status, "publiee")
        )
      );
    for (const m of plaqueMatches) {
      matches.push({ annonceId: m.id, type: "plaque", confidence: 95 });
    }
  }

  // 2. Même VIN (confiance 98%)
  if (annonce.vin) {
    const vinMatches = await db
      .select({ id: annonces.id })
      .from(annonces)
      .where(
        and(
          eq(annonces.vin, annonce.vin),
          ne(annonces.id, annonceId),
          eq(annonces.status, "publiee")
        )
      );
    for (const m of vinMatches) {
      matches.push({ annonceId: m.id, type: "vin", confidence: 98 });
    }
  }

  // 3. Même vendeur + même marque/modèle/année (confiance 70%)
  if (annonce.ownerId && annonce.marque && annonce.modele) {
    const vendeurMatches = await db
      .select({ id: annonces.id })
      .from(annonces)
      .where(
        and(
          eq(annonces.ownerId, annonce.ownerId),
          eq(annonces.marque, annonce.marque),
          eq(annonces.modele, annonce.modele),
          ne(annonces.id, annonceId),
          eq(annonces.status, "publiee")
        )
      );
    for (const m of vendeurMatches) {
      matches.push({ annonceId: m.id, type: "vendeur", confidence: 70 });
    }
  }

  // Sauvegarder les doublons détectés
  if (matches.length > 0) {
    await db.insert(smartDuplicates).values(
      matches.map((m) => ({
        annonceId,
        matchedAnnonceId: m.annonceId,
        type: m.type as any,
        confidence: m.confidence,
      }))
    );
    await logActivity({
      action: "duplicate_detected",
      targetType: "annonce",
      targetId: annonceId,
      data: { matches },
      result: "pending",
      proposedDecision: `${matches.length} doublon(s) détecté(s) — vérification requise`,
    });
  }

  return { isDuplicate: matches.length > 0, matches };
}

export async function getUnresolvedDuplicates(limit = 50) {
  return db
    .select()
    .from(smartDuplicates)
    .where(eq(smartDuplicates.resolved, false))
    .orderBy(desc(smartDuplicates.confidence), desc(smartDuplicates.createdAt))
    .limit(limit);
}

export async function resolveDuplicate(id: number, resolvedBy: number) {
  await db
    .update(smartDuplicates)
    .set({ resolved: true, resolvedBy, resolvedAt: new Date() })
    .where(eq(smartDuplicates.id, id));
}
