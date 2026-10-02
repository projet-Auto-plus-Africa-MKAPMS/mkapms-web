/**
 * Preuves des tests réels des capacités du fournisseur de modèles.
 *
 * Quatre états séparés, jamais confondus : « activé chez le fournisseur » ne
 * veut pas dire « branché dans MKA.P-MS AI » ni « fonctionnel ». FUNCTIONAL
 * n'est atteint qu'après une vraie requête réussie passant par l'adaptateur de
 * la plateforme.
 */
import { db } from "../db.js";
import { inSondesOpenai } from "./schema.js";

export const ETATS_CAPACITE = [
  "NOT_AVAILABLE",
  "AVAILABLE_IN_OPENAI",
  "ENABLED_FOR_PROJECT",
  "ADAPTER_READY",
  "CONNECTED_TO_MKA_PMS_IA",
  "TESTED",
  "FUNCTIONAL",
  "WAITING_EXTERNAL_ACCESS",
] as const;
export type EtatCapacite = (typeof ETATS_CAPACITE)[number];

export interface PreuveCapacite {
  capacite: string;
  etat: EtatCapacite;
  modele: string | null;
  endpoint: string;
  httpStatus: number | null;
  erreurType: string;
  erreurCode: string;
  details: Record<string, unknown>;
}

export async function enregistrerPreuve(p: PreuveCapacite): Promise<void> {
  const valeurs = {
    etat: p.etat,
    modele: p.modele,
    endpoint: p.endpoint.slice(0, 120),
    httpStatus: p.httpStatus,
    erreurType: p.erreurType.slice(0, 80),
    erreurCode: p.erreurCode.slice(0, 80),
    details: p.details,
    testeLe: new Date(),
  };
  await db
    .insert(inSondesOpenai)
    .values({ capacite: p.capacite, ...valeurs })
    .onConflictDoUpdate({ target: inSondesOpenai.capacite, set: valeurs });
}

export async function lirePreuves() {
  return db.select().from(inSondesOpenai);
}

const cache = new Map<string, { modele: string | null; expire: number }>();

/**
 * Dernier modèle ayant réellement répondu pour une capacité (état TESTED ou
 * FUNCTIONAL), ou null. Sert de première préférence aux adaptateurs : ils ne
 * devinent plus un nom de modèle, ils reprennent celui qui a été prouvé.
 */
export async function modeleValide(capacite: string): Promise<string | null> {
  const enCache = cache.get(capacite);
  if (enCache && enCache.expire > Date.now()) return enCache.modele;
  let modele: string | null = null;
  try {
    const lignes = await lirePreuves();
    const l = lignes.find((x) => x.capacite === capacite && (x.etat === "TESTED" || x.etat === "FUNCTIONAL"));
    modele = l?.modele && /^[A-Za-z0-9._-]{1,80}$/.test(l.modele) ? l.modele : null;
  } catch {
    // Base indisponible : les adaptateurs retombent sur leur liste fermée.
  }
  cache.set(capacite, { modele, expire: Date.now() + 5 * 60_000 });
  return modele;
}

export function oublierCacheModelesValides(): void {
  cache.clear();
}
