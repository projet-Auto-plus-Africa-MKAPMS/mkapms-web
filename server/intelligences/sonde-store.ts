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
  dernierEffectifEcrit = null;
}

/**
 * Modèle d'empreintes réellement servi par le fournisseur lors du dernier appel réussi. Quand le modèle prouvé est refusé
 * et que le repli répond, c'est lui qui fait foi : sinon la reprise de l'existant et les compteurs chercheraient sans fin
 * des empreintes d'un modèle que le fournisseur ne sert plus. Conservé en base (ligne « empreintes_effectif » de la table
 * des preuves), donc durable : il n'expire pas et survit aux redémarrages. Il cesse de faire foi dès que la sonde
 * enregistre une preuve plus récente pour les empreintes (nouveau modèle prouvé).
 */
const CAPACITE_EFFECTIF = "empreintes_effectif";
let dernierEffectifEcrit: string | null = null;

export async function memoriserModeleEmpreintesEffectif(modele: string): Promise<void> {
  if (dernierEffectifEcrit === modele) return;
  try {
    await enregistrerPreuve({ capacite: CAPACITE_EFFECTIF, etat: "TESTED", modele, endpoint: "/v1/embeddings", httpStatus: 200, erreurType: "", erreurCode: "", details: { note: "Modèle réellement servi lors du dernier appel réussi." } });
    dernierEffectifEcrit = modele;
  } catch {
    // Base indisponible : le choix reste celui de la preuve de la sonde.
  }
}

export async function modeleEmpreintesEffectif(): Promise<string | null> {
  try {
    const lignes = await lirePreuves();
    const effectif = lignes.find((l) => l.capacite === CAPACITE_EFFECTIF);
    if (!effectif?.modele || !/^[A-Za-z0-9._-]{1,80}$/.test(effectif.modele)) return null;
    const preuve = lignes.find((l) => l.capacite === "empreintes_semantiques");
    // Une preuve de la sonde plus récente que le modèle effectif l'emporte : le modèle prouvé est alors à nouveau le bon.
    if (preuve && preuve.testeLe > effectif.testeLe) return null;
    return effectif.modele;
  } catch {
    return null;
  }
}
