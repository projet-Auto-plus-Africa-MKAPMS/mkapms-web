/**
 * Feature (renfort) — Rate limiter en mémoire pour actions sensibles
 *
 * Additif : nouveau service utilitaire 100% MKA.P-MS, aucune dépendance
 * externe (pas de Redis, pas d'API tierce). Utilise une petite carte en
 * mémoire process — parfait pour protéger des mutations à faible débit
 * (chat "Apprentissage privé" du PDG, opérations d'écriture unitaires).
 *
 * MOTIVATION :
 * Le chat `smartEngine.teach` accepte du texte libre en `text` illimité.
 * Un compte PDG compromis pourrait spammer `smart_teachings`. Un simple
 * limiteur de débit (fenêtre glissante) élimine ce vecteur sans casser
 * l'usage normal (un PDG écrit rarement plus de quelques messages/minute).
 *
 * INTÉGRATION suggérée dans `router.ts` (à faire manuellement — le service
 * est écrit pour être plug-and-play) :
 *
 *   import { assertRate } from "./services/rate-limiter.js";
 *   ...
 *   teach: directionProcedure.input(...).mutation(async ({ input, ctx }) => {
 *     assertRate(`teach:${ctx.user.id}`, { max: 30, windowMs: 60_000 });
 *     ...
 *   })
 *
 * Tant que cette intégration n'est pas faite, ce service est simplement
 * disponible et inutilisé.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateOptions {
  max: number; // nb d'événements max
  windowMs: number; // fenêtre glissante en millisecondes
}

/**
 * Lève une erreur si la clé dépasse le débit autorisé.
 * Utilise `Error` standard pour rester compatible avec la gestion d'erreur
 * tRPC existante (mappé sur INTERNAL_SERVER_ERROR / TOO_MANY_REQUESTS
 * selon la préférence de l'appelant).
 */
export function assertRate(key: string, opts: RateOptions): void {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  const b = buckets.get(key) ?? { hits: [] };
  // Purge des hits en dehors de la fenêtre
  b.hits = b.hits.filter((t) => t > cutoff);
  if (b.hits.length >= opts.max) {
    const err = new Error(
      `Trop de requêtes — limite : ${opts.max} par ${Math.round(opts.windowMs / 1000)}s.`,
    );
    // @ts-expect-error — champ additionnel pour l'appelant
    err.code = "TOO_MANY_REQUESTS";
    throw err;
  }
  b.hits.push(now);
  buckets.set(key, b);
}

/**
 * Version non-throw : renvoie true si l'action est autorisée, false sinon.
 * Utile pour du soft-throttling (logging silencieux).
 */
export function tryRate(key: string, opts: RateOptions): boolean {
  try {
    assertRate(key, opts);
    return true;
  } catch {
    return false;
  }
}

/** Valeur maximale conseillée pour un message chat PDG (caractères). */
export const MAX_TEACH_MESSAGE_LENGTH = 4000;

/**
 * Valide et normalise le texte d'un message chat PDG.
 * - Trim + limitation de longueur (jamais > `MAX_TEACH_MESSAGE_LENGTH`)
 * - Vide → null (l'appelant décidera de rejeter)
 */
export function sanitizeTeachMessage(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  return s.slice(0, MAX_TEACH_MESSAGE_LENGTH);
}

/** Vider le limiteur (tests, redémarrage propre). */
export function _resetRateLimiterForTests(): void {
  buckets.clear();
}
