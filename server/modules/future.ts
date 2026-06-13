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

// --- Contrôle technique (Partie 4/4 §6 — référencement des centres) ---
export const controleTechniqueCenters = pgTable("controle_technique_centers", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 160 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }),
  ville: varchar("ville", { length: 96 }),
  adresse: text("adresse"),
  horaires: text("horaires"),
  telephone: varchar("telephone", { length: 32 }),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const controleTechniqueRdv = pgTable("controle_technique_rdv", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  userId: integer("user_id").notNull(),
  vehiculeId: integer("vehicule_id"),
  dateRdv: timestamp("date_rdv"),
  prix: numeric("prix", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("demande"),
  resultat: varchar("resultat", { length: 32 }), // favorable, defavorable, contre_visite
  prochainControle: date("prochain_controle"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Fournisseurs mondiaux (Partie 4/4 §11 — base partenaires import/export) ---
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 200 }).notNull(),
  type: varchar("type", { length: 64 }), // auto1, europe, chine_asie, transporteur, garage, entrepot
  countryCode: varchar("country_code", { length: 4 }),
  services: text("services"),
  contactEmail: varchar("contact_email", { length: 160 }),
  contactTelephone: varchar("contact_telephone", { length: 32 }),
  notationInterne: numeric("notation_interne", { precision: 3, scale: 2 }).default("0"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
