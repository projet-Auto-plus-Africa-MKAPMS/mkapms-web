/**
 * MKA.P-MS Activation Audit — Schéma (point 91).
 *
 * Tables isolées, préfixe `activation_`. Aucune table existante n'est touchée.
 *
 * Le registre des moteurs dit ce qui est *déclaré*. Cet audit dit ce qui est
 * réellement joignable, réellement utilisé et réellement prouvé par un test.
 * Les deux sont volontairement séparés : un moteur peut être « actif » au
 * registre et n'avoir aucune route, aucune donnée et aucun test.
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

/** Une exécution d'audit = une photographie datée de la plateforme. */
export const activationAuditRuns = pgTable("activation_audit_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  /** "manuel" | "demarrage" | "planifie" */
  trigger: varchar("trigger", { length: 24 }).notNull().default("manuel"),
  requestedBy: integer("requested_by"),
  total: integer("total").notNull().default(0),
  /** Décompte par état : { operationnelle: n, partielle: n, ... } */
  parEtat: jsonb("par_etat").$type<Record<string, number>>().default({}),
  /** Surfaces observées : moteurs, espaces tRPC, routes, tables. */
  couverture: jsonb("couverture").$type<Record<string, number>>().default({}),
});

/**
 * Une ligne par domaine audité. Les sept colonnes booléennes reprennent
 * exactement la chaîne demandée : existe → connecté → activé → accessible →
 * testé → utilisé réellement → moteur connecté → Système Intelligent connecté.
 */
export const activationAuditItems = pgTable("activation_audit_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  runId: integer("run_id").notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  category: varchar("category", { length: 32 }).notNull().default("inconnu"),

  existe: boolean("existe").notNull().default(false),
  connecte: boolean("connecte").notNull().default(false),
  active: boolean("active").notNull().default(false),
  accessible: boolean("accessible").notNull().default(false),
  teste: boolean("teste").notNull().default(false),
  utilise: boolean("utilise").notNull().default(false),
  moteurConnecte: boolean("moteur_connecte").notNull().default(false),
  systemeIntelligentConnecte: boolean("systeme_intelligent_connecte").notNull().default(false),

  /** "operationnelle" | "partielle" | "non_connectee" | "hors_service" | "non_configuree" */
  etat: varchar("etat", { length: 24 }).notNull(),
  /** Motif exact — jamais une appréciation, toujours un constat. */
  motif: text("motif").notNull().default(""),
  /** Preuves brutes ayant servi au calcul (procédures, routes, lignes, tests). */
  preuves: jsonb("preuves").$type<Record<string, unknown>>().default({}),
  /** Ce qui manque pour passer en 🟢. */
  manquant: jsonb("manquant").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Preuve de test rattachée à un domaine.
 *
 * Rien d'autre ne peut rendre un domaine « testé » : ni la présence du code,
 * ni un déploiement réussi. Le Continuous Test Engine (points 108-113) écrit
 * ici ; tant qu'il n'a rien écrit, le domaine reste 🟡 et l'audit le dit.
 */
export const activationTestEvidence = pgTable("activation_test_evidence", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  domain: varchar("domain", { length: 64 }).notNull(),
  /** "unitaire" | "integration" | "parcours" | "seo" | "paiement" | "manuel" */
  kind: varchar("kind", { length: 24 }).notNull().default("integration"),
  scenario: varchar("scenario", { length: 255 }).notNull(),
  passed: integer("passed").notNull().default(0),
  total: integer("total").notNull().default(0),
  success: boolean("success").notNull().default(false),
  detail: text("detail"),
  /** Qui a produit la preuve : "continuous-test-engine", "agent", "pdg"… */
  source: varchar("source", { length: 64 }).notNull().default("continuous-test-engine"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});
