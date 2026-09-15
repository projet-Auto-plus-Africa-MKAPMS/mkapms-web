// ===== MODULE: WALLET PROFESSIONNEL =====
// Plan Partie 2 §12 + Partie 3 §15. Stripe Connect recommandé.
//
// LOT 5 du Plan Maître Fournisseurs (§29 INTERNAL LEDGER) : ce Ledger était
// jusqu'ici réservé aux utilisateurs plateforme (`userId`). Le plan exige
// aussi un « Solde fournisseur » et un « Solde transporteur » — un
// fournisseur/transporteur n'a pas toujours de compte utilisateur classique.
// Extension additive : `ownerType` distingue le porteur du wallet,
// `supplierProfileId`/`carrierCode` référencent respectivement le Supplier
// Engine (LOT 1) et le catalogue transporteur du Logistics Engine (LOT 4) en
// lecture seule, sans FK dure (même principe que le reste du plan). `userId`
// devient nullable : un wallet fournisseur/transporteur/plateforme n'a pas
// nécessairement d'utilisateur associé. Aucune ligne existante n'est
// modifiée par ce changement (défaut `ownerType = 'user'`).
import {
  boolean,
  index,
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
/** Porteur du wallet (§29) : un utilisateur plateforme, un fournisseur (LOT 1), un transporteur (LOT 4), ou le solde MKA.P-MS lui-même. */
export const walletOwnerTypeEnum = pgEnum("wallet_owner_type", ["user", "supplier", "carrier", "platform"]);

export const wallets = pgTable(
  "wallets",
  {
    id: serial("id").primaryKey(),
    ownerType: walletOwnerTypeEnum("owner_type").notNull().default("user"),
    userId: integer("user_id"),
    /** Fournisseur du Supplier Engine (LOT 1), si `ownerType = 'supplier'`. */
    supplierProfileId: integer("supplier_profile_id"),
    /** Code du catalogue transporteur (Logistics Engine, LOT 4), si `ownerType = 'carrier'`. */
    carrierCode: varchar("carrier_code", { length: 32 }),
    soldeDisponible: numeric("solde_disponible", { precision: 14, scale: 2 }).notNull().default("0"),
    soldeAttente: numeric("solde_attente", { precision: 14, scale: 2 }).notNull().default("0"),
    soldeBloque: numeric("solde_bloque", { precision: 14, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
    stripeConnectId: varchar("stripe_connect_id", { length: 96 }),
    payoutFrequency: payoutFrequencyEnum("payout_frequency").notNull().default("manuel"),
    nextPayoutDate: timestamp("next_payout_date"),
    totalEncaisse: numeric("total_encaisse", { precision: 14, scale: 2 }).notNull().default("0"),
    totalVire: numeric("total_vire", { precision: 14, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index("wallets_owner_idx").on(t.ownerType, t.userId, t.supplierProfileId, t.carrierCode),
  }),
);

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: walletTxTypeEnum("type").notNull(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  reference: varchar("reference", { length: 96 }),
  description: text("description"),
  sourceType: varchar("source_type", { length: 64 }), // "vente", "location", "service", "commission", etc.
  sourceId: integer("source_id"),
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
  bankAccountId: integer("bank_account_id"),
  frais: numeric("frais", { precision: 10, scale: 2 }).notNull().default("0"),
  note: text("note"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Comptes bancaires liés au wallet (IBAN pour virements)
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  walletId: integer("wallet_id").notNull(),
  titulaire: varchar("titulaire", { length: 128 }).notNull(),
  iban: varchar("iban", { length: 34 }).notNull(),
  bic: varchar("bic", { length: 11 }),
  banque: varchar("banque", { length: 128 }),
  isDefault: boolean("is_default").notNull().default(false),
  stripeExternalAccountId: varchar("stripe_external_account_id", { length: 96 }),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
