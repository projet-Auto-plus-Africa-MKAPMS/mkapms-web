// ===== MODULE: VTC / TAXI (sociétés, chauffeurs, flottes) =====
// Plan Partie 2 §3 + Partie 3 §7.
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const transportCompanyTypeEnum = pgEnum("transport_company_type", ["vtc", "taxi", "mixte"]);
export const transportBookingStatusEnum = pgEnum("transport_booking_status", [
  "demande",
  "confirmee",
  "en_cours",
  "terminee",
  "annulee",
]);

export const transportCompanies = pgTable("transport_companies", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  type: transportCompanyTypeEnum("type").notNull().default("vtc"),
  nom: varchar("nom", { length: 160 }).notNull(),
  logoUrl: text("logo_url"),
  kbis: varchar("kbis", { length: 64 }),
  adresse: text("adresse"),
  countryCode: varchar("country_code", { length: 4 }),
  assurancePro: varchar("assurance_pro", { length: 96 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  userId: integer("user_id"),
  nom: varchar("nom", { length: 160 }).notNull(),
  type: transportCompanyTypeEnum("type").notNull().default("vtc"),
  telephone: varchar("telephone", { length: 32 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const driverDocuments = pgTable("driver_documents", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  typeDoc: varchar("type_doc", { length: 64 }).notNull(), // permis, carte_vtc, assurance...
  url: text("url"),
  expiresAt: date("expires_at"),
  verifie: boolean("verifie").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transportVehicles = pgTable("transport_vehicles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  categorie: varchar("categorie", { length: 64 }), // berline, van, electrique, hybride
  marque: varchar("marque", { length: 96 }),
  modele: varchar("modele", { length: 96 }),
  immatriculation: varchar("immatriculation", { length: 32 }),
  carteGrise: text("carte_grise"),
  assurance: text("assurance"),
  controleTechnique: date("controle_technique"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transportBookings = pgTable("transport_bookings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  clientId: integer("client_id").notNull(),
  vehicleId: integer("vehicle_id"),
  driverId: integer("driver_id"),
  status: transportBookingStatusEnum("status").notNull().default("demande"),
  dateService: timestamp("date_service"),
  depart: text("depart"),
  arrivee: text("arrivee"),
  prix: numeric("prix", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
