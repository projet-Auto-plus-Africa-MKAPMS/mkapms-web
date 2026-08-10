/**
 * MKA.P-MS — SEO indépendant par domaine (Règle 6)
 *
 * Chaque domaine possède :
 *   - son propre sitemap.xml
 *   - ses propres métadonnées (title, description)
 *   - ses propres balises SEO (Open Graph, Twitter Card, JSON-LD)
 *   - ses propres mots-clés
 *   - son propre robots.txt
 *
 * Tout en partageant la même base de données d'annonces.
 */

import type { Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { annonces, annoncePhotos, seoPages, garagesPublics, seoBlogArticles } from "./schema.js";
import { resolveDomain, type DomainKey } from "./domain.js";
import { STATIC_SEO, breadcrumbSchema, homeSchema } from "./seo-static.js";
import { reputationJsonLdBlock } from "./reputation-engine/seo.js";
import {
  publicReputationPage,
  universWithPublicReviews,
} from "./reputation-engine/public-pages.js";

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseUrlFrom(req: Request): string {
  const envUrl = process.env.PUBLIC_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function hostFrom(req: Request): string {
  return (
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string) ||
    "mkapms.fr"
  );
}

// ─── Métadonnées SEO par domaine ──────────────────────────────────────────────

interface DomainSeoMeta {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  keywords: string;
  lang: string;
  ogLocale: string;
  /** Chemins statiques à inclure dans le sitemap */
  staticPaths: string[];
}

const DOMAIN_SEO: Record<DomainKey, DomainSeoMeta> = {
  fr: {
    siteName: "MKA.P-MS France",
    defaultTitle: "MKA.P-MS — Marketplace Automobile France",
    defaultDescription:
      "Achetez, vendez, louez et réparez votre véhicule en France. Particuliers, garages, vendeurs et loueurs : MKA.P-MS est votre plateforme automobile de référence.",
    keywords:
      "voiture occasion, achat voiture, vente voiture, location voiture, garage, réparation auto, marketplace automobile, France, particulier, professionnel",
    lang: "fr",
    ogLocale: "fr_FR",
    staticPaths: [
      "/",
      "/acheter",
      "/acheter/particulier",
      "/acheter/professionnel",
      "/acheter/mkapms-officiel",
      "/acheter/minibus",
      "/acheter/camions-engins",
      "/louer",
      "/vendre",
      "/garages",
      "/pieces",
      "/devis",
      "/finance",
      "/demarches",
      "/livraison",
      "/depannage",
      "/univers",
      "/abonnements",
      "/confiance",
      "/aide",
    ],
  },
  pro: {
    siteName: "MKA.P-MS Pro",
    defaultTitle: "MKA.P-MS Pro — Plateforme Automobile Professionnelle B2B",
    defaultDescription:
      "La plateforme B2B dédiée aux professionnels de l'automobile : gestion de flotte, Garage+, Atelier Pro, Finance+, Marketplace B2B, API et outils professionnels.",
    keywords:
      "plateforme automobile B2B, gestion flotte, concessionnaire, importateur exportateur, garage professionnel, API automobile, abonnement pro, franchise auto",
    lang: "fr",
    ogLocale: "fr_FR",
    staticPaths: [
      "/",
      "/espace-pro",
      "/garage-plus",
      "/atelier-pro",
      "/comptabilite",
      "/finance",
      "/entreprises/gestion-parc",
      "/labs/place-marche-b2-b",
      "/import-africa",
      "/labs/data-cloud-auto",
      "/abonnements",
      "/partenaires/inscription-partenaire",
      "/devis",
      "/vente/tableau-bord-vendeur",
    ],
  },
  site: {
    siteName: "MKA.P-MS World",
    defaultTitle: "MKA.P-MS — Global Automotive Marketplace",
    defaultDescription:
      "The worldwide automotive marketplace. Buy, sell, rent and repair your vehicle in your country, in your language, with your currency. 47 countries, 18 currencies.",
    keywords:
      "global automotive marketplace, buy car worldwide, sell car international, vehicle rental, auto repair network, Africa, Europe, Middle East, car platform",
    lang: "en",
    ogLocale: "en_US",
    staticPaths: [
      "/",
      "/acheter",
      "/louer",
      "/vendre",
      "/garages",
      "/mk-global-engine",
      "/expansion/phase-europe",
      "/expansion/phase-afrique-nord",
      "/expansion/phase-afrique-ouest",
      "/expansion/phase-moyen-orient",
      "/expansion/phase-amerique-nord",
      "/expansion/phase-asie",
      "/abonnements",
      "/partenaires/inscription-partenaire",
    ],
  },
};

// ─── SEO multilingue : alternates hreflang (Priorité 2) ──────────────────────
//
// Chaque langue publique pointe vers son domaine. Une seule URL par langue
// (pas de doublon fr↔pro qui déclencherait un conflit hreflang côté Google).
// `x-default` renvoie vers le portail international.
const HREFLANG_DOMAINS: ReadonlyArray<{ hreflang: string; origin: string }> = [
  { hreflang: "fr", origin: "https://mkapms.fr" },
  { hreflang: "en", origin: "https://mkapms.site" },
  { hreflang: "x-default", origin: "https://mkapms.site" },
];

/**
 * Construit les balises <link rel="alternate" hreflang> pour un chemin donné,
 * afin que chaque langue soit indexée indépendamment (P2 — SEO par langue).
 */
function hreflangLinks(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return HREFLANG_DOMAINS.map(
    (d) => `<link rel="alternate" hreflang="${d.hreflang}" href="${escapeHtml(`${d.origin}${clean}`)}" />`,
  ).join("\n    ");
}

/** Extrait le chemin (pathname) d'une URL canonique absolue, avec repli sûr. */
function pathFromCanonical(canonical: string): string {
  try {
    return new URL(canonical).pathname || "/";
  } catch {
    return "/";
  }
}

// ─── SEO Annonce ──────────────────────────────────────────────────────────────

async function annonceSeoHead(
  id: number,
  baseUrl: string,
  domainKey: DomainKey,
): Promise<string | null> {
  const [a] = await db.select().from(annonces).where(eq(annonces.id, id)).limit(1);
  if (!a || a.status !== "publiee") return null;

  const photos = await db
    .select()
    .from(annoncePhotos)
    .where(eq(annoncePhotos.annonceId, id))
    .orderBy(annoncePhotos.ordre);

  const meta = DOMAIN_SEO[domainKey];
  const url = `${baseUrl}/vehicule/${a.id}`;
  const prix = Number(a.prix) || 0;

  const title = `${a.titre} — ${a.marque} ${a.modele}${a.annee ? ` (${a.annee})` : ""} | ${meta.siteName}`;
  const descParts = [
    `${a.marque} ${a.modele}`,
    a.annee ? `${a.annee}` : "",
    a.kilometrage ? `${a.kilometrage.toLocaleString("fr-FR")} km` : "",
    a.carburant,
    a.ville ? `à ${a.ville}` : "",
    prix ? `— ${prix.toLocaleString("fr-FR")} €` : "",
  ].filter(Boolean);
  const description = (a.description?.slice(0, 200) || descParts.join(" · "))
    .replace(/\s+/g, " ")
    .trim();
  const image = photos[0]?.url || `${baseUrl}/favicon.svg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": a.type === "vente" ? "Vehicle" : "Product",
    name: a.titre,
    description,
    brand: a.marque,
    model: a.modele,
    ...(a.annee ? { vehicleModelDate: String(a.annee) } : {}),
    ...(a.kilometrage
      ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: a.kilometrage, unitCode: "KMT" } }
      : {}),
    ...(a.carburant ? { fuelType: a.carburant } : {}),
    image: photos.map((p) => p.url).slice(0, 8),
    url,
    sku: a.reference || `MKA-A-${a.id}`,
    offers: {
      "@type": "Offer",
      price: prix,
      priceCurrency: a.devise || "EUR",
      availability: "https://schema.org/InStock",
      url,
    },
  };

  // Alternates hreflang par langue (une URL par langue — cf. hreflangLinks).
  const hreflang = hreflangLinks(`/vehicule/${a.id}`);

  return [
    `<html lang="${meta.lang}">`,
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    hreflang,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:locale" content="${meta.ogLocale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
}

// ─── Constructeur de <head> générique ─────────────────────────────────────────

interface HeadInput {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  image?: string;
  type?: string;
  lang: string;
  jsonLd?: object[];
}

function buildHead(h: HeadInput): string {
  const parts = [
    `<html lang="${h.lang}">`,
    `<title>${escapeHtml(h.title)}</title>`,
    `<meta name="description" content="${escapeHtml(h.description)}" />`,
    h.keywords ? `<meta name="keywords" content="${escapeHtml(h.keywords)}" />` : "",
    `<link rel="canonical" href="${escapeHtml(h.canonical)}" />`,
    hreflangLinks(pathFromCanonical(h.canonical)),
    `<meta property="og:type" content="${h.type || "website"}" />`,
    `<meta property="og:title" content="${escapeHtml(h.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(h.description)}" />`,
    h.image ? `<meta property="og:image" content="${escapeHtml(h.image)}" />` : "",
    `<meta property="og:url" content="${escapeHtml(h.canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(h.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(h.description)}" />`,
    h.image ? `<meta name="twitter:image" content="${escapeHtml(h.image)}" />` : "",
    ...(h.jsonLd || []).map(
      (j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`,
    ),
  ];
  return parts.filter(Boolean).join("\n    ");
}

