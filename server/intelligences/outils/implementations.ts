/**
 * MKA.P-MS Intelligence — agrège les implémentations réelles de toutes les
 * familles d'outils. Chaque famille garde son fichier d'implémentation
 * propre (outils-test.ts, familles/outils-vehicules.ts, …) ; ce fichier ne
 * fait que les réunir pour executeur.ts, sans logique métier.
 */
import type { ImplementationOutil } from "./outils-test.js";
import { IMPLEMENTATIONS as IMPL_TEST } from "./outils-test.js";
import { IMPLEMENTATIONS as IMPL_VEHICULES } from "./familles/outils-vehicules.js";

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  ...IMPL_TEST,
  ...IMPL_VEHICULES,
};
