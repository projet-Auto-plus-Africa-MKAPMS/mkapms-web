/**
 * MKA.P-MS Payment Engine — Schema (tables isolées)
 *
 * Moteur de paiement propriétaire (Phase 2). Stripe et les autres prestataires
 * sont de simples **connecteurs d'exécution** : les règles métier (référence
 * interne, statuts, rapprochement, adaptation par pays) vivent ici.
 *
 * Toutes les tables sont préfixées `payment_`. Module 100 % additif : la table
 * `payments` existante n'est pas modifiée (le Payment Engine la référence en
 * lecture si besoin, via `legacy_payment_id`).
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ── Transaction interne ───────────────────────────────────────────────────
// Chaque tentative de paiement reçoit une référence interne unique.
// Ex: MKA-PAY-FR-2026-000001
export const paymentTransactions = pgTable("payment_transactions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  reference: varchar("reference", { length: 40 }).notNull().unique(),
  userId: integer("user_id"),
  // Ce qui est payé : "subscription" | "order" | "service" | "vehicle" | "other"
  entityType: varchar("entity_type", { length: 32 }).notNull().default("other"),
  entityId: varchar("entity_id", { length: 64 }),
  univers: varchar("univers", { length: 48 }),
  service: varchar("service", { length: 64 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  // "card" | "bank_transfer" | "deposit" | "full" | "installment" | "wallet"
  method: varchar("method", { length: 24 }).notNull().default("card"),
  // voir PAYMENT_STATUSES
  status: varchar("status", { length: 24 }).notNull().default("cree"),
  countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
  stripeSessionId: varchar("stripe_session_id", { length: 256 }),
  stripePaymentId: varchar("stripe_payment_id", { length: 256 }),
  invoiceRef: varchar("invoice_ref", { length: 64 }),
  // Lien optionnel, en lecture, vers la table `payments` historique.
  legacyPaymentId: integer("legacy_payment_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Journal des événements d'une transaction ──────────────────────────────
export const paymentEvents = pgTable("payment_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  type: varchar("type", { length: 48 }).notNull(), // "created" | "status_changed" | "webhook" | ...
  fromStatus: varchar("from_status", { length: 24 }),
  toStatus: varchar("to_status", { length: 24 }),
  data: jsonb("data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Virements bancaires attendus ──────────────────────────────────────────
export const paymentBankTransfers = pgTable("payment_bank_transfers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  beneficiary: varchar("beneficiary", { length: 160 }).notNull(),
  iban: varchar("iban", { length: 40 }).notNull(),
  bic: varchar("bic", { length: 16 }),
  expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  reference: varchar("reference", { length: 40 }).notNull(), // référence obligatoire = transaction.reference
  dueDate: timestamp("due_date"),
  reconciled: boolean("reconciled").notNull().default(false),
  reconciledAt: timestamp("reconciled_at"),
  reconciledBy: integer("reconciled_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Remboursements ────────────────────────────────────────────────────────
export const paymentRefunds = pgTable("payment_refunds", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 24 }).notNull().default("cree"), // "cree" | "traite" | "refuse"
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── RIB professionnels ────────────────────────────────────────────────────
export const paymentProRib = pgTable("payment_pro_rib", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  holder: varchar("holder", { length: 160 }).notNull(),
  iban: varchar("iban", { length: 40 }).notNull(),
  bic: varchar("bic", { length: 16 }),
  countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
  bankName: varchar("bank_name", { length: 120 }),
  // Vérification de format ≠ preuve de propriété : vérification renforcée à prévoir.
  formatValid: boolean("format_valid").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Règles par pays ───────────────────────────────────────────────────────
export const paymentCountryRules = pgTable("payment_country_rules", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 4 }).notNull().unique(),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  // Moyens autorisés pour ce pays. Ex: ["card","bank_transfer"]
  methods: jsonb("methods").$type<string[]>().default([]),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
