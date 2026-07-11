/**
 * Feature 6 — Reconnaissance photo
 * Analyse les photos pour détecter : photos déjà utilisées, mêmes véhicules,
 * fausses annonces, doublons, incohérences.
 * Si doute : blocage temporaire + alerte admin + demande de vérification.
 *
 * Utilise un hash perceptuel simplifié (basé sur les données de la photo).
 */
import { db } from "../../db.js";
import { smartPhotoFingerprints, smartAlerts } from "../schema.js";
import { eq, and, ne, desc } from "drizzle-orm";
import crypto from "node:crypto";
// Renfort P1 — hash perceptuel (dHash), robuste à la recompression.
// N'enlève rien à la logique SHA-256 existante ; s'exécute EN PLUS.
import { indexPerceptualPhoto, findPerceptualMatches } from "./photo-perceptual.js";

function computeFingerprint(photoData: string): string {
  // Hash SHA-256 tronqué — les premières 64 chars suffisent pour la détection
  // Pour les photos base64, on hash le contenu brut
  const content = photoData.startsWith("data:") ? photoData.split(",")[1] ?? photoData : photoData;
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 64);
}

export async function indexPhoto(annonceId: number, photoIndex: number, photoData: string) {
  const fingerprint = computeFingerprint(photoData);
  const [row] = await db
    .insert(smartPhotoFingerprints)
    .values({ annonceId, photoIndex, fingerprint })
    .returning();
  // Renfort P1 : indexe AUSSI l'empreinte perceptuelle (préfixée p:) sans
  // remplacer l'empreinte SHA-256. Best-effort : n'échoue jamais.
  try { await indexPerceptualPhoto(annonceId, photoIndex, photoData); } catch { /* silencieux */ }
  return row;
}

export async function findDuplicatePhotos(annonceId: number, photoData: string) {
  const fingerprint = computeFingerprint(photoData);
  const matches = await db
    .select()
    .from(smartPhotoFingerprints)
    .where(
      and(
        eq(smartPhotoFingerprints.fingerprint, fingerprint),
        ne(smartPhotoFingerprints.annonceId, annonceId)
      )
    );

  if (matches.length > 0) {
    await db.insert(smartAlerts).values({
      category: "doublon",
      title: `Photo identique détectée (annonce #${annonceId})`,
      description: `La photo correspond à ${matches.length} autre(s) annonce(s) : ${matches.map((m) => `#${m.annonceId}`).join(", ")}`,
      severity: "warning",
      targetType: "annonce",
      targetId: annonceId,
      metadata: { fingerprint, matchedAnnonces: matches.map((m) => m.annonceId) },
    });
  }

  // Renfort P1 : recherche EN PLUS des correspondances perceptuelles
  // (photos visuellement identiques mais recompressées / redimensionnées).
  // Best-effort — n'affecte jamais le résultat retourné à l'appelant.
  try { await findPerceptualMatches(annonceId, photoData); } catch { /* silencieux */ }

  return matches;
}

export async function indexAllPhotos(annonceId: number, photos: string[]) {
  const results = [];
  for (let i = 0; i < photos.length; i++) {
    const r = await indexPhoto(annonceId, i, photos[i]);
    results.push(r);
  }
  return results;
}
