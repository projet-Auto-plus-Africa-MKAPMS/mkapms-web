import type { Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db.js";
import { annonces, annoncePhotos } from "./schema.js";

// Référencement Google mondial (Partie 6) : chaque annonce expose des balises
// meta + Open Graph + données structurées Schema.org, et le site publie un
// sitemap.xml + robots.txt. Le rendu se fait côté serveur pour les robots.

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

// Construit le bloc <head> SEO d'une annonce (titre, description, OG, JSON-LD).
async function annonceSeoHead(id: number, baseUrl: string): Promise<string | null> {
  const [a] = await db.select().from(annonces).where(eq(annonces.id, id)).limit(1);
  if (!a || a.status !== "publiee") return null;
  const photos = await db
    .select()
    .from(annoncePhotos)
    .where(eq(annoncePhotos.annonceId, id))
    .orderBy(annoncePhotos.ordre);

  const url = `${baseUrl}/vehicule/${a.id}`;
  const prix = Number(a.prix) || 0;
  const title = `${a.titre} — ${a.marque} ${a.modele}${a.annee ? ` (${a.annee})` : ""} | MKA.P-MS`;
  const descParts = [
    `${a.marque} ${a.modele}`,
    a.annee ? `${a.annee}` : "",
    a.kilometrage ? `${a.kilometrage.toLocaleString("fr-FR")} km` : "",
    a.carburant,
    a.ville ? `à ${a.ville}` : "",
    prix ? `— ${prix.toLocaleString("fr-FR")} €` : "",
  ].filter(Boolean);
  const description = (a.description?.slice(0, 200) || descParts.join(" · ")).replace(/\s+/g, " ").trim();
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

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
}

// Renvoie l'index.html enrichi avec le SEO de l'annonce si l'URL en est une.
export async function injectAnnonceSeo(req: Request, html: string): Promise<string> {
  const m = req.path.match(/^\/vehicule\/(\d+)/);
  if (!m) return html;
  try {
    const head = await annonceSeoHead(Number(m[1]), baseUrlFrom(req));
    if (!head) return html;
    // Retire le <title> par défaut pour éviter un doublon (le head SEO en fournit un).
    return html
      .replace(/<title>[\s\S]*?<\/title>/, "")
      .replace("<!--SEO-->", head);
  } catch {
    return html;
  }
}

export async function robotsTxt(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
}

export async function sitemapXml(req: Request, res: Response) {
  const baseUrl = baseUrlFrom(req);
  const staticPaths = [
    "/",
    "/acheter",
    "/louer",
    "/pieces",
    "/devis",
    "/garages",
    "/univers",
    "/abonnements",
    "/confiance",
  ];
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
    ...staticPaths.map((p) => `<url><loc>${baseUrl}${p}</loc><changefreq>daily</changefreq></url>`),
    ...rows.map(
      (r) =>
        `<url><loc>${baseUrl}/vehicule/${r.id}</loc>` +
        (r.updatedAt ? `<lastmod>${new Date(r.updatedAt).toISOString()}</lastmod>` : "") +
        `<changefreq>weekly</changefreq></url>`,
    ),
  ].join("");
  res
    .type("application/xml")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
}
