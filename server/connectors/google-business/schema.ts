/**
 * Point 52 — Google Business Profile : **connecteur externe**, volontairement
 * séparé des moteurs internes et des tables d'avis MKA.P-MS.
 *
 * Règle qui justifie cette séparation : un avis Google appartient à Google. Il
 * n'est ni copié dans `reviews_v2`, ni présenté comme un avis MKA.P-MS, et un
 * avis MKA.P-MS n'est jamais présenté comme déposé sur Google. Le connecteur ne
 * conserve donc que des **relevés** (note moyenne et volume constatés à une date
 * donnée), avec leur origine et l'auteur du relevé.
 */
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Établissement physique éligible, rattaché à une fiche interne. */
export const gbpLocations = pgTable("gbp_locations", {
  id: serial("id").primaryKey(),
  /** Fiche interne concernée (`garage`, `boutique_pieces`…). */
  targetType: varchar("target_type", { length: 32 }).notNull(),
  targetId: integer("target_id").notNull(),
  nom: varchar("nom", { length: 200 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }),
  ville: varchar("ville", { length: 120 }),
  /** Identifiants Google — saisis par la direction, jamais devinés. */
  placeId: varchar("place_id", { length: 128 }),
  gbpLocationName: varchar("gbp_location_name", { length: 200 }),
  gbpUrl: text("gbp_url"),
  status: varchar("status", { length: 20 }).notNull().default("declare"),
  // "declare" | "verifie" | "suspendu"
  declaredBy: integer("declared_by"),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Relevé de la réputation Google d'un établissement à une date.
 * `source` reste explicite pour que l'origine ne puisse pas être confondue.
 */
export const gbpReviewSnapshots = pgTable("gbp_review_snapshots", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  source: varchar("source", { length: 16 }).notNull().default("google"),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").notNull().default(0),
  /** Comment le relevé a été obtenu : "api" ou "saisie_manuelle". */
  collectionMode: varchar("collection_mode", { length: 20 }).notNull(),
  collectedBy: integer("collected_by"),
  collectedAt: timestamp("collected_at").notNull().defaultNow(),
  /** Vrai uniquement si le relevé provient d'un appel API réussi. */
  fromApi: boolean("from_api").notNull().default(false),
  detail: text("detail"),
});
