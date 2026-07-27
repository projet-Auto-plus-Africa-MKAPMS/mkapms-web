import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { generateProgrammaticPages } from "../seo-generator.js";
import { submitIndexNow, pingSitemaps } from "../seo-indexing.js";
import { analyzeSeo } from "../seo-analyze.js";
import {
  SEO_KEYWORD_CATALOG,
  catalogSize,
  seedKeywords,
  keywordsByUnivers,
} from "../seo-keywords-catalog.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import { env } from "../env.js";
import { db } from "../db.js";
import {
  seoPages,
  seoKeywords,
  seoIndexingLog,
  seoBlogArticles,
  seoConfig,
  annonces,
  garagesPublics,
} from "../schema.js";

// ===== SEO HELPERS =====

// Générer un slug propre à partir d'un texte
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

// Générer des meta pour une annonce
function generateAnnonceMeta(annonce: {
  titre: string;
  marque: string;
  modele: string;
  annee: number | null;
  ville: string | null;
  prix: string;
  categorie: string;
  etat: string;
}) {
  const title = `${annonce.titre} | ${annonce.marque} ${annonce.modele}${annonce.annee ? ` ${annonce.annee}` : ""} - MKA.P-MS`;
  const description = `${annonce.etat === "neuf" ? "Neuf" : "Occasion"} — ${annonce.marque} ${annonce.modele}${annonce.annee ? ` (${annonce.annee})` : ""} à ${annonce.prix}€${annonce.ville ? ` à ${annonce.ville}` : ""}. Achetez en confiance sur MKA.P-MS.`;
  const slug = generateSlug(`${annonce.marque}-${annonce.modele}${annonce.annee ? `-${annonce.annee}` : ""}${annonce.ville ? `-${annonce.ville}` : ""}`);
  const keywords = [
    annonce.marque.toLowerCase(),
    annonce.modele.toLowerCase(),
    annonce.categorie,
    `${annonce.marque} occasion`,
    `acheter ${annonce.marque}`,
    annonce.ville?.toLowerCase(),
  ].filter(Boolean);

  return { title: title.slice(0, 160), description: description.slice(0, 320), slug, keywords };
}

// Schema.org JSON-LD pour un véhicule
function vehicleSchemaMarkup(annonce: {
  titre: string;
  marque: string;
  modele: string;
  annee: number | null;
  prix: string;
  ville: string | null;
  etat: string;
  carburant: string;
  kilometrage: number | null;
  photos?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: annonce.titre,
    brand: { "@type": "Brand", name: annonce.marque },
    model: annonce.modele,
    modelDate: annonce.annee ? String(annonce.annee) : undefined,
    vehicleCondition: annonce.etat === "neuf" ? "NewCondition" : "UsedCondition",
    fuelType: annonce.carburant,
    mileageFromOdometer: annonce.kilometrage
      ? { "@type": "QuantitativeValue", value: annonce.kilometrage, unitCode: "KMT" }
      : undefined,
    offers: {
      "@type": "Offer",
      price: annonce.prix,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "MKA.P-MS" },
    },
    image: annonce.photos?.[0],
  };
}

// Schema.org pour un garage/commerce local
function localBusinessSchemaMarkup(garage: {
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: string | null;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: garage.name,
    description: garage.description,
    address: garage.city
      ? {
          "@type": "PostalAddress",
          streetAddress: garage.address,
          addressLocality: garage.city,
          postalCode: garage.postalCode,
          addressCountry: "FR",
        }
      : undefined,
    telephone: garage.phone,
    email: garage.email,
    aggregateRating:
      garage.reviewCount && garage.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: garage.rating,
            reviewCount: garage.reviewCount,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
  };
}

// ===== ROUTER =====

