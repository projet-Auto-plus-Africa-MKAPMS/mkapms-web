/**
 * Payout Engine — schéma (LOT 5 du Plan Maître Fournisseurs, §32). Aucune
 * table de solde n'est recréée ici : le Ledger reste `wallets`/`payouts`
 * (`server/modules/wallet.ts`, étendu en LOT 5 avec `ownerType`). Ce moteur
 * ne fait que décider quand un montant déjà bloqué au Ledger devient
 * disponible, et journalise chaque décision.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { PayoutStageState } from "./contract.js";

/**
 * Politique de versement par fournisseur/transporteur (ou politique par
 * défaut si `supplierProfileId`/`carrierCode` sont nuls). "Politique par
 * contrat" (plan §32) : `contractRef` permet une politique spécifique à un
 * contrat plutôt qu'à l'ensemble du partenaire.
 */
export const payoutPolicies = pgTable(
  "payout_policies",
  {
    id: serial("id").primaryKey(),
    targetType: varchar("target_type", { length: 16 }).notNull(),
    supplierProfileId: integer("supplier_profile_id"),
    carrierCode: varchar("carrier_code", { length: 32 }),
    contractRef: varchar("contract_ref", { length: 64 }),
    splitCode: varchar("split_code", { length: 32 }).notNull(),
    stages: jsonb("stages").$type<{ trigger: string; pct: number }[]>().notNull(),
    /** "Validation humaine possible" (plan §32) : aucune étape ne se libère seule si vrai. */
    requiresHumanValidation: boolean("requires_human_validation").notNull().default(true),
    active: boolean("active").notNull().default(true),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    targetIdx: index("payout_policies_target_idx").on(t.targetType, t.supplierProfileId, t.carrierCode, t.active),
  }),
);

/**
 * Un versement planifié pour une vente/expédition donnée : combien est dû,
 * la répartition par étape (figée au moment de la création — un changement
 * de politique ne modifie jamais un versement déjà planifié), et l'état réel
 * de chaque étape.
 */
export const payoutSchedules = pgTable(
  "payout_schedules",
  {
    id: serial("id").primaryKey(),
    policyId: integer("policy_id"),
    /** "vehicle_sale" | "logistics_leg" — jamais un moteur qui gère lui-même l'argent. */
    sourceType: varchar("source_type", { length: 32 }).notNull(),
    sourceId: integer("source_id").notNull(),
    targetType: varchar("target_type", { length: 16 }).notNull(),
    supplierProfileId: integer("supplier_profile_id"),
    carrierCode: varchar("carrier_code", { length: 32 }),
    targetWalletId: integer("target_wallet_id").notNull(),
    grossAmount: numeric("gross_amount", { precision: 14, scale: 2 }).notNull(),
    commissionRatePct: numeric("commission_rate_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    commissionAmount: numeric("commission_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
    stages: jsonb("stages").$type<PayoutStageState[]>().notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    sourceIdx: index("payout_schedules_source_idx").on(t.sourceType, t.sourceId),
    targetIdx: index("payout_schedules_target_idx").on(t.targetType, t.supplierProfileId, t.carrierCode),
    statusIdx: index("payout_schedules_status_idx").on(t.status),
  }),
);

/** Audit obligatoire (règle MOS #12 : table `<engine>_audit_log`). */
export const payoutAuditLog = pgTable(
  "payout_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    scheduleId: integer("schedule_id"),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    scheduleIdx: index("payout_audit_log_schedule_idx").on(t.scheduleId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que les autres moteurs LOT 1-4). */
export const payoutHealthLog = pgTable("payout_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
