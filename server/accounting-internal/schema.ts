/**
 * Comptabilité interne MKA.P-MS (point 26 A) — rapprochement paiement ↔ écriture.
 *
 * Un paiement encaissé qui n'a pas d'écriture comptable est de l'argent qui
 * existe en banque mais pas dans les comptes. Cette table est le pont, avec
 * une ligne par paiement pour que le rapprochement soit rejouable sans double
 * écriture.
 */
import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const comptaRapprochements = pgTable(
  "compta_rapprochements",
  {
    id: serial("id").primaryKey(),
    /** Paiement source (table `payments`). Unique : pas de double écriture. */
    paymentId: integer("payment_id").notNull().unique(),
    /** Écriture comptable générée (table `compta_ecritures`). */
    ecritureId: integer("ecriture_id"),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
    /** "rapproche" | "ecart" | "impossible" */
    status: varchar("status", { length: 16 }).notNull().default("rapproche"),
    detail: text("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("compta_rapprochements_status_idx").on(t.status, t.createdAt),
  }),
);
