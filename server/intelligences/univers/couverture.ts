/**
 * MKA.P-MS Intelligences — Intelligence Coverage (audit de couverture).
 *
 * Rapport calculé, jamais déclaré : chaque nombre vient d'une lecture réelle
 * du Universe Registry (registre.ts), lui-même calculé depuis le Engine
 * Registry et le Tool Registry. Rien n'est présenté « prêt » sans preuve.
 *
 * Les appels directs à un fournisseur de modèle (point 129) sont vérifiés par
 * un outil séparé et déjà existant (scripts/check-providers.mjs, gate de
 * build) — ce fichier ne le réimplémente pas ; le script d'audit autonome
 * (scripts/gen-intelligence-coverage.ts) l'invoque en sous-processus et
 * complète ce rapport avec son résultat.
 */
import { MOTEURS } from "../../data/moteurs.js";
import { OUTILS } from "../outils/registre.js";
import { registre, type StatutConnexion, type UniversConstate } from "./registre.js";

export interface RapportCouverture {
  univers: {
    total: number;
    parStatut: Record<StatutConnexion, number>;
    conversationnels: number;
    nonConversationnels: number;
  };
  moteurs: {
    total: number;
    couvertsParUnUnivers: number;
  };
  routes: {
    total: number;
    couvertesParUnUnivers: number;
  };
  outils: {
    total: number;
    actifs: number;
    enregistresNonImplementes: number;
  };
  detail: UniversConstate[];
}

/** Total de routes réellement déclarées par les moteurs (server/data/moteurs.ts) — référence pour le taux de couverture. */
function totalRoutesDeclarees(): number {
  return new Set(MOTEURS.flatMap((m) => m.routes)).size;
}

export function rapportCouverture(): RapportCouverture {
  const univers = registre();

  const parStatut: Record<StatutConnexion, number> = {
    INTELLIGENCE_CONNECTED: 0,
    PARTIALLY_CONNECTED: 0,
    UI_ONLY: 0,
    BACKEND_ONLY: 0,
    REGISTERED_NOT_CONNECTED: 0,
    NO_INTELLIGENCE_INTEGRATION: 0,
  };
  for (const u of univers) parStatut[u.statut]++;

  const routesCouvertes = new Set(univers.flatMap((u) => u.routes)).size;

  return {
    univers: {
      total: univers.length,
      parStatut,
      conversationnels: univers.filter((u) => u.conversationnel).length,
      nonConversationnels: univers.filter((u) => !u.conversationnel).length,
    },
    moteurs: {
      total: MOTEURS.length,
      couvertsParUnUnivers: univers.reduce((n, u) => n + u.engineIds.length, 0),
    },
    routes: {
      total: totalRoutesDeclarees(),
      couvertesParUnUnivers: routesCouvertes,
    },
    outils: {
      total: OUTILS.length,
      actifs: OUTILS.filter((o) => o.enabled && o.implementationStatus !== "REGISTERED_NOT_IMPLEMENTED").length,
      enregistresNonImplementes: OUTILS.filter((o) => o.implementationStatus === "REGISTERED_NOT_IMPLEMENTED").length,
    },
    detail: univers,
  };
}
