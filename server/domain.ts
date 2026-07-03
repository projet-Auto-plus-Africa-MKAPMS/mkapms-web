/**
 * MKA.P-MS — Détection de domaine (multi-domain architecture)
 *
 * Trois portes d'entrée vers le même écosystème :
 *   mkapms.fr   → Plateforme principale France
 *   mkapms.pro  → Plateforme B2B professionnelle
 *   mkapms.site → Portail international mondial
 *
 * Même DB · Même Core Engine · Même JWT · Expériences différenciées
 */

import type { Request, Response, NextFunction } from "express";

export type DomainKey = "fr" | "pro" | "site";

export interface DomainContext {
  key: DomainKey;
  hostname: string;
  label: string;
  description: string;
  lang: string;
  seoTitle: string;
  seoDescription: string;
}

const DOMAIN_MAP: Record<string, DomainKey> = {
  "mkapms.fr": "fr",
  "www.mkapms.fr": "fr",
  "mkapms.pro": "pro",
  "www.mkapms.pro": "pro",
  "mkapms.site": "site",
  "www.mkapms.site": "site",
};

const DOMAIN_META: Record<DomainKey, Omit<DomainContext, "key" | "hostname">> = {
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

/**
 * Résout le domaine à partir du hostname de la requête.
 * En développement local ou sur Railway preview, retourne "fr" par défaut.
 */
export function resolveDomain(hostname: string): DomainKey {
  const clean = hostname.split(":")[0].toLowerCase();
  return DOMAIN_MAP[clean] ?? "fr";
}

/**
 * Construit le contexte complet du domaine.
 */
export function buildDomainContext(hostname: string): DomainContext {
  const key = resolveDomain(hostname);
  const meta = DOMAIN_META[key];
  return { key, hostname, ...meta };
}

/**
 * Middleware Express — injecte le contexte domaine dans req.domainContext
 * et expose l'endpoint GET /api/domain pour le client React.
 */
export function domainMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string) ||
    "mkapms.fr";
  (req as Request & { domainContext: DomainContext }).domainContext = buildDomainContext(host);
  next();
}

/**
 * Handler GET /api/domain — renvoie le contexte domaine au client React.
 * Réponse légère (< 200 octets), mise en cache 60 s côté client.
 */
export function domainHandler(req: Request, res: Response): void {
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string) ||
    "mkapms.fr";
  const ctx = buildDomainContext(host);
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json(ctx);
}
