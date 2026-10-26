/**
 * Boutons sans action — inventaire des boutons qui ne peuvent rien déclencher.
 *
 * Fichier GÉNÉRÉ par scripts/gen-boutons-sans-action.mjs depuis client/src.
 * Ne pas éditer à la main : `npm run gen:boutons` le régénère, et la
 * construction échoue s'il est périmé — donc tout nouveau bouton mort apparaît
 * dans la revue avant d'atteindre la production.
 *
 * Un bouton est relevé quand il n'a ni gestionnaire de clic, ni type
 * « submit », ni formulaire soumis autour de lui : à l'écran, appuyer dessus
 * ne produit rien. Le contrôle continu lit cet inventaire pour le rendre
 * visible côté direction (point 110 — boutons et redirections).
 */
export interface BoutonSansAction {
  /** Fichier source de l'écran concerné. */
  readonly fichier: string;
  /** Ligne du bouton dans ce fichier. */
  readonly ligne: number;
  /** Texte affiché sur le bouton, pour le reconnaître à l'écran. */
  readonly libelle: string;
}

export const BOUTONS_SANS_ACTION: readonly BoutonSansAction[] = [

];

/** Nombre d'écrans concernés. */
export function ecransConcernes(): string[] {
  return [...new Set(BOUTONS_SANS_ACTION.map((b) => b.fichier))].sort();
}