/** SEO d'une page publique curée (marque, achat, location, garages, pièces…). */
function staticSeoHead(path: string, baseUrl: string, domainKey: DomainKey): string | null {
  const meta = DOMAIN_SEO[domainKey];
  const s = STATIC_SEO[path];
  const canonical = `${baseUrl}${path}`;
  const jsonLd: object[] = [];

  if (path === "/") {
    jsonLd.push(...homeSchema(baseUrl, meta.siteName));
    return buildHead({
      title: meta.defaultTitle,
      description: meta.defaultDescription,
      keywords: meta.keywords,
      canonical: `${baseUrl}/`,
      lang: meta.lang,
      jsonLd,
    });
  }

  if (!s) return null;
  jsonLd.push(breadcrumbSchema(baseUrl, path, s.title));
  return buildHead({
    title: `${s.title} | ${meta.siteName}`,
    description: s.description,
    keywords: s.keywords || meta.keywords,
    canonical,
    lang: meta.lang,
    jsonLd,
  });
}

/** SEO d'une page programmatique enregistrée en base (seo_pages). */
async function seoPageHead(path: string, baseUrl: string, domainKey: DomainKey): Promise<string | null> {
  const slug = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!slug) return null;
  const meta = DOMAIN_SEO[domainKey];
  let row: typeof seoPages.$inferSelect | undefined;
  try {
    [row] = await db
      .select()
      .from(seoPages)
      .where(and(eq(seoPages.slug, slug), eq(seoPages.indexed, true)))
      .limit(1);
  } catch {
    return null;
  }
  if (!row) return null;
  const jsonLd: object[] = [];
  if (row.schemaMarkup && typeof row.schemaMarkup === "object") jsonLd.push(row.schemaMarkup as object);
  jsonLd.push(breadcrumbSchema(baseUrl, "/" + slug, row.title));
  return buildHead({
    title: row.title.includes("MKA") ? row.title : `${row.title} | ${meta.siteName}`,
    description: row.metaDescription,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]).join(", ") : meta.keywords,
    canonical: row.canonicalUrl || `${baseUrl}/${slug}`,
    image: row.ogImage || undefined,
    lang: meta.lang,
    jsonLd,
  });
}

