import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Recherche véhicule partagée par les portails de vente.
 *
 * Les pages affichaient des filtres et un bouton « Rechercher » qui ne
 * pilotaient rien : les listes ignoraient la saisie. Ce module tient l'état des
 * filtres (brouillon + appliqué) et le filtrage réel, pour que chaque portail
 * garde ses propres critères (cylindrée, PTAC, volume, places…) sans réécrire
 * la logique à chaque fois.
 */

export interface VehicleFilters {
  q: string;
  marque: string;
  categorie: string;
  energie: string;
  annee: string;
  kmMax: string;
  prixMin: string;
  prixMax: string;
  /** Critères propres au portail : cylindrée, PTAC, volume, places, ville… */
  extra: Record<string, string>;
}

export const EMPTY_FILTERS: VehicleFilters = {
  q: "",
  marque: "",
  categorie: "",
  energie: "",
  annee: "",
  kmMax: "",
  prixMin: "",
  prixMax: "",
  extra: {},
};

/** Élément filtrable : tous les champs sont facultatifs, rien n'est inventé. */
export interface SearchableVehicle {
  nom?: string | null;
  titre?: string | null;
  marque?: string | null;
  modele?: string | null;
  cat?: string | null;
  categorie?: string | null;
  energie?: string | null;
  carburant?: string | null;
  annee?: number | string | null;
  km?: number | string | null;
  kilometrage?: number | string | null;
  prix?: number | string | null;
  ville?: string | null;
  [key: string]: unknown;
}

function text(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }
  return null;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function contains(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

/**
 * Un critère non renseigné n'exclut jamais. Un critère renseigné mais absent de
 * la donnée n'exclut pas non plus : mieux vaut montrer un véhicule dont on
 * ignore le détail que le faire disparaître silencieusement.
 */
export function matchesVehicle(item: SearchableVehicle, f: VehicleFilters): boolean {
  const label = [item.nom, item.titre, item.marque, item.modele, item.cat, item.categorie, item.ville]
    .map(text)
    .filter(Boolean)
    .join(" ");

  if (f.q.trim() && !f.q.trim().split(/\s+/).every((w) => contains(label, w))) return false;
  if (f.marque && !contains(label, f.marque)) return false;

  if (f.categorie) {
    const cat = text(item.cat) || text(item.categorie);
    if (cat && !contains(cat, f.categorie)) return false;
  }

  if (f.energie) {
    const e = text(item.energie) || text(item.carburant);
    if (e && !contains(e, f.energie)) return false;
  }

  const annee = num(item.annee);
  if (f.annee && annee !== null && annee < Number(f.annee)) return false;

  const km = num(item.km ?? item.kilometrage);
  if (f.kmMax && km !== null && km > Number(f.kmMax)) return false;

  const prix = num(item.prix);
  if (f.prixMin && prix !== null && prix < Number(f.prixMin)) return false;
  if (f.prixMax && prix !== null && prix > Number(f.prixMax)) return false;

  for (const [key, value] of Object.entries(f.extra)) {
    if (!value) continue;
    const raw = item[key];
    const asNum = num(raw);
    const asMax = num(value);
    // Un critère « jusqu'à X » (PTAC, volume, places) se compare en nombre ;
    // sinon on retombe sur une comparaison textuelle.
    if (asNum !== null && asMax !== null && /^\d/.test(value)) {
      if (asNum > asMax) return false;
    } else if (raw !== undefined && raw !== null && text(raw) && !contains(text(raw), value)) {
      return false;
    }
  }

  return true;
}

export function useVehicleSearch(
  initialExtra: Record<string, string> = {},
  /** Critères déjà connus, par exemple issus de l'adresse de la page. */
  initialFilters: Partial<Omit<VehicleFilters, "extra">> = {},
) {
  const initial = useMemo<VehicleFilters>(
    () => ({ ...EMPTY_FILTERS, ...initialFilters, extra: { ...initialExtra } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [draft, setDraft] = useState<VehicleFilters>(initial);
  const [applied, setApplied] = useState<VehicleFilters>(initial);

  const set = useCallback(<K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const setExtra = useCallback((key: string, value: string) => {
    setDraft((d) => ({ ...d, extra: { ...d.extra, [key]: value } }));
  }, []);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const apply = useCallback(() => setApplied(draftRef.current), []);

  const reset = useCallback(() => {
    setDraft(initial);
    setApplied(initial);
  }, [initial]);

  const activeCount = useMemo(() => {
    const base = [applied.q, applied.marque, applied.categorie, applied.energie, applied.annee, applied.kmMax, applied.prixMin, applied.prixMax];
    return base.filter(Boolean).length + Object.values(applied.extra).filter(Boolean).length;
  }, [applied]);

  const filter = useCallback(
    <T extends SearchableVehicle>(items: T[]): T[] => items.filter((i) => matchesVehicle(i, applied)),
    [applied],
  );

  return { draft, applied, set, setExtra, apply, reset, activeCount, filter };
}
