/**
 * MKA.P-MS Financial Intelligence — schéma (table isolée).
 *
 * Une anomalie financière détectée est écrite ici pour ne jamais rester
 * silencieuse : elle a un cycle de vie (ouverte → traitée / ignorée) et une
 * trace de qui a tranché.
 */
import {
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

export const financeAnomalies = pgTable(
  "finance_anomalies",
  {
    id: serial("id").primaryKey(),
    /** Code du détecteur (voir DETECTORS). */
    code: varchar("code", { length: 48 }).notNull(),
    /** "critique" | "important" | "a_surveiller" */
    severity: varchar("severity", { length: 16 }).notNull().default("a_surveiller"),
    /** Objet concerné : "payment" | "subscription" | "booking" | "transaction". */
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }).notNull(),
    userId: integer("user_id"),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 8 }),
    detail: text("detail").notNull(),
    /** "ouverte" | "traitee" | "ignoree" */
    status: varchar("status", { length: 16 }).notNull().default("ouverte"),
    resolutionNote: text("resolution_note"),
    resolvedBy: integer("resolved_by"),
    resolvedAt: timestamp("resolved_at"),
    context: jsonb("context"),
    detectedAt: timestamp("detected_at").notNull().defaultNow(),
  },
  (t) => ({
    /** Une même anomalie ne doit pas être recréée à chaque analyse. */
    uniqueIdx: index("finance_anomalies_unique_idx").on(t.code, t.entityType, t.entityId),
    statusIdx: index("finance_anomalies_status_idx").on(t.status, t.severity),
  }),
);