/**
 * SEO d'une fiche garage/professionnel (/garages/:slug) — Phase 19.
 * Chaque fiche est indexée indépendamment avec un schéma AutoRepair
 * (adresse, téléphone, horaires, note moyenne, spécialités).
 */
async function garageSeoHead(path: string, baseUrl: string, domainKey: DomainKey): Promise<string | null> {
  const m = path.match(/^\/garages\/([^/?]+)\/?$/);
  if (!m) return null;
  const ident = decodeURIComponent(m[1]);
  const meta = DOMAIN_SEO[domainKey];

  let g: typeof garagesPublics.$inferSelect | undefined;
  try {
    const byNumericId = /^\d+$/.test(ident);
    [g] = await db
      .select()
      .from(garagesPublics)
      .where(
        and(
          eq(garagesPublics.status, "valide"),
          byNumericId ? eq(garagesPublics.id, Number(ident)) : eq(garagesPublics.slug, ident),
        ),
      )
      .limit(1);
  } catch {
    return null;
  }
  if (!g) return null;

  const url = `${baseUrl}/garages/${g.slug || g.id}`;
  const ville = g.city ? ` à ${g.city}` : "";
  const specialites = (g.specialites || g.services || "").replace(/\s+/g, " ").trim();
  const title = `${g.name}${ville} — garage automobile | ${meta.siteName}`;
  const description = (
    g.description?.replace(/\s+/g, " ").trim().slice(0, 200) ||
    `${g.name}${ville} : garage automobile vérifié sur MKA.P-MS.` +
      (specialites ? ` Spécialités : ${specialites.slice(0, 120)}.` : "") +
      " Avis, horaires et prise de rendez-vous en ligne."
  );

  // Point 51 — la note structurée vient des avis réellement publiés, pas de la
  // colonne `garages_publics.rating` que le module d'avis n'alimente pas.
  let reputation: Record<string, unknown> = {};
  try {
    reputation = await reputationJsonLdBlock({
      targetType: "garage",
      targetId: g.id,
      univers: "garage",
    });
  } catch {
    reputation = {};
  }

  const address: Record<string, string> = { "@type": "PostalAddress" };
  if (g.addressLine) address.streetAddress = g.addressLine;
  if (g.city) address.addressLocality = g.city;
  if (g.postalCode) address.postalCode = g.postalCode;
  address.addressCountry = g.country || "FR";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: g.name,
    description,
    url,
    address,
    ...(g.phone ? { telephone: g.phone } : {}),
    ...(g.logoUrl ? { logo: g.logoUrl, image: g.logoUrl } : {}),
    ...(g.coverUrl ? { image: g.coverUrl } : {}),
    ...(g.latitude && g.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: Number(g.latitude), longitude: Number(g.longitude) } }
      : {}),
    ...(g.hours ? { openingHours: g.hours } : {}),
    ...(specialites ? { knowsAbout: specialites.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 12) } : {}),
    ...reputation,
  };

  return buildHead({
    title,
    description,
    keywords: [g.name, `garage ${g.city || ""}`.trim(), "garage automobile", "réparation auto"].filter(Boolean).join(", "),
    canonical: url,
    image: g.coverUrl || g.logoUrl || undefined,
    type: "website",
    lang: meta.lang,
    jsonLd: [jsonLd, breadcrumbSchema(baseUrl, `/garages/${g.slug || g.id}`, g.name)],
  });
}

