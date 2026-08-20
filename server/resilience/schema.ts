/**
 * Points 73-74-76-77-78 — Résilience & garde-fous de l'autonomie.
 *
 * Tables isolées (préfixe `rs_`) : aucune table métier existante n'est touchée.
 *
 *  • rs_emergency_scopes   — état d'ouverture au public, par portée (mondiale,
 *                            pays, univers). Fermer au public ne détruit rien.
 *  • rs_emergency_events   — journal de chaque ouverture / fermeture.
 *  • rs_critical_requests  — demandes d'actions de niveau 3 en attente d'une
 *                            confirmation renforcée du PDG.
 *  • rs_pipeline_runs      — passage obligatoire d'un changement avant la
 *                            production, étape par étape.
 *  • rs_failure_lessons    — erreur → cause → solution → résultat → prévention.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const rsEmergencyScopes = pgTable("rs_emergency_scopes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** "mondial" | "pays" | "univers" — une fermeture ciblée n'en entraîne aucune autre. */
  scope: varchar("scope", { length: 16 }).notNull(),
  /** Code pays ou code univers ; "*" pour la portée mondiale. */
  scopeKey: varchar("scope_key", { length: 40 }).notNull().unique(),
  /** "ouvert" | "maintenance" | "urgence" */
  level: varchar("level", { length: 16 }).notNull().default("ouvert"),
  reason: text("reason"),
  /** Message réellement affiché aux visiteurs. */
  publicMessage: text("public_message"),
  activatedBy: integer("activated_by"),
  activatedAt: timestamp("activated_at"),
  releasedBy: integer("released_by"),
  releasedAt: timestamp("released_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rsEmergencyEvents = pgTable("rs_emergency_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  scope: varchar("scope", { length: 16 }).notNull(),
  scopeKey: varchar("scope_key", { length: 40 }).notNull(),
  fromLevel: varchar("from_level", { length: 16 }).notNull(),
  toLevel: varchar("to_level", { length: 16 }).notNull(),
  reason: text("reason"),
  actorId: integer("actor_id"),
  /** Ce qui reste administrable pendant la fermeture, écrit au moment du basculement. */
  preserved: jsonb("preserved").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rsCriticalRequests = pgTable("rs_critical_requests", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actionType: varchar("action_type", { length: 120 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  /** Ce que l'action fera réellement, en clair, avant confirmation. */
  impact: text("impact").notNull(),
  reversible: boolean("reversible").notNull().default(false),
  countryCode: varchar("country_code", { length: 4 }),
  params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
  /** Phrase exacte que le PDG doit ressaisir : évite un clic réflexe. */
  challenge: varchar("challenge", { length: 120 }).notNull(),
  /** "attente" | "confirme" | "refuse" | "expire" | "consomme" */
  status: varchar("status", { length: 16 }).notNull().default("attente"),
  requestedBy: integer("requested_by"),
  confirmedBy: integer("confirmed_by"),
  confirmedAt: timestamp("confirmed_at"),
  consumedAt: timestamp("consumed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rsPipelineRuns = pgTable("rs_pipeline_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** Origine du changement : proposition Intelligence, agent externe, correctif automatique. */
  origin: varchar("origin", { length: 40 }).notNull(),
  originRef: varchar("origin_ref", { length: 120 }),
  title: varchar("title", { length: 240 }).notNull(),
  riskLevel: integer("risk_level").notNull().default(1),
  /** Étapes franchies, dans l'ordre, avec leur preuve. */
  steps: jsonb("steps")
    .$type<{ step: string; status: string; detail: string; at: string }[]>()
    .notNull()
    .default([]),
  /** "en_cours" | "bloque" | "pret_production" | "en_production" | "annule" */
  status: varchar("status", { length: 20 }).notNull().default("en_cours"),
  blockedReason: text("blocked_reason"),
  rollbackPlan: text("rollback_plan"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rsFailureLessons = pgTable("rs_failure_lessons", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** Signature stable de l'anomalie : c'est elle qui évite de repartir de zéro. */
  signature: varchar("signature", { length: 300 }).notNull().unique(),
  source: varchar("source", { length: 40 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }),
  problem: text("problem").notNull(),
  cause: text("cause"),
  solution: text("solution"),
  result: text("result"),
  prevention: text("prevention"),
  occurrences: integer("occurrences").notNull().default(1),
  /** Une leçon n'est réutilisable automatiquement qu'après validation humaine. */
  reusable: boolean("reusable").notNull().default(false),
  validatedBy: integer("validated_by"),
  validatedAt: timestamp("validated_at"),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
