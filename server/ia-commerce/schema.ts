/**
 * AL-HOUDOUD·M — Commerce IA (grille tarifaire, crédits prépayés).
 *
 * Module 100 % additif. Les offres elles-mêmes (prix, quotas, fonctionnalités)
 * vivent dans le registre existant `payment_products` (univers="ia", voir
 * catalog.ts) — jamais dupliquées ici. Ce fichier ne porte que ce qui n'a
 * pas d'équivalent réutilisable : le portefeuille de crédits prépayés
 * (`wallets` existant représente l'inverse — de l'argent DÛ à un pro, pas un
 * solde prépayé consommé par un client) et son grand livre.
 */
import { bigserial, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const iaCreditWallets = pgTable("ia_credit_wallets", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id").notNull().unique(),
  // Unité AL-HOUDOUD·M (voir catalog.ts — 1 unité ≈ 0,04 € de coût réel mesuré).
  balanceUnites: numeric("balance_unites", { precision: 14, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const iaCreditLedger = pgTable("ia_credit_ledger", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id").notNull(),
  // "achat" | "abonnement" | "bonus_essai" | "consommation" | "ajustement_pdg"
  type: varchar("type", { length: 24 }).notNull(),
  // Positif = crédit ajouté, négatif = consommation.
  unites: numeric("unites", { precision: 14, scale: 2 }).notNull(),
  soldeApres: numeric("solde_apres", { precision: 14, scale: 2 }).notNull(),
  // Référence facultative vers payments.id (achat réel ayant déclenché ce mouvement).
  paymentId: integer("payment_id"),
  // Référence facultative vers af_cost_entries.id (consommation réelle mesurée).
  afCostEntryId: integer("af_cost_entry_id"),
  note: text("note"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