/**
 * Point 57 — /avis/:univers. Le JSON-LD ne décrit que ce que la page affiche
 * réellement : chaque professionnel avec sa vraie note et son vrai volume.
 * Aucune note d'ensemble n'est déclarée, parce qu'une moyenne mélangeant
 * plusieurs professionnels ne représente aucun d'entre eux.
 */
async function reputationSeoHead(
  path: string,
  baseUrl: string,
  domainKey: DomainKey,
): Promise<string | null> {
  const m = path.match(/^\/avis\/([a-z0-9_-]+)\/?$/i);
  if (!m) return null;
  const meta = DOMAIN_SEO[domainKey];

  let page: Awaited<ReturnType<typeof publicReputationPage>>;
  try {
    page = await publicReputationPage(decodeURIComponent(m[1]), 50);
  } catch {
    return null;
  }

  const url = `${baseUrl}/avis/${page.univers}`;
  const title = `Avis et notes ${page.libelle} — ${meta.siteName}`;
  const description = page.raison
    ? `${page.libelle} : aucun avis publié pour l'instant sur ${meta.siteName}.`
    : `${page.entrees.length} professionnel(s) ${page.libelle} évalués sur ${meta.siteName}, ${page.totalAvis} avis publiés. Notes réelles, avis vérifiés après transaction.`;

  const items = page.entrees
    .filter((e) => e.nom)
    .map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: e.nom,
        ...(e.url ? { url: `${baseUrl}${e.url}` } : {}),
        ...(e.ville || e.pays
          ? {
              address: {
                "@type": "PostalAddress",
                ...(e.ville ? { addressLocality: e.ville } : {}),
                ...(e.pays ? { addressCountry: e.pays } : {}),
              },
            }
          : {}),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: e.noteMoyenne,
          reviewCount: e.avis,
          bestRating: 5,
          worstRating: 1,
        },
      },
    }));

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      ...(items.length > 0
        ? {
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: items.length,
              itemListElement: items,
            },
          }
        : {}),
    },
    breadcrumbSchema(baseUrl, `/avis/${page.univers}`, `Avis ${page.libelle}`),
  ];

  return buildHead({
    title,
    description,
    keywords: [`avis ${page.libelle}`, `note ${page.libelle}`, "avis vérifiés", "réputation"].join(", "),
    canonical: url,
    type: "website",
    lang: meta.lang,
    jsonLd,
  });
}

