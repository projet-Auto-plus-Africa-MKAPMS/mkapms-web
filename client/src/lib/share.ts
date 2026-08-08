/**
 * Partage d'un lien MKA.P-MS.
 *
 * Le partage natif du navigateur n'est disponible que sur certains appareils
 * (mobiles, contexte sécurisé). Sans repli, le bouton « Partager » ne fait
 * strictement rien sur les autres environnements — d'où l'impression qu'il est
 * cassé. Cette fonction essaie successivement :
 *   1. le partage natif ;
 *   2. la copie du lien dans le presse-papiers ;
 *   3. une copie de secours (navigateurs sans API presse-papiers).
 */
export type ShareOutcome = "shared" | "copied" | "failed";

export interface ShareLinkInput {
  title?: string;
  text?: string;
  url?: string;
}

function legacyCopy(value: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export async function shareLink(input: ShareLinkInput = {}): Promise<ShareOutcome> {
  const url = input.url || window.location.href;
  const title = input.title || document.title;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: input.text, url });
      return "shared";
    } catch (err) {
      // L'utilisateur a fermé la feuille de partage : ce n'est pas une erreur,
      // on ne bascule pas sur la copie pour ne pas agir contre son intention.
      if ((err as DOMException)?.name === "AbortError") return "shared";
    }
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    /* presse-papiers refusé (permission, contexte non sécurisé) */
  }

  return legacyCopy(url) ? "copied" : "failed";
}
