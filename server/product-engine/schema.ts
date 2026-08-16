/**
 * MKA.P-MS GOOGLE PRODUCT ENGINE — points 94 à 97.
 *
 * Tables additives. Elles ne remplacent aucun catalogue existant : le catalogue
 * métier reste `parts_catalog` / `pieces`. Ici on stocke uniquement la
 * *projection commerciale* d'un produit vers les canaux Google, et l'état réel
 * de chaque destination.
 *
 * Règle du point 96 : « produit envoyé ≠ produit approuvé ≠ produit visible ».
 * Les trois états sont donc trois colonnes distinctes, jamais une seule.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Un article de flux produit : la fiche telle qu'elle serait présentée aux
 * canaux Google, avec les attributs exigés (point 95).
 */
export const productFeedItems = pgTable(
  "product_feed_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // Origine réelle dans la plateforme — jamais une fiche inventée.
    source: varchar("source", { length: 32 }).notNull(),
    sourceId: integer("source_id").notNull(),
    offerId: varchar("offer_id", { length: 96 }).notNull(),
    titre: varchar("titre", { length: 255 }).notNull().default(""),
    description: text("description").notNull().default(""),
    url: varchar("url", { length: 512 }).notNull().default(""),
    imageUrl: text("image_url"),
    prix: numeric("prix", { precision: 12, scale: 2 }),
    devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
    disponibilite: varchar("disponibilite", { length: 24 }).notNull().default("indisponible"),
    etat: varchar("etat", { length: 24 }).notNull().default("neuf"),
    marque: varchar("marque", { length: 128 }),
    gtin: varchar("gtin", { length: 32 }),
    mpn: varchar("mpn", { length: 64 }),
    pays: varchar("pays", { length: 8 }).notNull().default("FR"),
    langue: varchar("langue", { length: 16 }).notNull().default("fr"),
    categorie: varchar("categorie", { length: 160 }),
    // Éligibilité aux fiches gratuites Merchant Center (point 94).
    eligible: boolean("eligible").notNull().default(false),
    motifIneligible: text("motif_ineligible").notNull().default(""),
    attributsManquants: jsonb("attributs_manquants").$type<string[]>().default([]),
    // Les trois états séparés du point 96.
    envoye: boolean("envoye").notNull().default(false),
    approuve: boolean("approuve").notNull().default(false),
    visible: boolean("visible").notNull().default(false),
    etatCanal: text("etat_canal").notNull().default(""),
    empreinte: varchar("empreinte", { length: 64 }).notNull().default(""),
    creeLe: timestamp("cree_le").notNull().defaultNow(),
    majLe: timestamp("maj_le").notNull().defaultNow(),
  },
  (t) => ({
    sourceUnique: unique("product_feed_items_source_unique").on(t.source, t.sourceId),
    eligibleIdx: index("product_feed_items_eligible_idx").on(t.eligible),
  }),
);

/**
 * Journal de la chaîne de synchronisation du point 97 : chaque maillon
 * (base produit → SEO → Schema Product → Product Engine → Merchant →
 * Audience → Social → Système Intelligent) est tracé avec son résultat réel.
 */
export const productSyncEvents = pgTable(
  "product_sync_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    itemId: integer("item_id"),
    source: varchar("source", { length: 32 }).notNull(),
    sourceId: integer("source_id").notNull(),
    declencheur: varchar("declencheur", { length: 24 }).notNull().default("depot"),
    maillon: varchar("maillon", { length: 32 }).notNull(),
    resultat: varchar("resultat", { length: 16 }).notNull().default("attente"),
    detail: text("detail").notNull().default(""),
    creeLe: timestamp("cree_le").notNull().defaultNow(),
  },
  (t) => ({
    sourceIdx: index("product_sync_events_source_idx").on(t.source, t.sourceId),
  }),
);

/** Photographie d'un rafraîchissement complet du flux (pour l'écran PDG). */
export const productFeedRuns = pgTable("product_feed_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  trigger: varchar("trigger", { length: 32 }).notNull().default("manuel"),
  requestedBy: integer("requested_by"),
  examines: integer("examines").notNull().default(0),
  eligibles: integer("eligibles").notNull().default(0),
  inelligibles: integer("inelligibles").notNull().default(0),
  parMotif: jsonb("par_motif").$type<Record<string, number>>().default({}),
  destination: jsonb("destination").$type<Record<string, unknown>>().default({}),
});
