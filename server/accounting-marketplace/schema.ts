/**
 * Marketplace Comptabilité (point 26 B) — annuaire des comptables indépendants.
 *
 * Univers volontairement séparé de la comptabilité interne : ces tables ne
 * référencent aucune écriture MKA.P-MS. Un comptable indépendant est un
 * prestataire trouvable, pas un accès aux comptes de la plateforme.
 */
import {
  boolean,
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

export const accountantProfiles = pgTable(
  "accountant_profiles",
  {
    id: serial("id").primaryKey(),
    /** Compte utilisateur propriétaire de la fiche. */
    userId: integer("user_id").notNull(),
    /** Cabinet rattaché (table `cabinets_comptables`), facultatif : un indépendant peut exercer seul. */
    cabinetId: integer("cabinet_id"),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    countryCode: varchar("country_code", { length: 4 }).notNull(),
    city: varchar("city", { length: 120 }),
    postalCode: varchar("postal_code", { length: 16 }),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    /** Spécialités : tva, paie, bilan, creation_entreprise, fiscalite_auto… */
    specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
    languages: jsonb("languages").$type<string[]>().notNull().default(["fr"]),
    /** Tarif indicatif ; null = « sur devis », jamais un prix inventé. */
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
    /** "disponible" | "complet" | "sur_rdv" */
    availability: varchar("availability", { length: 16 }).notNull().default("disponible"),
    bio: text("bio"),
    /** Une fiche n'est publiée qu'après vérification : pas d'annuaire fantôme. */
    verified: boolean("verified").notNull().default(false),
    published: boolean("published").notNull().default(false),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    searchIdx: index("accountant_profiles_search_idx").on(t.countryCode, t.published, t.verified),
  }),
);

export const accountantRequests = pgTable(
  "accountant_requests",
  {
    id: serial("id").primaryKey(),
    /** Demandeur : « je cherche un comptable ». */
    userId: integer("user_id").notNull(),
    accountantId: integer("accountant_id"),
    countryCode: varchar("country_code", { length: 4 }).notNull(),
    city: varchar("city", { length: 120 }),
    specialty: varchar("specialty", { length: 48 }),
    message: text("message"),
    /** "envoyee" | "acceptee" | "refusee" | "cloturee" */
    status: varchar("status", { length: 16 }).notNull().default("envoyee"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
  },
  (t) => ({
    statusIdx: index("accountant_requests_status_idx").on(t.status, t.createdAt),
  }),
);
