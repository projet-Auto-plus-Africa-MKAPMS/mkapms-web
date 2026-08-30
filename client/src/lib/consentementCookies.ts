/**
 * Consentement cookies du visiteur.
 *
 * Le choix doit tenir même sans compte : il est écrit dans le navigateur
 * (source appliquée par les scripts de mesure), et répliqué côté serveur quand
 * la personne est connectée pour qu'il suive son compte d'un appareil à l'autre.
 */
export type ConsentementCookies = { analytics: boolean; marketing: boolean };

const CLE = "mkapms_consentement_cookies";

export const CONSENTEMENT_PAR_DEFAUT: ConsentementCookies = { analytics: false, marketing: false };

export function lireConsentement(): ConsentementCookies {
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return { ...CONSENTEMENT_PAR_DEFAUT };
    const objet: unknown = JSON.parse(brut);
    if (typeof objet !== "object" || objet === null) return { ...CONSENTEMENT_PAR_DEFAUT };
    const lu = objet as Partial<ConsentementCookies>;
    return {
      analytics: lu.analytics === true,
      marketing: lu.marketing === true,
    };
  } catch {
    return { ...CONSENTEMENT_PAR_DEFAUT };
  }
}

export function ecrireConsentement(valeurs: ConsentementCookies): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(valeurs));
  } catch {
    // Navigation privée ou stockage refusé : le choix ne peut pas être mémorisé.
  }
}
