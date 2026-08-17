/**
 * Points 108-113 — Continuous Test Engine : tables des campagnes et des
 * résultats. Une preuve de test n'a de valeur que si elle est datée, rattachée
 * à un scénario nommé et conservée : sinon « testé » n'est qu'une affirmation.
 */
import {
  bigserial,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const ctRuns = pgTable("ct_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  trigger: varchar("trigger", { length: 24 }).notNull().default("auto"),
  requestedBy: integer("requested_by"),
  /** Portée : "complet" ou nom d'un moteur. */
  portee: varchar("portee", { length: 64 }).notNull().default("complet"),
  total: integer("total").notNull().default(0),
  reussis: integer("reussis").notNull().default(0),
  echecs: integer("echecs").notNull().default(0),
  /** Scénarios non exécutables faute de prérequis : ni réussis, ni en échec. */
  ignores: integer("ignores").notNull().default(0),
  regressions: integer("regressions").notNull().default(0),
  dureeMs: integer("duree_ms").notNull().default(0),
});

export const ctResults = pgTable("ct_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  runId: integer("run_id").notNull(),
  scenario: varchar("scenario", { length: 96 }).notNull(),
  domaine: varchar("domaine", { length: 64 }).notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  criticite: varchar("criticite", { length: 16 }).notNull().default("normale"),
  /** "reussi" | "echec" | "ignore" */
  statut: varchar("statut", { length: 12 }).notNull(),
  /** Ce que le test a réellement observé — jamais « OK ». */
  observe: text("observe").notNull().default(""),
  attendu: text("attendu").notNull().default(""),
  dureeMs: integer("duree_ms").notNull().default(0),
  regression: jsonb("regression").$type<{ precedent: string; depuis: string } | null>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
