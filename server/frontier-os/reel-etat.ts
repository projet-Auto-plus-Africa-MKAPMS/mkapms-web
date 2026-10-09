/**
 * Centre Cyber-Électrique — le mode réel est-il permis ? Deux clés INDÉPENDANTES, les deux requises, sinon FERMÉ :
 *  1. la variable d'environnement FRONTIER_MODE_REEL=oui (posée par la personne qui gère le service, hors du centre) ;
 *  2. l'armement par le PDG dans le centre, avec sa phrase de confirmation (config `reel_arme`).
 * Toute erreur de lecture vaut « non ». Fichier sans effet de bord : transport, vérification et décision de passage peuvent l'importer sans cycle.
 */
import { lireConfig } from "./journal.js";

export const ENV_MODE_REEL = "FRONTIER_MODE_REEL";
export const CLE_ARMEMENT_REEL = "reel_arme";

export const reelPermisParEnvironnement = (): boolean => process.env[ENV_MODE_REEL] === "oui";

export async function reelArme(): Promise<boolean> {
  try {
    return (await lireConfig<boolean>(CLE_ARMEMENT_REEL, false)) === true;
  } catch {
    return false;
  }
}

/** Vrai seulement si l'environnement le permet ET si le PDG a armé. */
export async function reelAutorise(): Promise<boolean> {
  return reelPermisParEnvironnement() && (await reelArme());
}