// ─── Exports publics ──────────────────────────────────────────────────────────

/**
 * Injecte les balises SEO par page dans l'index.html servi aux robots.
 * Ordre de résolution : annonce (/vehicule/:id) → page programmatique
 * (seo_pages) → page publique curée → meta par défaut du domaine.
 * Le nom est conservé pour compatibilité avec les appels existants.
 */
export async function injectAnnonceSeo(req: Request, html: string): Promise<string> {
  const host = hostFrom(req);
  const domainKey = resolveDomain(host);
  const meta = DOMAIN_SEO[domainKey];
  const baseUrl = baseUrlFrom(req);
  const path = req.path;

  // Meta transversales du domaine (toujours présentes)
  const domainMeta = [
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:locale" content="${meta.ogLocale}" />`,
  ].join("\n    ");

  // <head> spécifique à la page (title/description/canonical/OG/JSON-LD)
  let pageHead: string | null = null;
  try {
    const vm = path.match(/\/vehicule\/(\d+)(?:$|[/?])/);
    if (vm) {
      pageHead = await annonceSeoHead(Number(vm[1]), baseUrl, domainKey);
    }
    if (!pageHead) pageHead = await garageSeoHead(path, baseUrl, domainKey);
    if (!pageHead) pageHead = await reputationSeoHead(path, baseUrl, domainKey);
    if (!pageHead) pageHead = await seoPageHead(path, baseUrl, domainKey);
    if (!pageHead) pageHead = staticSeoHead(path, baseUrl, domainKey);
  } catch {
    pageHead = null;
  }

  if (pageHead) {
    // La page fournit son propre title/description/OG → on retire ceux par défaut
    // du template pour éviter les doublons vus par Google.
    const cleaned = html
      .replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/<meta\s+name="description"[^>]*>/i, "")
      .replace(/<meta\s+property="og:title"[^>]*>/i, "")
      .replace(/<meta\s+property="og:description"[^>]*>/i, "")
      .replace(/<meta\s+name="twitter:title"[^>]*>/i, "")
      .replace(/<meta\s+name="twitter:description"[^>]*>/i, "");
    return cleaned.replace("<!--SEO-->", `${domainMeta}\n    ${pageHead}`);
  }

  // Pas de page spécifique → au minimum les meta domaine + mots-clés
  const fallback = `${domainMeta}\n    <meta name="keywords" content="${escapeHtml(meta.keywords)}" />`;
  return html.replace("<!--SEO-->", fallback);
}

