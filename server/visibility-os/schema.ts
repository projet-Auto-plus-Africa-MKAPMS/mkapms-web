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
 * Audiences (Moteur d'Audience mondial). Une audience = un segment
 * (dimension + valeur) avec une taille estimée à partir des signaux réels de
 * la plateforme.
 *  - `source = owner`     : audience propriétaire, construite gratuitement à
 *    partir de nos données (visiteurs, comptes, recherches, favoris…).
 *  - `source = external_ad` : audience destinée à une diffusion sponsorisée
 *    externe — toujours préparée en `draft` (aucune dépense sans décision).
 */
export const visibilityAudiences = pgTable("visibility_audiences", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  audienceKey: varchar("audience_key", { length: 180 }).notNull().unique(),
  label: varchar("label", { length: 200 }).notNull(),
  dimension: varchar("dimension", { length: 32 }).notNull(), // country|city|lang|account_type|service|vehicle|brand|model|intention|behavior
  value: varchar("value", { length: 160 }).notNull(),
  country: varchar("country", { length: 2 }),
  size: integer("size").default(0).notNull(),
  source: varchar("source", { length: 24 }).default("owner").notNull(), // owner | external_ad
  status: varchar("status", { length: 24 }).default("ready").notNull(), // draft | ready | active
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  refreshedAt: timestamp("refreshed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Base de connaissances pour les assistants IA / moteurs génératifs (GEO).
 * Contenu question/réponse structuré, brand-neutral, indexable et exploitable
 * par les moteurs de recherche et assistants IA. Aucune promesse de
 * recommandation par un fournisseur externe — on rend le contenu découvrable.
 */
export const visibilityAiAnswers = pgTable("visibility_ai_answers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  answerKey: varchar("answer_key", { length: 180 }).notNull().unique(),
  topic: varchar("topic", { length: 48 }).notNull(), // achat|vente|location|garage|controle_technique|carte_grise|pieces|depannage|general
  question: varchar("question", { length: 300 }).notNull(),
  answer: varchar("answer", { length: 2000 }).notNull(),
  lang: varchar("lang", { length: 8 }).default("fr").notNull(),
  country: varchar("country", { length: 2 }),
  link: varchar("link", { length: 1000 }),
  sourceType: varchar("source_type", { length: 48 }),
  sourceId: varchar("source_id", { length: 64 }),
  status: varchar("status", { length: 24 }).default("published").notNull(), // draft | published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Modèle à trois niveaux : mot-clé → question → intention.
 * Exemple : "location voiture" → "où louer une voiture pas chère près de moi ?"
 *           → "LOCATION+LOCAL+PRIX+DISPONIBILITE".
 * Alimente le SEO, la recherche, les suggestions, les recommandations internes,
 * les contenus sociaux, la visibilité IA/GEO et le ciblage d'audience.
 * `trendScore` est dérivé des signaux réels (recherches enregistrées) — jamais
 * copié d'un tiers. Brand-neutral et additif.
 */
export const visibilityIntents = pgTable("visibility_intents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  intentKey: varchar("intent_key", { length: 200 }).notNull().unique(),
  keyword: varchar("keyword", { length: 160 }).notNull(),
  question: varchar("question", { length: 300 }),
  intention: varchar("intention", { length: 200 }).notNull(), // tags majuscules combinés par '+'
  topic: varchar("topic", { length: 48 }).notNull(), // achat|vente|location|garage|...
  lang: varchar("lang", { length: 8 }).default("fr").notNull(),
  country: varchar("country", { length: 2 }),
  trendScore: integer("trend_score").default(0).notNull(),
  source: varchar("source", { length: 24 }).default("base").notNull(), // base | search_signal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
