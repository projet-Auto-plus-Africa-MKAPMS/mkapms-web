/**
 * MKA.P-MS — SEO Manager / Assistant Intelligence SEO (Phase 22).
 *
 * Analyse les données réelles de la plateforme et génère des recommandations
 * concrètes et actionnables, par exemple :
 *  - « Créer une page Diagnostic automobile à Bordeaux » ;
 *  - « Optimiser / créer les pages réparation pour Fiat 500 » ;
 *  - « Publier davantage de contenu pour les garages partenaires ».
 *
 * Règle stricte (validation humaine) : ce module OBSERVE et PROPOSE uniquement.
 * Aucune page n'est créée ni modifiée automatiquement — l'exécution passe par
 * le bouton « Générer » du centre SEO (générateur idempotent existant).
 */

import { eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { annonces, garagesPublics, seoPages } from "./schema.js";
import { SERVICES, REPARATIONS, slugify } from "./seo-generator.js";

export type SeoRecoPriority = "haute" | "moyenne" | "basse";

export interface SeoRecommendation {
  category: string;
  priority: SeoRecoPriority;
  title: string;
  reason: string;
  suggestedAction: string;
}

export interface SeoManagerReport {
  recommendations: SeoRecommendation[];
  stats: { villesActives: number; modelesActifs: number; garagesValides: number; pagesTotal: number };
  generatedAt: string;
}

async function existingSlugSet(prefix: string): Promise<Set<string>> {
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

// Services prioritaires pour le maillage géographique (les plus recherchés localement).
const GEO_PRIORITY_SERVICES = [
  "controle-technique",
  "diagnostic",
  "vidange",
  "carrosserie",
  "freinage",
  "climatisation",
  "depannage",
];

/** Génère les recommandations SEO à partir des données réelles. */
export async function seoRecommendations(): Promise<SeoManagerReport> {
  const recommendations: SeoRecommendation[] = [];

  // ─── Villes actives (annonces + garages) ────────────────────────────────────
  const villeCount = new Map<string, number>();
  try {
    const rows = await db
      .select({ ville: annonces.ville, n: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.ville);
    for (const r of rows) if (r.ville) villeCount.set(r.ville, (villeCount.get(r.ville) ?? 0) + Number(r.n));
  } catch { /* ignore */ }
  try {
    const rows = await db
      .select({ ville: garagesPublics.city, n: sql<number>`count(*)` })
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "valide"))
      .groupBy(garagesPublics.city);
    for (const r of rows) if (r.ville) villeCount.set(r.ville, (villeCount.get(r.ville) ?? 0) + Number(r.n));
  } catch { /* ignore */ }
  const villesActives = [...villeCount.entries()]
    .map(([ville, n]) => ({ ville, n }))
    .sort((a, b) => b.n - a.n);

  // ─── Modèles actifs ─────────────────────────────────────────────────────────
  let modelesActifs: { marque: string; modele: string; n: number }[] = [];
  try {
    const rows = await db
      .select({ marque: annonces.marque, modele: annonces.modele, n: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.marque, annonces.modele)
      .orderBy(sql`count(*) desc`);
    modelesActifs = rows.filter((r) => r.marque && r.modele).map((r) => ({ marque: r.marque, modele: r.modele, n: Number(r.n) }));
  } catch { /* ignore */ }

  // ─── Garages ────────────────────────────────────────────────────────────────
  let garagesValides = 0;
  let garagesIncomplets = 0;
  try {
    const rows = await db
      .select({ description: garagesPublics.description, logoUrl: garagesPublics.logoUrl, specialites: garagesPublics.specialites, services: garagesPublics.services })
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "valide"));
    garagesValides = rows.length;
    garagesIncomplets = rows.filter((g) => !g.description || !g.logoUrl || !(g.specialites || g.services)).length;
  } catch { /* ignore */ }

  const [serviceSlugs, marqueSlugs] = await Promise.all([
    existingSlugSet("service/"),
    existingSlugSet("reparation/"),
  ]);
  const pagesTotal = await db
    .select({ n: sql<number>`count(*)` })
    .from(seoPages)
    .then((r) => Number(r[0]?.n ?? 0))
    .catch(() => 0);

  // ─── 1. Services × villes manquants (fort potentiel local) ─────────────────
  const serviceName = new Map(SERVICES.map((s) => [s.slug, s.name]));
  for (const svcSlug of GEO_PRIORITY_SERVICES) {
    const name = serviceName.get(svcSlug);
    if (!name) continue;
    for (const { ville, n } of villesActives.slice(0, 8)) {
      const slug = `service/${svcSlug}/${slugify(ville)}`;
      if (!serviceSlugs.has(slug)) {
        recommendations.push({
          category: "geo_service",
          priority: n >= 5 ? "haute" : "moyenne",
          title: `Créer une page « ${name} à ${ville} »`,
          reason: `${n} annonce(s)/garage(s) actifs à ${ville} mais aucune page dédiée « ${name} » pour capter les recherches locales.`,
          suggestedAction: `Générer la page ${slug}`,
        });
      }
    }
  }

  // ─── 2. Réparations × modèles populaires manquantes ────────────────────────
  for (const { marque, modele, n } of modelesActifs.slice(0, 8)) {
    const vehicule = `${marque} ${modele}`;
    for (const r of REPARATIONS.slice(0, 4)) {
      const slug = `reparation/${r.slug}/${slugify(vehicule)}`;
      if (!marqueSlugs.has(slug)) {
        recommendations.push({
          category: "reparation_modele",
          priority: n >= 3 ? "haute" : "basse",
          title: `Optimiser les pages réparation ${vehicule}`,
          reason: `${n} annonce(s) ${vehicule} en ligne : les pages « ${r.name} ${vehicule} » attireraient un trafic qualifié.`,
          suggestedAction: `Générer les pages réparation × modèle pour ${vehicule}`,
        });
        break; // une seule reco par modèle pour éviter le bruit
      }
    }
  }

  // ─── 3. Garages incomplets ─────────────────────────────────────────────────
  if (garagesIncomplets > 0) {
    recommendations.push({
      category: "garage_contenu",
      priority: "moyenne",
      title: "Compléter les fiches des garages partenaires",
      reason: `${garagesIncomplets} garage(s) validé(s) sur ${garagesValides} sans description, logo ou spécialités — fiches SEO peu compétitives.`,
      suggestedAction: "Compléter logo, description et spécialités des fiches garages",
    });
  }

  // ─── 4. Densité de contenu éditorial ───────────────────────────────────────
  if (pagesTotal > 0 && villesActives.length > 5) {
    recommendations.push({
      category: "contenu_editorial",
      priority: "basse",
      title: "Publier des guides thématiques (entretien, électrique, hybride)",
      reason: "Le contenu éditorial (guides, conseils) renforce l'autorité SEO au-delà des pages programmatiques.",
      suggestedAction: "Rédiger un guide (ex. entretien des véhicules hybrides) dans les articles SEO",
    });
  }

  // Tri par priorité (haute → basse) puis limitation.
  const order: Record<SeoRecoPriority, number> = { haute: 0, moyenne: 1, basse: 2 };
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return {
    recommendations: recommendations.slice(0, 25),
    stats: {
      villesActives: villesActives.length,
      modelesActifs: modelesActifs.length,
      garagesValides,
      pagesTotal,
    },
    generatedAt: new Date().toISOString(),
  };
}
