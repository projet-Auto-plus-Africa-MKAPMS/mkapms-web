/**
 * Points 102-103 — audit et activation réelle du Système Intelligent.
 * Tables additives : rien du Smart Engine existant n'est modifié.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const smartAuditRuns = pgTable("smart_audit_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  trigger: varchar("trigger", { length: 24 }).notNull().default("manuel"),
  requestedBy: integer("requested_by"),
  total: integer("total").notNull().default(0),
  parEtat: jsonb("par_etat").$type<Record<string, number>>().default({}),
  /** Niveau d'autonomie réellement atteint, calculé et non déclaré. */
  autonomie: varchar("autonomie", { length: 24 }).notNull().default("observation"),
  autonomieMotif: text("autonomie_motif").notNull().default(""),
});

export const smartAuditItems = pgTable("smart_audit_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  runId: integer("run_id").notNull(),
  capacite: varchar("capacite", { length: 32 }).notNull(),
  ordre: integer("ordre").notNull().default(0),
  label: varchar("label", { length: 160 }).notNull(),
  etat: varchar("etat", { length: 20 }).notNull(),
  codePresent: boolean("code_present").notNull().default(false),
  branche: boolean("branche").notNull().default(false),
  usageReel: boolean("usage_reel").notNull().default(false),
  lignes: integer("lignes").notNull().default(0),
  dernierUsage: timestamp("dernier_usage"),
  autonomie: varchar("autonomie", { length: 24 }).notNull().default("observation"),
  motif: text("motif").notNull().default(""),
  manquant: jsonb("manquant").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Journal du cycle réellement exécuté (point 103). */
export const smartCycleRuns = pgTable("smart_cycle_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  trigger: varchar("trigger", { length: 24 }).notNull().default("manuel"),
  requestedBy: integer("requested_by"),
  etapes: jsonb("etapes")
    .$type<{ etape: string; resultat: string; detail: string }[]>()
    .default([]),
  alertesCreees: integer("alertes_creees").notNull().default(0),
  propositionsCreees: integer("propositions_creees").notNull().default(0),
  correctionsAppliquees: integer("corrections_appliquees").notNull().default(0),
  echecs: integer("echecs").notNull().default(0),
});
