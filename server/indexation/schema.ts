/**
 * MKA.P-MS Indexation Monitor — tables (points 92-93-98-99-100-101).
 *
 * Trois tables additives, préfixées `indexation_` : aucune table existante
 * n'est touchée. Elles servent à distinguer ce que la plateforme fait
 * (publier, déclarer au sitemap, autoriser le crawl) de ce que Google fait
 * réellement (indexer ou non) — deux choses que rien ne doit confondre.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Une exécution du contrôle d'indexation. */
export const indexationAudits = pgTable("indexation_audits", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  trigger: varchar("trigger", { length: 32 }).notNull().default("manuel"),
  requestedBy: integer("requested_by"),
  baseUrl: varchar("base_url", { length: 255 }).notNull().default(""),
  /** Robots.txt réellement lu au moment du contrôle. */
  robotsFound: boolean("robots_found").notNull().default(false),
  sitemapFound: boolean("sitemap_found").notNull().default(false),
  sitemapUrls: integer("sitemap_urls").notNull().default(0),
  total: integer("total").notNull().default(0),
  parStatut: jsonb("par_statut").$type<Record<string, number>>().default({}),
  parFamille: jsonb("par_famille").$type<Record<string, Record<string, number>>>().default({}),
  /** État réel du connecteur Search Console : jamais supposé actif. */
  searchConsole: jsonb("search_console").$type<Record<string, unknown>>().default({}),
});

/**
 * Le contrôle d'une URL, champ par champ. Chaque colonne est une observation :
 * ce que le serveur a réellement répondu, pas ce que le code prévoit.
 */
export const indexationUrlChecks = pgTable(
  "indexation_url_checks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    auditId: integer("audit_id").notNull(),
    url: varchar("url", { length: 512 }).notNull(),
    /** vehicule · piece · garage · location · controle_technique · pro · service · promotion · pays · categorie */
    famille: varchar("famille", { length: 32 }).notNull(),
    pipeline: varchar("pipeline", { length: 16 }).notNull().default("annonce"),
    httpStatus: integer("http_status"),
    publique: boolean("publique").notNull().default(false),
    indexable: boolean("indexable").notNull().default(false),
    crawlAutorise: boolean("crawl_autorise").notNull().default(false),
    dansSitemap: boolean("dans_sitemap").notNull().default(false),
    canonical: varchar("canonical", { length: 512 }),
    canonicalCoherent: boolean("canonical_coherent").notNull().default(false),
    title: varchar("title", { length: 320 }),
    description: text("description"),
    contenuVisible: integer("contenu_visible").notNull().default(0),
    donneesStructurees: jsonb("donnees_structurees").$type<string[]>().default([]),
    langue: varchar("langue", { length: 16 }),
    pays: varchar("pays", { length: 8 }),
    /** indexe · non_indexe · bloque · erreur · decouvert_non_indexe · action_requise */
    statut: varchar("statut", { length: 32 }).notNull(),
    causeProbable: varchar("cause_probable", { length: 32 }),
    motif: text("motif").notNull().default(""),
    manquant: jsonb("manquant").$type<string[]>().default([]),
    checkedAt: timestamp("checked_at").notNull().defaultNow(),
  },
  (t) => ({
    auditIdx: index("indexation_url_checks_audit_idx").on(t.auditId),
    urlIdx: index("indexation_url_checks_url_idx").on(t.url),
  }),
);

/**
 * Surveillance d'une page publique dans le temps : créée à la publication,
 * elle garde un statut honnête (« Index Google : EN ATTENTE ») jusqu'à preuve
 * du contraire.
 */
export const indexationWatch = pgTable(
  "indexation_watch",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    url: varchar("url", { length: 512 }).notNull().unique(),
    famille: varchar("famille", { length: 32 }).notNull(),
    pipeline: varchar("pipeline", { length: 16 }).notNull().default("annonce"),
    pays: varchar("pays", { length: 8 }),
    langue: varchar("langue", { length: 16 }),
    creeeLe: timestamp("creee_le").notNull().defaultNow(),
    validee: boolean("validee").notNull().default(false),
    seoPrepare: boolean("seo_prepare").notNull().default(false),
    dansSitemap: boolean("dans_sitemap").notNull().default(false),
    crawlAutorise: boolean("crawl_autorise").notNull().default(false),
    indexable: boolean("indexable").notNull().default(false),
    /** en_attente · indexe · non_indexe · bloque · erreur — jamais déduit d'une soumission. */
    indexGoogle: varchar("index_google", { length: 24 }).notNull().default("en_attente"),
    soumisLe: timestamp("soumis_le"),
    dernierControle: timestamp("dernier_controle"),
    dernierMotif: text("dernier_motif").notNull().default(""),
  },
  (t) => ({
    familleIdx: index("indexation_watch_famille_idx").on(t.famille),
    statutIdx: index("indexation_watch_statut_idx").on(t.indexGoogle),
  }),
);
