// Module SEO MKA.P-MS — Indexation automatique, données structurées, sitemap
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Pages SEO générées automatiquement (pages géographiques, catégories, etc.)
export const seoPages = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 512 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  metaDescription: varchar("meta_description", { length: 320 }).notNull(),
  h1: varchar("h1", { length: 200 }),
  content: text("content"),
  keywords: jsonb("keywords").default("[]"),
  pageType: varchar("page_type", { length: 32 }).notNull(), // 'geo_garage', 'geo_location', 'category', 'guide', 'blog'
  univers: varchar("univers", { length: 32 }),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 4 }),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  schemaMarkup: jsonb("schema_markup"), // JSON-LD complet
  indexed: boolean("indexed").notNull().default(true),
  priority: varchar("priority", { length: 4 }).notNull().default("0.7"), // sitemap priority
  changeFreq: varchar("change_freq", { length: 16 }).notNull().default("weekly"),
  lastIndexedAt: timestamp("last_indexed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Mots-clés par univers (bibliothèque)
export const seoKeywords = pgTable("seo_keywords", {
  id: serial("id").primaryKey(),
  univers: varchar("univers", { length: 32 }).notNull(),
  keyword: varchar("keyword", { length: 128 }).notNull(),
  volume: integer("volume"), // volume de recherche estimé
  difficulty: integer("difficulty"), // 0-100
  language: varchar("language", { length: 4 }).notNull().default("fr"),
  country: varchar("country", { length: 4 }).notNull().default("FR"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex("seo_keywords_univers_keyword_lang_country_uniq").on(
    t.univers,
    t.keyword,
    t.language,
    t.country,
  ),
}));

// Journal d'indexation Google (suivi des soumissions)
export const seoIndexingLog = pgTable("seo_indexing_log", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  action: varchar("action", { length: 16 }).notNull(), // 'index', 'deindex'
  source: varchar("source", { length: 32 }).notNull(), // 'annonce_publiee', 'annonce_vendue', 'auto_sitemap'
  sourceId: integer("source_id"),
  success: boolean("success").notNull().default(false),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Articles blog/guides SEO
export const seoBlogArticles = pgTable("seo_blog_articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  metaDescription: varchar("meta_description", { length: 320 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  category: varchar("category", { length: 64 }).notNull(), // 'guide_achat', 'entretien', 'reglementation', 'financement', 'electrique'
  tags: jsonb("tags").default("[]"),
  keywords: jsonb("keywords").default("[]"),
  schemaMarkup: jsonb("schema_markup"),
  authorId: integer("author_id"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Configuration SEO de la plateforme
export const seoConfig = pgTable("seo_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  description: varchar("description", { length: 255 }),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
