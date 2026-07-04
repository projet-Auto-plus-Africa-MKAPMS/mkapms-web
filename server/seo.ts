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
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db.js";
import { annonces, annoncePhotos } from "./schema.js";
import { resolveDomain, type DomainKey } from "./domain.js";

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

  // Balises hreflang pour les trois domaines (même contenu, domaines différents)
  const hreflang = [
    `<link rel="alternate" hreflang="fr" href="https://mkapms.fr/vehicule/${a.id}" />`,
    `<link rel="alternate" hreflang="fr" href="https://mkapms.pro/vehicule/${a.id}" />`,
    `<link rel="alternate" hreflang="x-default" href="https://mkapms.site/vehicule/${a.id}" />`,
  ].join("\n    ");

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

// ─── Exports publics ──────────────────────────────────────────────────────────

/**
 * Injecte les balises SEO dans l'index.html pour les pages d'annonce.
 * Ajoute également les meta par défaut du domaine sur toutes les pages.
 */
export async function injectAnnonceSeo(req: Request, html: string): Promise<string> {
  const host = hostFrom(req);
  const domainKey = resolveDomain(host);
  const meta = DOMAIN_SEO[domainKey];
  const baseUrl = baseUrlFrom(req);

  // Injecter les meta par défaut du domaine (lang, keywords, og:site_name)
  const domainMeta = [
    `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:locale" content="${meta.ogLocale}" />`,
  ].join("\n    ");

  let result = html.replace("<!--SEO-->", domainMeta);

  // Injecter le SEO spécifique à l'annonce si on est sur /vehicule/:id
  const m = req.path.match(/^\/vehicule\/(\d+)/);
  if (m) {
    try {
      const head = await annonceSeoHead(Number(m[1]), baseUrl, domainKey);
      if (head) {
        result = result
          .replace(/<title>[\s\S]*?<\/title>/, "")
          .replace("<!--SEO-->", head);
      }
    } catch {
      // Silencieux — on retourne le HTML avec les meta domaine
    }
  }

  return result;
}

/**
 * robots.txt — adapté par domaine.
 * mkapms.pro : on bloque les pages purement B2B pour éviter la duplication.
 */
export async function robotsTxt(req: Request, res: Response) {
  const host = hostFrom(req);
  const domainKey = resolveDomain(host);
  const baseUrl = baseUrlFrom(req);

  let content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;

  if (domainKey === "pro") {
    // Sur .pro, on évite l'indexation des pages grand public
    content += `\nDisallow: /acheter/particulier\nDisallow: /louer/particulier\n`;
  }

  res.type("text/plain").send(content);
}

/**
 * sitemap.xml — chemins statiques propres à chaque domaine + annonces communes.
 */
export async function sitemapXml(req: Request, res: Response) {
  const host = hostFrom(req);
  const domainKey = resolveDomain(host);
  const meta = DOMAIN_SEO[domainKey];
  const baseUrl = baseUrlFrom(req);

  let rows: { id: number; updatedAt: Date | null }[] = [];
  try {
    rows = await db
      .select({ id: annonces.id, updatedAt: annonces.updatedAt })
      .from(annonces)
      .where(and(eq(annonces.status, "publiee")))
      .orderBy(desc(annonces.updatedAt))
      .limit(50000);
  } catch {
    rows = [];
  }

  const urls = [
    ...meta.staticPaths.map(
      (p) => `<url><loc>${baseUrl}${p}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    ),
    ...rows.map(
      (r) =>
        `<url><loc>${baseUrl}/vehicule/${r.id}</loc>` +
        (r.updatedAt ? `<lastmod>${new Date(r.updatedAt).toISOString()}</lastmod>` : "") +
        `<changefreq>weekly</changefreq><priority>0.6</priority></url>`,
    ),
  ].join("");

  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    );
}
