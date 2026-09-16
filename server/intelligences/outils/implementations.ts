/**
 * MKA.P-MS AI — agrège les implémentations réelles de toutes les
 * familles d'outils. Chaque famille garde son fichier d'implémentation
 * propre (outils-test.ts, familles/outils-vehicules.ts, …) ; ce fichier ne
 * fait que les réunir pour executeur.ts, sans logique métier.
 */
import type { ImplementationOutil } from "./outils-test.js";
import { IMPLEMENTATIONS as IMPL_TEST } from "./outils-test.js";
import { IMPLEMENTATIONS as IMPL_VEHICULES } from "./familles/outils-vehicules.js";
import { IMPLEMENTATIONS as IMPL_CHANTIER } from "./familles/outils-chantier.js";
import { IMPLEMENTATIONS as IMPL_ESTIMATIONS } from "./familles/outils-estimations.js";
import { IMPLEMENTATIONS as IMPL_MEMOIRE } from "./familles/outils-memoire.js";
import { IMPLEMENTATIONS as IMPL_FICHIERS_RAG } from "./familles/outils-fichiers-rag.js";

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  ...IMPL_TEST,
  ...IMPL_VEHICULES,
  ...IMPL_CHANTIER,
  ...IMPL_ESTIMATIONS,
  ...IMPL_MEMOIRE,
  ...IMPL_FICHIERS_RAG,
};
