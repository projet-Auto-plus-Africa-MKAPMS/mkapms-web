/**
 * VO Engine (points 32-33) — reprise, estimation intelligente et dossier VO.
 *
 * Le module VO interne existant (`server/modules/vo.ts`) gère le cycle d'un
 * véhicule DÉJÀ acheté par MKA.P-MS. Ce moteur-ci gère l'amont côté client :
 * un particulier ou un pro qui veut estimer, vendre ou faire reprendre son
 * véhicule, puis le dossier de confiance qui suit le véhicule.
 */
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const voEstimations = pgTable(
  "vo_estimations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    plaque: varchar("plaque", { length: 24 }),
    vin: varchar("vin", { length: 32 }),
    marque: varchar("marque", { length: 80 }).notNull(),
    modele: varchar("modele", { length: 120 }).notNull(),
    version: varchar("version", { length: 160 }),
    annee: integer("annee"),
    kilometrage: integer("kilometrage"),
    carburant: varchar("carburant", { length: 32 }),
    boite: varchar("boite", { length: 32 }),
    etat: varchar("etat", { length: 32 }),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    /** Fourchette, jamais une valeur unique présentée comme certaine. */
    low: numeric("low", { precision: 12, scale: 2 }).notNull(),
    mid: numeric("mid", { precision: 12, scale: 2 }).notNull(),
    high: numeric("high", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
    /** "comparables" (annonces réelles du marché local) | "modele" (barème décote) */
    method: varchar("method", { length: 24 }).notNull(),
    /** Nombre d'annonces comparables réellement trouvées — 0 est affiché tel quel. */
    sampleSize: integer("sample_size").notNull().default(0),
    /** "faible" | "moyenne" | "bonne" — dépend du nombre de comparables. */
    confidence: varchar("confidence", { length: 12 }).notNull().default("faible"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("vo_estimations_user_idx").on(t.userId, t.createdAt),
  }),
);

export const voRepriseRequests = pgTable(
  "vo_reprise_requests",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    userId: integer("user_id").notNull(),
    estimationId: integer("estimation_id"),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    contactPhone: varchar("contact_phone", { length: 40 }),
    message: text("message"),
    /** "envoyee" | "en_etude" | "offre_proposee" | "acceptee" | "refusee" | "annulee" */
    status: varchar("status", { length: 16 }).notNull().default("envoyee"),
    /** Offre ferme : posée par un humain, jamais calculée automatiquement. */
    offerAmount: numeric("offer_amount", { precision: 12, scale: 2 }),
    offerBy: integer("offer_by"),
    offerAt: timestamp("offer_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    statusIdx: index("vo_reprise_requests_status_idx").on(t.status, t.createdAt),
  }),
);

export const voDossierItems = pgTable(
  "vo_dossier_items",
  {
    id: serial("id").primaryKey(),
    /** Rattachement souple : annonce, véhicule VO interne ou estimation. */
    annonceId: integer("annonce_id"),
    voVehiculeId: integer("vo_vehicule_id"),
    estimationId: integer("estimation_id"),
    /**
     * historique | rapport_atelier | controle | piece_remplacee | facture |
     * preparation | photo | defaut_declare | garantie | livraison | document
     */
    category: varchar("category", { length: 32 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    detail: text("detail"),
    documentUrl: text("document_url"),
    occurredAt: timestamp("occurred_at"),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    meta: jsonb("meta").$type<Record<string, string>>().notNull().default({}),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    annonceIdx: index("vo_dossier_items_annonce_idx").on(t.annonceId, t.category),
    vehiculeIdx: index("vo_dossier_items_vehicule_idx").on(t.voVehiculeId, t.category),
  }),
);