export const seoRouter = router({
  // ─── PUBLIC ───

  // Récupérer les meta SEO d'une page
  getPageMeta: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [page] = await db
        .select()
        .from(seoPages)
        .where(eq(seoPages.slug, input.slug))
        .limit(1);
      return page || null;
    }),

  // Sitemap dynamique (retourne les URLs à indexer)
  getSitemap: publicProcedure.query(async () => {
    // Pages statiques
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/acheter", priority: "0.9", changefreq: "daily" },
      { url: "/louer", priority: "0.9", changefreq: "daily" },
      { url: "/garages", priority: "0.8", changefreq: "weekly" },
      { url: "/pieces", priority: "0.8", changefreq: "weekly" },
      { url: "/depannage", priority: "0.8", changefreq: "weekly" },
      { url: "/livraison", priority: "0.7", changefreq: "weekly" },
      { url: "/finance", priority: "0.7", changefreq: "monthly" },
      { url: "/carte-grise", priority: "0.7", changefreq: "monthly" },
      { url: "/acheter/estimation", priority: "0.7", changefreq: "monthly" },
      { url: "/acheter/encheres", priority: "0.7", changefreq: "daily" },
    ];

    // Annonces actives
    const activeAnnonces = await db
      .select({ id: annonces.id, slug: annonces.slug, updatedAt: annonces.updatedAt })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .orderBy(desc(annonces.updatedAt))
      .limit(5000);

    const annonceUrls = activeAnnonces.map((a) => ({
      url: `/vehicule/${a.slug || a.id}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: a.updatedAt?.toISOString(),
    }));

    // Garages
    const activeGarages = await db
      .select({ id: garagesPublics.id, slug: garagesPublics.slug, updatedAt: garagesPublics.updatedAt })
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "valide"))
      .limit(2000);

    const garageUrls = activeGarages.map((g) => ({
      url: `/garages/${g.slug || g.id}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: g.updatedAt?.toISOString(),
    }));

    // Pages SEO générées
    const generatedPages = await db
      .select({ slug: seoPages.slug, priority: seoPages.priority, changeFreq: seoPages.changeFreq, updatedAt: seoPages.updatedAt })
      .from(seoPages)
      .where(eq(seoPages.indexed, true))
      .limit(5000);

    const seoUrls = generatedPages.map((p) => ({
      url: `/${p.slug}`,
      priority: p.priority,
      changefreq: p.changeFreq,
      lastmod: p.updatedAt?.toISOString(),
    }));

    // Blog
    const articles = await db
      .select({ slug: seoBlogArticles.slug, updatedAt: seoBlogArticles.updatedAt })
      .from(seoBlogArticles)
      .where(eq(seoBlogArticles.published, true))
      .limit(1000);

    const blogUrls = articles.map((a) => ({
      url: `/blog/${a.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: a.updatedAt?.toISOString(),
    }));

    return [...staticPages, ...annonceUrls, ...garageUrls, ...seoUrls, ...blogUrls];
  }),

  // Schema.org markup pour une annonce
  getVehicleSchema: publicProcedure
    .input(z.object({ annonceId: z.number() }))
    .query(async ({ input }) => {
      const [annonce] = await db
        .select()
        .from(annonces)
        .where(eq(annonces.id, input.annonceId))
        .limit(1);
      if (!annonce) return null;
      return vehicleSchemaMarkup({
        titre: annonce.titre,
        marque: annonce.marque,
        modele: annonce.modele,
        annee: annonce.annee,
        prix: String(annonce.prix),
        ville: annonce.ville,
        etat: annonce.etat,
        carburant: annonce.carburant,
        kilometrage: annonce.kilometrage,
      });
    }),

  // Schema.org markup pour un garage
  getGarageSchema: publicProcedure
    .input(z.object({ garageId: z.number() }))
    .query(async ({ input }) => {
      const [garage] = await db
        .select()
        .from(garagesPublics)
        .where(eq(garagesPublics.id, input.garageId))
        .limit(1);
      if (!garage) return null;
      return localBusinessSchemaMarkup({
        name: garage.name,
        description: garage.description,
        address: garage.addressLine,
        city: garage.city,
        postalCode: garage.postalCode,
        phone: garage.phone,
        email: garage.email,
        rating: garage.rating,
        reviewCount: garage.reviewCount,
      });
    }),

  // Blog articles
  listArticles: publicProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const conditions = [eq(seoBlogArticles.published, true)];
      if (input.category) conditions.push(eq(seoBlogArticles.category, input.category));
      return db
        .select({
          id: seoBlogArticles.id,
          slug: seoBlogArticles.slug,
          title: seoBlogArticles.title,
          excerpt: seoBlogArticles.excerpt,
          coverImage: seoBlogArticles.coverImage,
          category: seoBlogArticles.category,
          publishedAt: seoBlogArticles.publishedAt,
          views: seoBlogArticles.views,
        })
        .from(seoBlogArticles)
        .where(and(...conditions))
        .orderBy(desc(seoBlogArticles.publishedAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getArticle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [article] = await db
        .select()
        .from(seoBlogArticles)
        .where(and(eq(seoBlogArticles.slug, input.slug), eq(seoBlogArticles.published, true)))
        .limit(1);
      if (article) {
        // Incrémenter les vues
        await db.update(seoBlogArticles).set({ views: article.views + 1 }).where(eq(seoBlogArticles.id, article.id));
      }
      return article || null;
    }),

  // ─── ADMIN ───

  // Dashboard SEO
  adminDashboard: adminProcedure.query(async () => {
    const [pageStats] = await db
      .select({
        totalPages: sql<number>`count(*)`,
        indexedPages: sql<number>`count(*) filter (where ${seoPages.indexed} = true)`,
      })
      .from(seoPages);

    const [annonceStats] = await db
      .select({
        totalAnnonces: sql<number>`count(*)`,
        withSlug: sql<number>`count(*) filter (where ${annonces.slug} is not null and ${annonces.slug} != '')`,
      })
      .from(annonces)
      .where(eq(annonces.status, "publiee"));

    const [blogStats] = await db
      .select({
        totalArticles: sql<number>`count(*)`,
        publishedArticles: sql<number>`count(*) filter (where ${seoBlogArticles.published} = true)`,
        totalViews: sql<number>`coalesce(sum(${seoBlogArticles.views}), 0)`,
      })
      .from(seoBlogArticles);

    const recentIndexing = await db
      .select()
      .from(seoIndexingLog)
      .orderBy(desc(seoIndexingLog.createdAt))
      .limit(20);

    return { pageStats, annonceStats, blogStats, recentIndexing };
  }),

  // Créer/modifier une page SEO
  upsertPage: adminProcedure
    .input(
      z.object({
        slug: z.string().max(512),
        title: z.string().max(160),
        metaDescription: z.string().max(320),
        h1: z.string().max(200).optional(),
        content: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        pageType: z.string(),
        univers: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        ogImage: z.string().optional(),
        schemaMarkup: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select({ id: seoPages.id }).from(seoPages).where(eq(seoPages.slug, input.slug)).limit(1);
      if (existing.length) {
        await db.update(seoPages).set({ ...input, updatedAt: new Date() }).where(eq(seoPages.id, existing[0].id));
        return { id: existing[0].id, action: "updated" };
      }
      const [p] = await db.insert(seoPages).values(input).returning({ id: seoPages.id });
      return { id: p.id, action: "created" };
    }),

  // Créer/modifier un article blog
  upsertArticle: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        slug: z.string().max(256),
        title: z.string().max(200),
        metaDescription: z.string().max(320),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.string(),
        tags: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        published: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        const [existing] = await db.select({ publishedAt: seoBlogArticles.publishedAt }).from(seoBlogArticles).where(eq(seoBlogArticles.id, input.id)).limit(1);
        const publishedAt = input.published
          ? (existing?.publishedAt ?? new Date())
          : null;
        await db
          .update(seoBlogArticles)
          .set({
            ...input,
            publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(seoBlogArticles.id, input.id));
        return { id: input.id, action: "updated" };
      }
      const [a] = await db
        .insert(seoBlogArticles)
        .values({
          ...input,
          authorId: ctx.user.uid,
          publishedAt: input.published ? new Date() : null,
        })
        .returning({ id: seoBlogArticles.id });
      return { id: a.id, action: "created" };
    }),

  // Générer meta SEO automatiques pour une annonce
  generateAnnonceSeo: adminProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ input }) => {
      const [annonce] = await db.select().from(annonces).where(eq(annonces.id, input.annonceId)).limit(1);
      if (!annonce) throw new Error("Annonce introuvable.");

      const meta = generateAnnonceMeta({
        titre: annonce.titre,
        marque: annonce.marque,
        modele: annonce.modele,
        annee: annonce.annee,
        ville: annonce.ville,
        prix: String(annonce.prix),
        categorie: annonce.categorie,
        etat: annonce.etat,
      });

      // Mettre à jour le slug de l'annonce si vide
      if (!annonce.slug) {
        await db.update(annonces).set({ slug: meta.slug }).where(eq(annonces.id, input.annonceId));
      }

      return meta;
    }),

  // Générer/mettre à jour toutes les pages programmatiques (services, pièces,
  // locations, pays, marques, modèles, villes). Idempotent.
  generateProgrammaticPages: adminProcedure.mutation(async () => {
    return generateProgrammaticPages();
  }),

  // Répartition des pages SEO par type (pour le tableau de bord).
  pagesByType: adminProcedure.query(async () => {
    return db
      .select({ pageType: seoPages.pageType, count: sql<number>`count(*)` })
      .from(seoPages)
      .groupBy(seoPages.pageType)
      .orderBy(desc(sql`count(*)`));
  }),

  // ─── SEO OS : base de mots-clés (Phase 1) ───

  // Catalogue curé (référence en code) : mots-clés par univers.
  keywordCatalog: adminProcedure.query(() => ({
    catalog: SEO_KEYWORD_CATALOG,
    total: catalogSize(),
    universes: SEO_KEYWORD_CATALOG.length,
  })),

  // Répartition des mots-clés réellement enregistrés en base, par univers.
  keywordStats: adminProcedure.query(async () => {
    const byUnivers = await keywordsByUnivers();
    const total = byUnivers.reduce((s, r) => s + Number(r.count), 0);
    return { byUnivers, total, catalogTotal: catalogSize() };
  }),

  // Liste des mots-clés enregistrés (filtrable par univers).
  listKeywords: adminProcedure
    .input(z.object({ univers: z.string().optional(), limit: z.number().min(1).max(2000).default(500) }).optional())
    .query(async ({ input }) => {
      return db
        .select()
        .from(seoKeywords)
        .where(input?.univers ? eq(seoKeywords.univers, input.univers) : undefined)
        .orderBy(seoKeywords.univers, seoKeywords.keyword)
        .limit(input?.limit ?? 500);
    }),

  // Alimente / complète la base de mots-clés (idempotent). Supervisé.
  seedKeywords: adminProcedure
    .input(z.object({ language: z.string().max(4).optional(), country: z.string().max(4).optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const report = await seedKeywords({ language: input?.language, country: input?.country });
      try {
        await logActivity({
          action: "seo.keywords_seeded",
          userId: ctx.user.uid,
          targetType: "seo_keywords",
          data: { ...report },
          result: "success",
          proposedDecision: `Base SEO complétée : ${report.inserted} mot(s)-clé(s) ajouté(s) sur ${report.total} (${report.universes} univers).`,
        });
      } catch {
        // supervision best-effort
      }
      return report;
    }),

  // ─── SEO OS intelligent : analyse + suggestions (validation humaine) ───
  // OBSERVE et PROPOSE uniquement — n'exécute aucune modification.
  analyze: adminProcedure.query(async () => {
    return analyzeSeo();
  }),

  // ─── Indexation (soumission aux moteurs) ───
  // Soumet les pages indexables à IndexNow (si INDEXNOW_KEY configurée).
  submitToIndexNow: adminProcedure
    .input(z.object({ baseUrl: z.string().url().optional(), limit: z.number().min(1).max(10000).default(5000) }))
    .mutation(async ({ input }) => {
      const baseUrl = input.baseUrl || env.PUBLIC_URL;
      const pages = await db
        .select({ canonicalUrl: seoPages.canonicalUrl, slug: seoPages.slug })
        .from(seoPages)
        .where(eq(seoPages.indexed, true))
        .limit(input.limit);
      const urls = pages.map((p) => `${baseUrl}${p.canonicalUrl || `/${p.slug}`}`);
      return submitIndexNow(baseUrl, urls);
    }),

  // Ping des sitemaps (endpoints historiques, dépréciés — journalisé).
  pingSitemaps: adminProcedure
    .input(z.object({ baseUrl: z.string().url().optional() }).optional())
    .mutation(async ({ input }) => {
      const baseUrl = input?.baseUrl || env.PUBLIC_URL;
      return pingSitemaps(baseUrl);
    }),

  indexNowConfigured: adminProcedure.query(() => ({ configured: !!env.INDEXNOW_KEY })),
});
