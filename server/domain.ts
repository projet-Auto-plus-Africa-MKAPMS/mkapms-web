/**
 * MKA.P-MS — Registre de domaines (Règle 9 — Extensibilité)
 *
 * Architecture multi-domaines : même DB, même Core Engine, même JWT.
 * Chaque domaine est une "porte d'entrée" vers le même écosystème.
 *
 * ─── Domaines actifs ──────────────────────────────────────────────────────────
 *   mkapms.fr    → Plateforme principale France (particuliers & pros)
 *   mkapms.pro   → Plateforme B2B professionnelle (flottes, concessionnaires, API)
 *   mkapms.site  → Portail international mondial (47 pays, 18 devises)
 *
 * ─── Domaines futurs (à décommenter quand disponibles) ───────────────────────
 *   mkapms.africa → Portail dédié Afrique subsaharienne
 *   mkapms.eu     → Portail Union Européenne (conformité RGPD renforcée)
 *   mkapms.auto   → Portail premium constructeurs & importateurs
 *   mkapms.group  → Portail groupe & franchises
 *
 * ─── Comment ajouter un nouveau domaine ──────────────────────────────────────
 *   1. Ajouter la clé dans DomainKey (ex: "africa")
 *   2. Ajouter les entrées hostname dans DOMAIN_REGISTRY
 *   3. Ajouter les métadonnées dans DOMAIN_META
 *   4. Créer la page Home correspondante côté client (HomeAfrica.tsx)
 *   5. Ajouter la case dans DomainHome (App.tsx) et DomainSelector
 *   6. Ajouter les chemins statiques dans seo.ts > DOMAIN_SEO
 *   Le Core Engine (tRPC, Drizzle, DB) n'est JAMAIS modifié.
 */

import type { Request, Response, NextFunction } from "express";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Clés de domaine actives.
 * Pour ajouter un domaine futur, étendre ce type :
 *   export type DomainKey = "fr" | "pro" | "site" | "africa" | "eu" | "auto" | "group";
 */
export type DomainKey = "fr" | "pro" | "site";

export interface DomainContext {
  key: DomainKey;
  hostname: string;
  label: string;
  description: string;
  lang: string;
  seoTitle: string;
  seoDescription: string;
  /** Indique si ce domaine est en phase bêta / non encore public */
  beta?: boolean;
}

export interface DomainRegistryEntry {
  key: DomainKey;
  /** Tous les hostnames qui pointent vers ce domaine (avec et sans www) */
  hostnames: string[];
}

// ─── Registre des domaines ────────────────────────────────────────────────────
//
// C'est ici et seulement ici que l'on déclare les domaines.
// Aucune autre partie du Core Engine n'a besoin d'être modifiée.
//
const DOMAIN_REGISTRY: DomainRegistryEntry[] = [
  // ── Actifs ────────────────────────────────────────────────────────────────
  {
    key: "fr",
    hostnames: ["mkapms.fr", "www.mkapms.fr"],
  },
  {
    key: "pro",
    hostnames: ["mkapms.pro", "www.mkapms.pro"],
  },
  {
    key: "site",
    hostnames: ["mkapms.site", "www.mkapms.site"],
  },

  // ── Futurs (décommenter quand le domaine est acquis et configuré) ─────────
  // { key: "africa", hostnames: ["mkapms.africa", "www.mkapms.africa"] },
  // { key: "eu",     hostnames: ["mkapms.eu",     "www.mkapms.eu"    ] },
  // { key: "auto",   hostnames: ["mkapms.auto",   "www.mkapms.auto"  ] },
  // { key: "group",  hostnames: ["mkapms.group",  "www.mkapms.group" ] },
];

// ─── Métadonnées par domaine ──────────────────────────────────────────────────

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
      "The worldwide automotive marketplace. Buy, sell, rent and repair your vehicle in your country, in your language, with your currency. 47 countries, 18 currencies.",
  },

  // ── Futurs (décommenter avec la clé correspondante dans DomainKey) ────────
  // africa: {
  //   label: "MKA.P-MS Africa",
  //   description: "Portail automobile dédié à l'Afrique subsaharienne.",
  //   lang: "fr",
  //   seoTitle: "MKA.P-MS Africa — Marketplace Automobile Africaine",
  //   seoDescription: "La marketplace automobile de référence en Afrique subsaharienne.",
  //   beta: true,
  // },
  // eu: {
  //   label: "MKA.P-MS EU",
  //   description: "Portail Union Européenne — conformité RGPD renforcée.",
  //   lang: "fr",
  //   seoTitle: "MKA.P-MS EU — Marketplace Automobile Européenne",
  //   seoDescription: "La marketplace automobile conforme RGPD pour l'Union Européenne.",
  //   beta: true,
  // },
};

// ─── Index de résolution rapide (hostname → DomainKey) ───────────────────────
//
// Construit une seule fois au démarrage du serveur.
// O(1) par requête.
//
const HOSTNAME_INDEX = new Map<string, DomainKey>();
for (const entry of DOMAIN_REGISTRY) {
  for (const hostname of entry.hostnames) {
    HOSTNAME_INDEX.set(hostname.toLowerCase(), entry.key);
  }
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

/**
 * Résout le domaine à partir du hostname de la requête.
 * En développement local ou sur Railway preview, retourne "fr" par défaut.
 */
export function resolveDomain(hostname: string): DomainKey {
  const clean = hostname.split(":")[0].toLowerCase();
  return HOSTNAME_INDEX.get(clean) ?? "fr";
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
 * Retourne la liste de tous les domaines actifs (pour les sélecteurs UI, le SEO, etc.).
 */
export function listActiveDomains(): Array<{ key: DomainKey; label: string; hostnames: string[] }> {
  return DOMAIN_REGISTRY.map((entry) => ({
    key: entry.key,
    label: DOMAIN_META[entry.key].label,
    hostnames: entry.hostnames,
  }));
}

/**
 * Middleware Express — injecte le contexte domaine dans req.domainContext.
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
 * Réponse légère (< 300 octets), mise en cache 60 s côté client.
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

/**
 * Handler GET /api/domains — liste tous les domaines actifs.
 * Utile pour les outils d'administration et les sélecteurs dynamiques.
 */
export function domainsListHandler(_req: Request, res: Response): void {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(listActiveDomains());
}