/**
 * robots.txt — adapté par domaine.
 * mkapms.pro : on bloque les pages purement B2B pour éviter la duplication.
 */
export async function robotsTxt(req: Request, res: Response) {
  const host = hostFrom(req);
  const domainKey = resolveDomain(host);
  const baseUrl = baseUrlFrom(req);

  let content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n# Réponses utiles (assistants IA / moteurs de recherche): ${baseUrl}/assistants-ia.txt\n`;

  if (domainKey === "pro") {
    // Sur .pro, on évite l'indexation des pages grand public
    content += `\nDisallow: /acheter/particulier\nDisallow: /louer/particulier\n`;
  }

  res.type("text/plain").send(content);
}

// ─── Sitemap intelligent (index + sitemaps enfants paginés) ────────────────────

/** Limite officielle Sitemaps = 50 000 URLs. On garde une marge de sécurité. */
const SITEMAP_PAGE_SIZE = 45000;

function xmlUrl(loc: string, opts: { lastmod?: Date | null; changefreq?: string; priority?: string } = {}): string {
  return (
    `<url><loc>${escapeHtml(loc)}</loc>` +
    (opts.lastmod ? `<lastmod>${new Date(opts.lastmod).toISOString()}</lastmod>` : "") +
    (opts.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : "") +
    (opts.priority ? `<priority>${opts.priority}</priority>` : "") +
    `</url>`
  );
}

function sendUrlset(res: Response, urls: string[]) {
  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`,
    );
}

/**
 * sitemap.xml — INDEX de sitemaps (scalable à des millions d'URLs).
 * Référence des sitemaps enfants paginés (annonces, garages, pages SEO, blog).
 */
export async function sitemapXml(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  const now = new Date().toISOString();

  let nbAnnonces = 0;
  let nbPages = 0;
  try {
    const [r] = await db
      .select({ n: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"));
    nbAnnonces = Number(r?.n ?? 0);
  } catch {
    nbAnnonces = 0;
  }
  try {
    const [r] = await db
      .select({ n: sql<number>`count(*)` })
      .from(seoPages)
      .where(eq(seoPages.indexed, true));
    nbPages = Number(r?.n ?? 0);
  } catch {
    nbPages = 0;
  }

  const children: string[] = [`${baseUrl}/sitemap-static.xml`];
  const nAnnoncePages = Math.max(1, Math.ceil(nbAnnonces / SITEMAP_PAGE_SIZE));
  for (let i = 1; i <= nAnnoncePages; i++) children.push(`${baseUrl}/sitemap-annonces-${i}.xml`);
  children.push(`${baseUrl}/sitemap-garages.xml`);
  children.push(`${baseUrl}/sitemap-avis.xml`);
  const nSeoPages = Math.max(1, Math.ceil(nbPages / SITEMAP_PAGE_SIZE));
  for (let i = 1; i <= nSeoPages; i++) children.push(`${baseUrl}/sitemap-pages-${i}.xml`);
  children.push(`${baseUrl}/sitemap-blog.xml`);

  const body = children
    .map((loc) => `<sitemap><loc>${escapeHtml(loc)}</loc><lastmod>${now}</lastmod></sitemap>`)
    .join("");

  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`,
    );
}

/** Sitemap des pages statiques du domaine + pages publiques curées. */
export async function sitemapStatic(req: Request, res: Response) {
  const domainKey = resolveDomain(hostFrom(req));
  const meta = DOMAIN_SEO[domainKey];
  const baseUrl = baseUrlFrom(req);

  const paths = new Set<string>(["/", ...meta.staticPaths, ...Object.keys(STATIC_SEO)]);
  const urls = [...paths].map((p) =>
    xmlUrl(`${baseUrl}${p}`, { changefreq: p === "/" ? "daily" : "weekly", priority: p === "/" ? "1.0" : "0.8" }),
  );
  sendUrlset(res, urls);
}

