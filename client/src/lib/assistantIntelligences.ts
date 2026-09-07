/**
 * Signal d'ouverture de l'assistant MKA.P-MS Intelligences.
 *
 * Le panneau vit dans le Layout ; les boutons qui l'ouvrent vivent dans les
 * écrans (barre de recherche de l'accueil). Ils ne se connaissent pas : ils
 * passent par ce signal, ce qui permet d'ouvrir l'assistant depuis n'importe
 * quel écran sans dupliquer le panneau.
 */
import { useEffect } from "react";

const EVENEMENT = "mkapms:intelligences";

type Ordre = "ouvrir" | "fermer";

export function ouvrirIntelligences(): void {
  window.dispatchEvent(new CustomEvent<Ordre>(EVENEMENT, { detail: "ouvrir" }));
}

export function fermerIntelligences(): void {
  window.dispatchEvent(new CustomEvent<Ordre>(EVENEMENT, { detail: "fermer" }));
}

export function useOrdreIntelligences(onOrdre: (ordre: Ordre) => void): void {
  useEffect(() => {
    const ecoute = (e: Event) => onOrdre((e as CustomEvent<Ordre>).detail);
    window.addEventListener(EVENEMENT, ecoute);
    return () => window.removeEventListener(EVENEMENT, ecoute);
  }, [onOrdre]);
}
