/**
 * MKA.P-MS — Routage des pages produits par univers
 *
 * Source unique de vérité pour construire l'URL d'une annonce.
 * Chaque catégorie d'annonce a son propre chemin, son propre univers.
 *
 * ─── Règle définitive ────────────────────────────────────────────────────────
 *   officielle      → /acheter/mkapms-officiel/vehicule/:id
 *   professionnelle → /acheter/professionnel/vehicule/:id
 *   particulier     → /acheter/particulier/vehicule/:id
 *
 * La route générique /vehicule/:id reste en place comme fallback (liens
 * externes, partages, anciens bookmarks) et redirige vers le bon univers
 * une fois l'annonce chargée.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type CategorieAnnonce = "officielle" | "professionnelle" | "particulier";

/**
 * Retourne le chemin de base de l'univers pour une catégorie donnée.
 */
export function getUniversBase(categorieAnnonce?: string | null): string {
  switch (categorieAnnonce) {
    case "officielle":
      return "/acheter/mkapms-officiel";
    case "professionnelle":
      return "/acheter/professionnel";
    case "particulier":
    default:
      return "/acheter/particulier";
  }
}

/**
 * Retourne l'URL complète de la page produit pour une annonce.
 *
 * @param id - ID de l'annonce
 * @param categorieAnnonce - Catégorie de l'annonce (officielle / professionnelle / particulier)
 * @param vendeurType - Fallback si categorieAnnonce n'est pas disponible
 */
export function getAnnonceUrl(
  id: number,
  categorieAnnonce?: string | null,
  vendeurType?: string | null,
): string {
  // Priorité 1 : categorieAnnonce (champ canonique)
  if (categorieAnnonce) {
    return `${getUniversBase(categorieAnnonce)}/vehicule/${id}`;
  }
  // Priorité 2 : déduire depuis vendeurType
  if (vendeurType === "professionnel" || vendeurType === "concession") {
    return `/acheter/professionnel/vehicule/${id}`;
  }
  // Défaut : univers particulier
  return `/acheter/particulier/vehicule/${id}`;
}

/**
 * Retourne le libellé de l'univers pour le breadcrumb.
 */
export function getUniversLabel(categorieAnnonce?: string | null): string {
  switch (categorieAnnonce) {
    case "officielle":
      return "MKA.P-MS Officiel";
    case "professionnelle":
      return "Professionnel";
    case "particulier":
    default:
      return "Particulier";
  }
}

/**
 * Déduit la catégorie d'annonce depuis le pathname courant.
 * Utilisé dans Vehicule.tsx pour le breadcrumb de retour.
 */
export function getCategorieFromPath(pathname: string): CategorieAnnonce {
  if (pathname.includes("/acheter/mkapms-officiel")) return "officielle";
  if (pathname.includes("/acheter/professionnel")) return "professionnelle";
  return "particulier";
}
