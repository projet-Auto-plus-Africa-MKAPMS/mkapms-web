// ===== MODULE: DÉPANNAGE / ASSISTANCE =====
// Plan Partie 2 §8 + Partie 3 §11.
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const breakdownStatusEnum = pgEnum("breakdown_status", [
  "demande",
  "en_recherche",
  "devis_envoye",
  "acceptee",
  "en_intervention",
  "terminee",
  "annulee",
  "litige",
]);

export const breakdownProviders = pgTable("breakdown_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  nom: varchar("nom", { length: 160 }).notNull(),
  kbis: varchar("kbis", { length: 64 }),
  assurance: varchar("assurance", { length: 96 }),
  zone: text("zone"),
  countryCode: varchar("country_code", { length: 4 }),
  tarifBase: numeric("tarif_base", { precision: 12, scale: 2 }),
  active: boolean("active").notNull().default(true),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const breakdownRequests = pgTable("breakdown_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  providerId: integer("provider_id"),
  status: breakdownStatusEnum("status").notNull().default("demande"),
  typePanne: varchar("type_panne", { length: 128 }),
  description: text("description"),
  vehicule: varchar("vehicule", { length: 160 }),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  adresse: text("adresse"),
  urgent: boolean("urgent").notNull().default(false),
  photos: text("photos"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const breakdownQuotes = pgTable("breakdown_quotes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  providerId: integer("provider_id").notNull(),
  montant: numeric("montant", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  description: text("description"),
  accepte: boolean("accepte").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const breakdownMissions = pgTable("breakdown_missions", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  providerId: integer("provider_id").notNull(),
  status: breakdownStatusEnum("status").notNull().default("acceptee"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  montantFinal: numeric("montant_final", { precision: 12, scale: 2 }),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
