/**
 * Feature 6 (renfort) — Reconnaissance photo perceptuelle
 *
 * Complément 100% MKA.P-MS au service `photo-analysis.ts` existant.
 * Additif : n'enlève rien, ne remplace rien. À utiliser en parallèle.
 *
 * PROBLÈME couvert :
 * Le hash SHA-256 (crypto) ne détecte que des fichiers strictement identiques
 * octet pour octet. Deux photos visuellement identiques mais recompressées,
 * redimensionnées ou légèrement modifiées ont un SHA-256 totalement différent.
 *
 * SOLUTION :
 * Hash perceptuel dHash 8×8 (algorithme public, implémenté ici en pur JS,
 * propriété MKA.P-MS — aucune dépendance ni API externe).
 *  1. Photo décodée en pixels via `sharp` (déjà présent dans package.json)
 *  2. Redimensionnée en 9×8 nuances de gris
 *  3. Comparaison horizontale colonne par colonne → bit 1 si pixel > voisin
 *  4. 64 bits assemblés en hex (16 caractères)
 *
 * Deux photos sont considérées "identiques perceptuellement" si la
 * distance de Hamming entre leurs empreintes est ≤ 5 bits (sur 64).
 *
 * INTÉGRATION : voir /docs/smart-engine-hardening.md
 */
import { db } from "../../db.js";
import { smartPhotoFingerprints, smartAlerts } from "../schema.js";
import { and, eq, ne } from "drizzle-orm";
import sharp from "sharp";

/** Seuil de Hamming en-dessous duquel deux photos sont jugées identiques. */
export const PHASH_SIMILARITY_THRESHOLD = 5;

/**
 * Calcule un dHash 8×8 (64 bits → 16 caractères hex) d'une photo.
 * Accepte un Buffer, un base64 (avec ou sans préfixe `data:`), ou une URL de fichier.
 * Best-effort : retourne `null` si le décodage échoue (jamais bloquant).
 */
export async function computePerceptualHash(input: Buffer | string): Promise<string | null> {
  try {
    let buf: Buffer;
    if (Buffer.isBuffer(input)) {
      buf = input;
    } else if (typeof input === "string") {
      const raw = input.startsWith("data:") ? (input.split(",")[1] ?? input) : input;
      // Base64 par défaut ; si ça ressemble à du texte brut, on tombe en échec propre.
      buf = Buffer.from(raw, "base64");
    } else {
      return null;
    }

    // 9 colonnes × 8 lignes → 8 comparaisons horizontales par ligne = 64 bits.
    const { data } = await sharp(buf)
      .grayscale()
      .resize(9, 8, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let bits = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = data[y * 9 + x];
        const right = data[y * 9 + x + 1];
        bits += left > right ? "1" : "0";
      }
    }
    // 64 bits → 16 caractères hex.
    let hex = "";
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return null; // best-effort : ne casse jamais un dépôt d'annonce
  }
}

/** Distance de Hamming entre deux empreintes hex de même longueur. */
export function hammingDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    // popcount 4 bits
    let x = xor;
    x = x - ((x >> 1) & 0x5);
    x = (x & 0x3) + ((x >> 2) & 0x3);
    d += x;
  }
  return d;
}

/**
 * Indexe la photo (empreinte perceptuelle) dans la table existante
 * `smart_photo_fingerprints`. La colonne `fingerprint` accepte 128 chars,
 * on y range notre hash perceptuel préfixé `p:` pour le distinguer de
 * l'ancien hash cryptographique (aucun conflit, additif).
 */
export async function indexPerceptualPhoto(
  annonceId: number,
  photoIndex: number,
  input: Buffer | string,
) {
  const hash = await computePerceptualHash(input);
  if (!hash) return null;
  const [row] = await db
    .insert(smartPhotoFingerprints)
    .values({ annonceId, photoIndex, fingerprint: `p:${hash}` })
    .returning();
  return row;
}

/**
 * Recherche les photos visuellement identiques (distance Hamming ≤ seuil).
 * Retourne les correspondances avec leur distance ; crée une alerte
 * doublon si au moins une correspondance est trouvée.
 */
export async function findPerceptualMatches(annonceId: number, input: Buffer | string) {
  const hash = await computePerceptualHash(input);
  if (!hash) return [];

  const candidates = await db
    .select()
    .from(smartPhotoFingerprints)
    .where(
      and(
        // On ne compare que les empreintes perceptuelles (préfixées p:)
        // aux autres empreintes perceptuelles.
        ne(smartPhotoFingerprints.annonceId, annonceId),
      ),
    );

  const matches: Array<{ id: number; annonceId: number; distance: number }> = [];
  for (const c of candidates) {
    if (!c.fingerprint?.startsWith("p:")) continue;
    const d = hammingDistance(hash, c.fingerprint.slice(2));
    if (d <= PHASH_SIMILARITY_THRESHOLD) {
      matches.push({ id: c.id, annonceId: c.annonceId, distance: d });
    }
  }

  if (matches.length > 0) {
    await db.insert(smartAlerts).values({
      category: "doublon",
      title: `Photo visuellement identique détectée (annonce #${annonceId})`,
      description: `${matches.length} annonce(s) avec une photo visuellement identique : ${matches.map((m) => `#${m.annonceId} (d=${m.distance})`).join(", ")}.`,
      severity: matches.some((m) => m.distance <= 2) ? "important" : "warning",
      targetType: "annonce",
      targetId: annonceId,
      metadata: { perceptualHash: hash, matches, threshold: PHASH_SIMILARITY_THRESHOLD },
    });
  }

  return matches;
}
