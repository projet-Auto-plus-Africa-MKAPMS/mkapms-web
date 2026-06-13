// ===== MODULE: WALLET PROFESSIONNEL =====
// Plan Partie 2 §12 + Partie 3 §15. Stripe Connect recommandé.
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

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "credit",
  "debit",
  "retrait",
  "commission",
  "remboursement",
  "blocage",
  "deblocage",
]);
export const payoutStatusEnum = pgEnum("payout_status", ["demande", "en_cours", "paye", "echoue", "annule"]);
export const payoutFrequencyEnum = pgEnum("payout_frequency", ["manuel", "hebdomadaire", "mensuel"]);

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  soldeDisponible: numeric("solde_disponible", { precision: 14, scale: 2 }).notNull().default("0"),
  soldeAttente: numeric("solde_attente", { precision: 14, scale: 2 }).notNull().default("0"),
  soldeBloque: numeric("solde_bloque", { precision: 14, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  stripeConnectId: varchar("stripe_connect_id", { length: 96 }),
  payoutFrequency: payoutFrequencyEnum("payout_frequency").notNull().default("manuel"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: walletTxTypeEnum("type").notNull(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  reference: varchar("reference", { length: 96 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  userId: integer("user_id").notNull(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  status: payoutStatusEnum("status").notNull().default("demande"),
  stripePayoutId: varchar("stripe_payout_id", { length: 96 }),
  automatique: boolean("automatique").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
