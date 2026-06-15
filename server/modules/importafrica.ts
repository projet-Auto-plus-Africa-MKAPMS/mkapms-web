// ===== MODULE: IMPORT AFRICA+ (Europe → Afrique) =====
// Plan Partie 2 §10 + Partie 3 §13.
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

export const importStatusEnum = pgEnum("import_status", [
  "reserve",
  "achete",
  "prepare",
  "charge",
  "en_transit",
  "port",
  "douane",
  "entrepot",
  "livre",
  "annule",
]);
export const importTransportOptionEnum = pgEnum("import_transport_option", ["transporteur_personnel", "transport_mkapms"]);

// Partie 10 — multi-entrepôts (France, Guinée, Sénégal, Côte d'Ivoire…).
export const warehouseTypeEnum = pgEnum("warehouse_type", ["vehicules", "pieces", "mixte"]);

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 160 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  ville: varchar("ville", { length: 96 }),
  adresse: text("adresse"),
  responsable: varchar("responsable", { length: 160 }),
  type: warehouseTypeEnum("type").notNull().default("mixte"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const importRequests = pgTable("import_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  annonceId: integer("annonce_id"),
  vehiculeId: integer("vehicule_id"),
  status: importStatusEnum("status").notNull().default("reserve"),
  transportOption: importTransportOptionEnum("transport_option"),
  paysDestination: varchar("pays_destination", { length: 4 }),
  warehouseId: integer("warehouse_id"),
  codeRetrait: varchar("code_retrait", { length: 32 }),
  coutEstime: numeric("cout_estime", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const importVehicles = pgTable("import_vehicles", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  marque: varchar("marque", { length: 96 }),
  modele: varchar("modele", { length: 96 }),
  vin: varchar("vin", { length: 32 }),
  annee: integer("annee"),
  valeur: numeric("valeur", { precision: 12, scale: 2 }),
});

export const importQuotes = pgTable("import_quotes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  montant: numeric("montant", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  details: text("details"),
  accepte: boolean("accepte").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const importTransport = pgTable("import_transport", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  transporteur: varchar("transporteur", { length: 160 }),
  modeTransport: varchar("mode_transport", { length: 64 }),
  numeroSuivi: varchar("numero_suivi", { length: 96 }),
  dateDepart: timestamp("date_depart"),
  dateArriveeEstimee: timestamp("date_arrivee_estimee"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const importDocuments = pgTable("import_documents", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  typeDoc: varchar("type_doc", { length: 64 }).notNull(), // facture_achat, contrat_export, douane...
  url: text("url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customsSteps = pgTable("customs_steps", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  status: importStatusEnum("status").notNull(),
  note: text("note"),
  lieu: varchar("lieu", { length: 160 }),
  // Partie 17 — photos obligatoires (départ, chargement, arrivée, remise client).
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
