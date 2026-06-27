// ===== MODULE: HISTORIQUE VÉHICULE (rapports payants) + SUGGESTIONS =====
// Plan Partie 2 §9 / Partie 3 §12 (historique) + Partie 2 §19 / Partie 3 §20 (suggestions).
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

export const vehicleReportStatusEnum = pgEnum("vehicle_report_status", ["en_attente", "pret", "echec"]);
export const suggestionTypeEnum = pgEnum("suggestion_type", ["idee", "amelioration", "difficulte"]);
export const signalementTypeEnum = pgEnum("signalement_type", [
  "bug",
  "fraude",
  "annonce_suspecte",
  "paiement",
  "compte",
  "comportement",
]);

export const vehicleReports = pgTable("vehicle_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  searchType: varchar("search_type", { length: 16 }).notNull(), // plate | vin
  searchValue: varchar("search_value", { length: 64 }).notNull(),
  status: vehicleReportStatusEnum("status").notNull().default("en_attente"),
  kilometrage: integer("kilometrage"),
  controlesTechniques: text("controles_techniques"),
  sinistres: text("sinistres"),
  proprietaires: text("proprietaires"),
  entretien: text("entretien"),
  rappelsConstructeur: text("rappels_constructeur"),
  scoreConfiance: integer("score_confiance"),
  resultData: text("result_data"),
  paid: boolean("paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vehicleReportPayments = pgTable("vehicle_report_payments", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  userId: integer("user_id"),
  montant: numeric("montant", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vinChecks = pgTable("vin_checks", {
  id: serial("id").primaryKey(),
  vin: varchar("vin", { length: 32 }).notNull(),
  reportId: integer("report_id"),
  resultData: text("result_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: suggestionTypeEnum("type").notNull().default("idee"),
  contenu: text("contenu").notNull(),
  traite: boolean("traite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const signalements = pgTable("signalements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: signalementTypeEnum("type").notNull(),
  refType: varchar("ref_type", { length: 64 }),
  refId: integer("ref_id"),
  description: text("description"),
  ticketId: integer("ticket_id"),
  status: varchar("status", { length: 32 }).notNull().default("ouvert"),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
