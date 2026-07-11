/**
 * Feature (renfort) — Seuils de confirmation dynamiques par domaine
 *
 * Additif : ne remplace PAS le seuil global `KB_CONFIRM_THRESHOLD = 3`
 * de `knowledge-base.ts`. Fournit une carte optionnelle que le service
 * existant peut consulter pour ajuster son seuil selon le domaine.
 *
 * MOTIVATION :
 * Toutes les données observées n'ont pas la même exigence de confiance :
 *  - Une nouvelle marque véhicule : rare et structurante → 2 suffit
 *  - Une "panne" : peu ambiguë → 2
 *  - Un mot-clé de recherche : très bruité → exiger 8
 *  - Un utilisateur / zone : sensible → 5
 *
 * INTÉGRATION suggérée dans `knowledge-base.ts` (à faire manuellement pour
 * ne pas entrer en conflit avec les autres agents) :
 *
 *   import { getConfirmThreshold } from "./domain-thresholds.js";
 *   ...
 *   const threshold = getConfirmThreshold(existing.domain);
 *   const promote = existing.status === "proposed" && newCount >= threshold;
 *
 * Tant que cette intégration n'est pas faite, le comportement reste
 * strictement identique — ce fichier est simplement disponible.
 */
import type { KbDomain } from "./knowledge-base.js";

/**
 * Seuils par domaine. Un domaine absent utilise le fallback (3) —
 * strictement compatible avec le comportement historique.
 */
export const DOMAIN_CONFIRM_THRESHOLDS: Partial<Record<KbDomain, number>> = {
  vehicule: 2, // marque / modèle : rare, promotion rapide
  piece: 2, // référence pièce : précise par nature
  panne: 2, // symptôme / cause : peu ambiguë
  service: 3, // service garage : moyen
  garage: 3,
  utilisateur: 5, // sensible : exiger plus d'observations
  recherche: 6,
  mot_cle: 8, // très bruité (fautes, variations)
};

export const DEFAULT_CONFIRM_THRESHOLD = 3;

export function getConfirmThreshold(domain: string): number {
  return (
    DOMAIN_CONFIRM_THRESHOLDS[domain as KbDomain] ?? DEFAULT_CONFIRM_THRESHOLD
  );
}
