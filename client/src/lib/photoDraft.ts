/**
 * Brouillon photo partagé entre l'écran de guidage photo du portail
 * (/depot-annonce/photos-vehicule) et le dépôt qui publie réellement l'annonce.
 *
 * Sans lui, une photo envoyée depuis l'écran de guidage serait perdue : cet
 * écran n'appelle pas `annonces.create`. Le dépôt relit le brouillon à
 * l'ouverture, puis le vide une fois les photos reprises.
 */
const KEY = "mka_photo_draft";

export type PhotoDraft = Record<string, string[]>;

export function readPhotoDraft(): PhotoDraft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: PhotoDraft = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) out[k] = v.filter((u): u is string => typeof u === "string");
    }
    return out;
  } catch {
    return {};
  }
}

export function addToPhotoDraft(categorie: string, urls: string[]): void {
  if (!urls.length) return;
  const draft = readPhotoDraft();
  draft[categorie] = [...(draft[categorie] || []), ...urls];
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* quota dépassé : les photos restent visibles à l'écran, rien n'est masqué */
  }
}

export function clearPhotoDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien à faire */
  }
}