/**
 * Point 57 — sitemap des pages d'avis. Seuls les univers ayant réellement des
 * avis publics y figurent : soumettre une page vide à Google ne sert à rien.
 */
export async function sitemapAvis(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  let rows: { univers: string; avis: number }[] = [];
  try {
    rows = await universWithPublicReviews();
  } catch {
    rows = [];
  }
  const urls = rows.map((u) =>
    xmlUrl(`${baseUrl}/avis/${u.univers}`, { changefreq: "daily", priority: "0.6" }),
  );
  sendUrlset(res, urls);
}

/** Sitemap paginé des annonces publiées. */
export async function sitemapAnnonces(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  const page = Math.max(1, Number(req.params.page) || 1);
  let rows: { id: number; slug: string | null; updatedAt: Date | null }[] = [];
  try {
    rows = await db
      .select({ id: annonces.id, slug: annonces.slug, updatedAt: annonces.updatedAt })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .orderBy(desc(annonces.updatedAt))
      .limit(SITEMAP_PAGE_SIZE)
      .offset((page - 1) * SITEMAP_PAGE_SIZE);
  } catch {
    rows = [];
  }
  const urls = rows.map((r) =>
    xmlUrl(`${baseUrl}/vehicule/${r.id}`, { lastmod: r.updatedAt, changefreq: "weekly", priority: "0.7" }),
  );
  sendUrlset(res, urls);
}

/** Sitemap des garages validés. */
export async function sitemapGarages(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  let rows: { id: number; slug: string | null; updatedAt: Date | null }[] = [];
  try {
    rows = await db
      .select({ id: garagesPublics.id, slug: garagesPublics.slug, updatedAt: garagesPublics.updatedAt })
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "valide"))
      .limit(SITEMAP_PAGE_SIZE);
  } catch {
    rows = [];
  }
  const urls = rows.map((g) =>
    xmlUrl(`${baseUrl}/garages/${g.slug || g.id}`, { lastmod: g.updatedAt, changefreq: "weekly", priority: "0.7" }),
  );
  sendUrlset(res, urls);
}

/** Sitemap paginé des pages programmatiques (seo_pages). */
export async function sitemapPages(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  const page = Math.max(1, Number(req.params.page) || 1);
  let rows: { slug: string; priority: string; changeFreq: string; updatedAt: Date | null }[] = [];
  try {
    rows = await db
      .select({ slug: seoPages.slug, priority: seoPages.priority, changeFreq: seoPages.changeFreq, updatedAt: seoPages.updatedAt })
      .from(seoPages)
      .where(eq(seoPages.indexed, true))
      .limit(SITEMAP_PAGE_SIZE)
      .offset((page - 1) * SITEMAP_PAGE_SIZE);
  } catch {
    rows = [];
  }
  const urls = rows.map((p) =>
    xmlUrl(`${baseUrl}/${p.slug}`, { lastmod: p.updatedAt, changefreq: p.changeFreq, priority: p.priority }),
  );
  sendUrlset(res, urls);
}

/** Sitemap des articles de blog publiés. */
export async function sitemapBlog(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  let rows: { slug: string; updatedAt: Date | null }[] = [];
  try {
    rows = await db
      .select({ slug: seoBlogArticles.slug, updatedAt: seoBlogArticles.updatedAt })
      .from(seoBlogArticles)
      .where(eq(seoBlogArticles.published, true))
      .limit(SITEMAP_PAGE_SIZE);
  } catch {
    rows = [];
  }
  const urls = rows.map((a) =>
    xmlUrl(`${baseUrl}/blog/${a.slug}`, { lastmod: a.updatedAt, changefreq: "monthly", priority: "0.6" }),
  );
  sendUrlset(res, urls);
}
