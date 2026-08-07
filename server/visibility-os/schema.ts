/**
 * MKA.P-MS Global Visibility Engine — Schéma (tables `visibility_*`).
 *
 * Moteur central de visibilité mondiale : il coordonne SEO, visibilité auprès
 * des assistants IA (GEO), audience, canaux de diffusion (réseaux sociaux) et
 * publication organique. Aucun canal n'est codé en dur : les canaux vivent en
 * base (table `visibility_channels`), le cœur du moteur reste neutre et un
 * nouveau canal s'ajoute par simple configuration.
 *
 * Règle d'architecture : 100 % additif, isolé, connecté au registre central et
 * supervisé par le Système Intelligent. Ne remplace aucune table existante.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Canaux de diffusion pilotés par configuration.
 * `kind` : famille de canal (moteur de recherche, assistant IA, réseau social,
 * canal interne). Le nom de service externe éventuel reste dans `config`
 * (jamais dans le cœur du moteur).
 */
export const visibilityChannels = pgTable("visibility_channels", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  channelKey: varchar("channel_key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(), // search | ai_assistant | social | internal
  enabled: boolean("enabled").default(true).notNull(),
  /** Certaines diffusions (portée sponsorisée) nécessitent un budget média. */
  requiresBudget: boolean("requires_budget").default(false).notNull(),
  /** Publication automatique autorisée (sinon: préparé → validation humaine). */
  autoPublish: boolean("auto_publish").default(false).notNull(),
  config: jsonb("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Contenu central : une information créée une fois sur la plateforme
 * (annonce, service, promotion, garage, pays…). Sert de source unique pour
 * toutes les déclinaisons par canal.
 */
export const visibilityContent = pgTable("visibility_content", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sourceType: varchar("source_type", { length: 48 }).notNull(), // annonce | service | promotion | garage | pays | categorie
  sourceId: varchar("source_id", { length: 64 }),
  title: varchar("title", { length: 200 }).notNull(),
  body: varchar("body", { length: 2000 }).notNull(),
  lang: varchar("lang", { length: 8 }).default("fr").notNull(),
  country: varchar("country", { length: 2 }),
  mediaUrl: varchar("media_url", { length: 1000 }),
  link: varchar("link", { length: 1000 }),
  status: varchar("status", { length: 24 }).default("ready").notNull(), // draft | ready | published
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Déclinaison d'un contenu central adaptée à un canal (Social Content Engine).
 * Le texte est adapté au format du canal (long, court, accroche, hashtags…).
 */
export const visibilityVariants = pgTable("visibility_variants", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  contentId: integer("content_id").notNull(),
  channelKey: varchar("channel_key", { length: 64 }).notNull(),
  text: varchar("text", { length: 2200 }).notNull(),
  hashtags: varchar("hashtags", { length: 500 }),
  status: varchar("status", { length: 24 }).default("prepared").notNull(), // prepared | validated | published | rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Publication d'une déclinaison sur un canal. Tant qu'elle n'est pas validée
 * (ou auto-publiée par règle), elle reste en « préparé » (aucune dépense).
 */
export const visibilityPublications = pgTable("visibility_publications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  variantId: integer("variant_id"),
  contentId: integer("content_id").notNull(),
  channelKey: varchar("channel_key", { length: 64 }).notNull(),
  country: varchar("country", { length: 2 }),
  lang: varchar("lang", { length: 8 }),
  status: varchar("status", { length: 24 }).default("prepared").notNull(), // prepared | validated | published | failed
  externalRef: varchar("external_ref", { length: 255 }),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  validatedBy: integer("validated_by"),
  detail: varchar("detail", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Événements de visibilité (impressions/clics/inscriptions/conversions) par
 * canal — matière première remontée au Système Intelligent pour analyse.
 */
export const visibilityEvents = pgTable("visibility_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  channelKey: varchar("channel_key", { length: 64 }),
  kind: varchar("kind", { length: 32 }).notNull(), // impression | click | signup | request | conversion | prepared
  sourceType: varchar("source_type", { length: 48 }),
  sourceId: varchar("source_id", { length: 64 }),
  country: varchar("country", { length: 2 }),
  value: integer("value").default(1).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
