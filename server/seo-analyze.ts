/**
 * MKA.P-MS — SEO OS intelligent (analyse + suggestions).
 *
 * Règle stricte (validation humaine) : ce module OBSERVE et PROPOSE uniquement.
 * Il ne crée, ne modifie et ne supprime rien automatiquement. Les suggestions
 * doivent être validées par un humain (bouton « Générer » du centre SEO) avant
 * toute exécution.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { annonces, garagesPublics, seoPages } from "./schema.js";
import { slugify } from "./seo-generator.js";

export interface SeoSuggestion {
  type: string;
  label: string;
  reason: string;
  count: number;
  action: "generate_pages";
}

export interface SeoAnalysis {
  topMarques: { marque: string; count: number }[];
  topVilles: { ville: string; count: number }[];
  topModeles: { modele: string; count: number }[];
  coverage: { marques: number; villes: number; modeles: number; pagesTotal: number };
  suggestions: SeoSuggestion[];
}

async function existingSlugs(prefix: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ slug: seoPages.slug })
      .from(seoPages)
      .where(sql`${seoPages.slug} like ${prefix + "%"}`);
    return new Set(rows.map((r) => r.slug));
  } catch {
    return new Set();
  }
}

/** Analyse les données réelles et propose des pages SEO manquantes. */
export async function analyzeSeo(): Promise<SeoAnalysis> {
  const analysis: SeoAnalysis = {
    topMarques: [], topVilles: [], topModeles: [],
    coverage: { marques: 0, villes: 0, modeles: 0, pagesTotal: 0 },
    suggestions: [],
  };

  // Marques demandées (inventaire réel)
  let marques: { marque: string; count: number }[] = [];
  try {
    const rows = await db
      .select({ marque: annonces.marque, count: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.marque)
      .orderBy(sql`count(*) desc`);
    marques = rows.filter((r) => r.marque).map((r) => ({ marque: r.marque, count: Number(r.count) }));
  } catch {
    marques = [];
  }
  analysis.topMarques = marques.slice(0, 10);

  // Modèles
  let modeles: { modele: string; count: number }[] = [];
  try {
    const rows = await db
      .select({ modele: annonces.modele, count: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.modele)
      .orderBy(sql`count(*) desc`);
    modeles = rows.filter((r) => r.modele).map((r) => ({ modele: r.modele, count: Number(r.count) }));
  } catch {
    modeles = [];
  }
  analysis.topModeles = modeles.slice(0, 10);

  // Villes (annonces + garages)
  const villeMap = new Map<string, number>();
  try {
    const rows = await db
      .select({ ville: annonces.ville, count: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.ville);
    for (const r of rows) if (r.ville) villeMap.set(r.ville, (villeMap.get(r.ville) ?? 0) + Number(r.count));
  } catch { /* ignore */ }
  try {
    const rows = await db
      .select({ ville: garagesPublics.city, count: sql<number>`count(*)` })
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "valide"))
      .groupBy(garagesPublics.city);
    for (const r of rows) if (r.ville) villeMap.set(r.ville, (villeMap.get(r.ville) ?? 0) + Number(r.count));
  } catch { /* ignore */ }
  const villes = [...villeMap.entries()].map(([ville, count]) => ({ ville, count })).sort((a, b) => b.count - a.count);
  analysis.topVilles = villes.slice(0, 10);

  // Couverture : combien de ces entités ont déjà une page ?
  const [marqueSlugs, villeSlugs, pagesTotalRow] = await Promise.all([
    existingSlugs("marque/"),
    existingSlugs("ville/"),
    db.select({ n: sql<number>`count(*)` }).from(seoPages).then((r) => Number(r[0]?.n ?? 0)).catch(() => 0),
  ]);
  analysis.coverage.pagesTotal = pagesTotalRow;

  const marquesManquantes = marques.filter((m) => !marqueSlugs.has(`marque/${slugify(m.marque)}`));
  const villesManquantes = villes.filter((v) => !villeSlugs.has(`ville/${slugify(v.ville)}`));
  analysis.coverage.marques = marques.length - marquesManquantes.length;
  analysis.coverage.villes = villes.length - villesManquantes.length;

  if (marquesManquantes.length > 0) {
    analysis.suggestions.push({
      type: "marque",
      label: `${marquesManquantes.length} marque(s) sans page SEO`,
      reason: `Des annonces existent pour ces marques (${marquesManquantes.slice(0, 5).map((m) => m.marque).join(", ")}…) mais aucune page dédiée n'est indexable.`,
      count: marquesManquantes.length,
      action: "generate_pages",
    });
  }
  if (villesManquantes.length > 0) {
    analysis.suggestions.push({
      type: "ville",
      label: `${villesManquantes.length} ville(s) sans page SEO`,
      reason: `Des annonces/garages existent dans ces villes (${villesManquantes.slice(0, 5).map((v) => v.ville).join(", ")}…) sans page géographique dédiée.`,
      count: villesManquantes.length,
      action: "generate_pages",
    });
  }

  return analysis;
}
