/**
 * Synchronisation des marques enregistrées auprès de la NHTSA (États-Unis, API publique vPIC « GetAllMakes »).
 *
 * Source réelle et réutilisable : données du gouvernement américain, sans clé. Elle donne l'ampleur (plus de douze mille noms :
 * constructeurs, carrossiers, remorques, motos, camions, artisans), PAS l'exhaustivité mondiale : une marque qui ne vend ni
 * n'immatricule rien aux États-Unis peut y manquer (plusieurs marques européennes et chinoises sont absentes). La catégorie de
 * véhicule n'est pas fournie par cette liste : elle reste « non renseignée ».
 *
 * Contraintes : adresse FIXE, GET seulement, aucune redirection suivie, délai borné, réponse validée avant toute écriture
 * (une réponse vide ou inattendue n'écrit rien et marque la source en erreur — jamais « synchronisée » sans preuve).
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { akeSources } from "./schema.js";
import { upsertNodesEnMasse, type NoeudEnMasse } from "./service.js";
import { recordSync } from "./sources.js";

export const SOURCE_NHTSA = "nhtsa_vpic";
export const URL_NHTSA_MARQUES = "https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json";
const SEUIL_MINIMUM = 1000;
const INTERVALLE_MS = 30 * 24 * 3600 * 1000;

type Fetch = typeof fetch;

export function normaliserNomMarque(brut: unknown): string | null {
  if (typeof brut !== "string") return null;
  const nom = brut.replace(/\s+/g, " ").trim();
  if (nom.length < 2 || nom.length > 120 || /^[\d\s.,-]+$/.test(nom)) return null;
  return nom;
}

export interface ResultatSyncNhtsa {
  ok: boolean;
  detail: string;
  recues: number;
  crees: number;
  confirmes: number;
  inchanges: number;
}

export async function synchroniserMarquesNhtsa(fetchImpl: Fetch = fetch): Promise<ResultatSyncNhtsa> {
  const echec = async (detail: string): Promise<ResultatSyncNhtsa> => {
    await recordSync({ code: SOURCE_NHTSA, ok: false, detail });
    return { ok: false, detail, recues: 0, crees: 0, confirmes: 0, inchanges: 0 };
  };
  let corps: unknown;
  try {
    const r = await fetchImpl(URL_NHTSA_MARQUES, { method: "GET", redirect: "error", signal: AbortSignal.timeout(60_000), headers: { Accept: "application/json", "User-Agent": "mkapms-ai" } });
    if (!r.ok) return echec(`La NHTSA a répondu avec une erreur (${r.status}).`);
    corps = await r.json();
  } catch {
    return echec("La NHTSA n'a pas répondu (réseau, délai dépassé ou réponse illisible).");
  }
  const resultats = (corps as { Results?: unknown } | null)?.Results;
  if (!Array.isArray(resultats)) return echec("Réponse inattendue de la NHTSA : liste des marques absente.");

  const noeuds: NoeudEnMasse[] = [];
  for (const x of resultats) {
    const nom = normaliserNomMarque((x as { Make_Name?: unknown })?.Make_Name);
    const id = (x as { Make_ID?: unknown })?.Make_ID;
    if (!nom) continue;
    noeuds.push({
      domain: "constructeur",
      kind: "marque",
      label: nom,
      summary: "Marque enregistrée auprès de la NHTSA (États-Unis) : constructeur, carrossier ou fabricant de véhicules vendus ou immatriculés aux États-Unis. Catégorie de véhicule non renseignée par cette source.",
      attributes: { nhtsaMakeId: typeof id === "number" ? id : null, sourceListe: "NHTSA vPIC GetAllMakes" },
      sourceRef: typeof id === "number" ? `GetAllMakes#${id}` : "GetAllMakes",
    });
  }
  if (noeuds.length < SEUIL_MINIMUM) return echec(`Réponse suspecte de la NHTSA : ${noeuds.length} marque(s) seulement (au moins ${SEUIL_MINIMUM} attendues). Rien n'a été écrit.`);

  const r = await upsertNodesEnMasse(
    noeuds,
    { sourceCode: SOURCE_NHTSA, license: "publique", licenseRef: "Données du gouvernement des États-Unis (NHTSA vPIC), domaine public", reliability: undefined },
    "knowledge_engine",
  );
  if (r.refusee) return echec(r.refusee);
  const detail = `${noeuds.length} marque(s) reçue(s) : ${r.crees} nouvelle(s), ${r.confirmes} déjà connue(s) confirmée(s), ${r.inchanges} inchangée(s).`;
  await recordSync({ code: SOURCE_NHTSA, ok: true, detail });
  return { ok: true, detail, recues: noeuds.length, crees: r.crees, confirmes: r.confirmes, inchanges: r.inchanges };
}

/** Rejoue la synchronisation au plus une fois par mois, et seulement si la dernière a réussi (ou n'a jamais eu lieu). */
export async function synchroniserNhtsaSiNecessaire(fetchImpl: Fetch = fetch, maintenant = Date.now()): Promise<ResultatSyncNhtsa | null> {
  const [src] = await db.select({ lastSyncAt: akeSources.lastSyncAt, everSynced: akeSources.everSynced, status: akeSources.status }).from(akeSources).where(eq(akeSources.code, SOURCE_NHTSA)).limit(1);
  if (src?.everSynced && src.status === "actif" && src.lastSyncAt && maintenant - src.lastSyncAt.getTime() < INTERVALLE_MS) return null;
  return synchroniserMarquesNhtsa(fetchImpl);
}
