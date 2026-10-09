/**
 * Portier du câble Boutique — un point d'accroche, rien d'autre. Le Centre Cyber-Électrique y branche, SI le PDG l'arme, sa décision de
 * passage. Principe : le centre ne peut que RESTREINDRE. Le câble reste maître de ce qu'il autorise ; le centre peut seulement refuser en plus.
 * Aucun portier branché, ou portier non armé : aucun changement de comportement (c'est l'état par défaut).
 *
 * Fichier-feuille : il n'importe rien, pour pouvoir être appelé depuis n'importe où (client de la Boutique, canaux entrants et sortants).
 */
export type SensPortier = "sortant" | "entrant";
export interface DecisionPortier {
  autorise: boolean;
  raison: string;
}
export type Portier = (canal: string, sens: SensPortier) => Promise<DecisionPortier>;

let courant: Portier | null = null;

export function brancherPortier(p: Portier | null): void {
  courant = p;
}

/** Interroge le portier. En cas d'erreur du portier lui-même, on ne bloque pas ici : c'est le portier qui décide de fermer par sécurité quand il est armé. */
export async function interrogerPortier(canal: string, sens: SensPortier): Promise<DecisionPortier> {
  if (!courant) return { autorise: true, raison: "aucun portier branché" };
  try {
    return await courant(canal, sens);
  } catch {
    return { autorise: true, raison: "portier indisponible (état par défaut : non armé)" };
  }
}
