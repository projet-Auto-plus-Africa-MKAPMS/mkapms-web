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
import { providerStates } from "../../ai-fabric/service.js";
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
  /** LOT IA02A — voir server/intelligences/identite.ts et ai-fabric/service.ts::WireStatus. */
  fournisseurs: {
    /** Fournisseur de modèle configuré (clé présente) mais pas CONNECTED_AND_TESTED — ne doit jamais dépasser 0 : `chooseProvider()` ne le sélectionnerait de toute façon jamais, ce compteur dit s'il faut s'en inquiéter (clé posée pour rien) ou le câbler enfin. */
    routableNonConnecte: number;
    detailRoutableNonConnecte: string[];
  };
  detail: UniversConstate[];
}

/** Total de routes réellement déclarées par les moteurs (server/data/moteurs.ts) — référence pour le taux de couverture. */
function totalRoutesDeclarees(): number {
  return new Set(MOTEURS.flatMap((m) => m.routes)).size;
}

export async function rapportCouverture(): Promise<RapportCouverture> {
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
    fournisseurs: await fournisseursRoutablesNonConnectes(),
    detail: univers,
  };
}

/** LOT IA02A — fournisseur(s) de modèle configuré(s) sans être CONNECTED_AND_TESTED : jamais sélectionnés, mais une clé posée pour rien mérite d'être vue. */
async function fournisseursRoutablesNonConnectes(): Promise<RapportCouverture["fournisseurs"]> {
  const etats = await providerStates();
  const concernes = etats.filter(
    (s) =>
      (s.capability === "ia_texte" || s.capability === "ia_vision") &&
      s.wireStatus !== undefined &&
      s.wireStatus !== "CONNECTED_AND_TESTED" &&
      (s.status === "actif" || s.status === "configure"),
  );
  return {
    routableNonConnecte: concernes.length,
    detailRoutableNonConnecte: concernes.map((s) => `${s.label} (${s.wireStatus}) — clé configurée mais jamais sélectionnable`),
  };
}
