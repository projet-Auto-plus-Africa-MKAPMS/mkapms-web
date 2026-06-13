// ===== MODULES FUTURS (structurels, masqués au lancement) =====
// Plan Partie 2 §14 (Financement), §15 (Lavage), §16 (Karting), §17 (Formation).
// Tables prévues dès maintenant pour brancher sans refonte (vision 100 ans).
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

// --- Lavage Auto ---
export const lavageStations = pgTable("lavage_stations", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 160 }).notNull(),
  type: varchar("type", { length: 64 }), // lavage, detailing, preparation
  adresse: text("adresse"),
  countryCode: varchar("country_code", { length: 4 }),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  partenaire: boolean("partenaire").notNull().default(false),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lavageBookings = pgTable("lavage_bookings", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull(),
  clientId: integer("client_id").notNull(),
  dateService: timestamp("date_service"),
  prestation: varchar("prestation", { length: 96 }),
  prix: numeric("prix", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("demande"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Karting ---
export const kartingCenters = pgTable("karting_centers", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 160 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }),
  ville: varchar("ville", { length: 96 }),
  adresse: text("adresse"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kartingEvents = pgTable("karting_events", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id"),
  titre: varchar("titre", { length: 160 }).notNull(),
  type: varchar("type", { length: 64 }), // evenement, competition
  dateEvent: date("date_event"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kartingRegistrations = pgTable("karting_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Formation ---
export const formations = pgTable("formations", {
  id: serial("id").primaryKey(),
  titre: varchar("titre", { length: 160 }).notNull(),
  categorie: varchar("categorie", { length: 64 }), // garage, vente, transport...
  description: text("description"),
  videoUrl: text("video_url"),
  certifiante: boolean("certifiante").notNull().default(false),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const formationEnrollments = pgTable("formation_enrollments", {
  id: serial("id").primaryKey(),
  formationId: integer("formation_id").notNull(),
  userId: integer("user_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  certificatUrl: text("certificat_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Financement automobile (conforme, invisible au lancement) ---
export const financementRequests = pgTable("financement_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  refType: varchar("ref_type", { length: 64 }),
  refId: integer("ref_id"),
  montant: numeric("montant", { precision: 14, scale: 2 }),
  type: varchar("type", { length: 64 }), // conforme, achat_revente, fractionne
  status: varchar("status", { length: 32 }).notNull().default("demande"),
  partenaire: varchar("partenaire", { length: 160 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
