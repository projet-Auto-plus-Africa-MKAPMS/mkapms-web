/**
 * MKA.P-MS — Contexte domaine côté client
 *
 * Détecte le domaine depuis window.location.hostname (instantané, sans appel réseau).
 * Expose un hook useDomain() utilisable dans n'importe quel composant React.
 *
 * Trois portes d'entrée :
 *   mkapms.fr   → "fr"   — Plateforme principale France
 *   mkapms.pro  → "pro"  — Plateforme B2B professionnelle
 *   mkapms.site → "site" — Portail international mondial
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

export type DomainKey = "fr" | "pro" | "site";

export interface DomainContext {
  key: DomainKey;
  hostname: string;
  label: string;
  description: string;
  lang: string;
  seoTitle: string;
  seoDescription: string;
  /** true si on est sur mkapms.fr ou localhost */
  isFrance: boolean;
  /** true si on est sur mkapms.pro */
  isPro: boolean;
  /** true si on est sur mkapms.site */
  isSite: boolean;
}

const DOMAIN_MAP: Record<string, DomainKey> = {
  "mkapms.fr": "fr",
  "www.mkapms.fr": "fr",
  "mkapms.pro": "pro",
  "www.mkapms.pro": "pro",
  "mkapms.site": "site",
  "www.mkapms.site": "site",
};

const DOMAIN_META: Record<DomainKey, Omit<DomainContext, "key" | "hostname" | "isFrance" | "isPro" | "isSite">> = {
  fr: {
    label: "MKA.P-MS France",
    description:
      "Plateforme principale France — Achat, vente, location, garage, dépannage pour particuliers et professionnels français.",
    lang: "fr-FR",
    seoTitle: "MKA.P-MS — Marketplace Automobile France",
    seoDescription:
      "Achetez, vendez, louez et réparez votre véhicule en France. Particuliers, garages, vendeurs et loueurs : MKA.P-MS est votre plateforme automobile de référence.",
  },
  pro: {
    label: "MKA.P-MS Pro",
    description:
      "Plateforme B2B professionnelle — Flottes, concessionnaires, importateurs, exportateurs, franchises et partenaires.",
    lang: "fr-FR",
    seoTitle: "MKA.P-MS Pro — Plateforme Automobile Professionnelle B2B",
    seoDescription:
      "La plateforme B2B dédiée aux professionnels de l'automobile : gestion de flotte, Garage+, Atelier Pro, Finance+, Marketplace B2B, API et outils professionnels.",
  },
  site: {
    label: "MKA.P-MS World",
    description:
      "Portail international mondial — Choisissez votre pays, votre langue et votre devise pour accéder à la plateforme automobile mondiale.",
    lang: "en",
    seoTitle: "MKA.P-MS — Global Automotive Marketplace",
    seoDescription:
      "The worldwide automotive marketplace. Buy, sell, rent and repair your vehicle in your country, in your language, with your currency.",
  },
};

function resolveDomainKey(hostname: string): DomainKey {
  const clean = hostname.split(":")[0].toLowerCase();
  return DOMAIN_MAP[clean] ?? "fr";
}

function buildDomainContext(hostname: string): DomainContext {
  const key = resolveDomainKey(hostname);
  const meta = DOMAIN_META[key];
  return {
    key,
    hostname,
    ...meta,
    isFrance: key === "fr",
    isPro: key === "pro",
    isSite: key === "site",
  };
}

// ─── Context React ───────────────────────────────────────────────────────────

const DomainCtx = createContext<DomainContext>(
  buildDomainContext(typeof window !== "undefined" ? window.location.hostname : "mkapms.fr"),
);

export function DomainProvider({ children }: { children: ReactNode }) {
  const ctx = useMemo(
    () => buildDomainContext(window.location.hostname),
    [],
  );

  return <DomainCtx.Provider value={ctx}>{children}</DomainCtx.Provider>;
}

export function useDomain(): DomainContext {
  return useContext(DomainCtx);
}
