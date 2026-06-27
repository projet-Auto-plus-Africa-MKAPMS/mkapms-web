// ===== MODULE: PAIEMENT FRACTIONNÉ =====
// Plan Partie 2 §13 + Partie 3 §14. Masqué par défaut, activable par admin.
// Particulier: 10 fois max — Pro: 5 fois max.
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

export const installmentStatusEnum = pgEnum("installment_status", [
  "demande",
  "dossier",
  "valide_admin",
  "contrat",
  "signe",
  "actif",
  "termine",
  "rejete",
  "impaye",
]);
export const installmentAlertLevelEnum = pgEnum("installment_alert_level", ["j1", "j3", "j7", "impaye"]);

export const installmentRequests = pgTable("installment_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  refType: varchar("ref_type", { length: 64 }),
  refId: integer("ref_id"),
  status: installmentStatusEnum("status").notNull().default("demande"),
  montantTotal: numeric("montant_total", { precision: 14, scale: 2 }).notNull(),
  apport: numeric("apport", { precision: 14, scale: 2 }).default("0"),
  nbEcheances: integer("nb_echeances").notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  isPro: boolean("is_pro").notNull().default(false),
  validatedBy: integer("validated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const installmentContracts = pgTable("installment_contracts", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  documentId: integer("document_id"),
  status: installmentStatusEnum("status").notNull().default("contrat"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const installmentPayments = pgTable("installment_payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  numero: integer("numero").notNull(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  paymentId: integer("payment_id"),
});

export const installmentAlerts = pgTable("installment_alerts", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  paymentId: integer("payment_id"),
  level: installmentAlertLevelEnum("level").notNull(),
  sent: boolean("sent").notNull().default(false),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
