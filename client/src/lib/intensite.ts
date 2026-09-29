/**
 * Intensité de réflexion — réglage partagé entre tous les écrans AL-HUDHUD·M
 * (CentreIntelligences.tsx, Conversation.tsx). Un seul modèle est configuré
 * par fournisseur : ceci ne choisit jamais un modèle, ça règle une valeur
 * réelle et documentée chez le fournisseur (`reasoning_effort`, voir
 * server/intelligences/provider.ts) qui fait réfléchir le modèle plus ou
 * moins longtemps avant de répondre. Extrait ici pour qu'aucun des deux
 * écrans ne réimplémente sa propre version de ce réglage.
 */
export type Intensite = "minimal" | "low" | "medium" | "high";

export const NIVEAUX_INTENSITE: { valeur: Intensite; libelle: string }[] = [
  { valeur: "minimal", libelle: "Minimal" },
  { valeur: "low", libelle: "Léger" },
  { valeur: "medium", libelle: "Moyen" },
  { valeur: "high", libelle: "Élevé" },
];

const INTENSITE_VALIDE = new Set<string>(NIVEAUX_INTENSITE.map((n) => n.valeur));

export function intensiteValide(valeur: string | null): Intensite {
  return valeur && INTENSITE_VALIDE.has(valeur) ? (valeur as Intensite) : "medium";
}

export const CLE_INTENSITE_STOCKAGE = "mkapms_intensite_ia";
