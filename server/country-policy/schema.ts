/**
 * MKA.P-MS COUNTRY POLICY ENGINE (point 66) — tables isolées, préfixées `cpe_`.
 *
 * Ce moteur est une **limite**, pas une fonctionnalité de confort : avant toute
 * action dépendant d'une réglementation, il répond autorise / bloque /
 * validation requise. Son défaut de conception volontaire est l'absence de
 * valeur par défaut permissive : quand la règle du pays n'est pas confirmée, la
 * réponse est « VALIDATION REQUISE — RÈGLE PAYS NON CONFIRMÉE », jamais « oui ».
 *
 * Point 65 : une règle appartient à un pays et à une période de validité. Une
 * règle française n'a aucune portée ailleurs — il n'existe aucun mécanisme
 * d'héritage entre pays dans ce schéma, et c'est intentionnel.
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

export const cpeRules = pgTable("cpe_rules", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  /** Domaine réglementé, ex. `tva`, `donnees_personnelles`, `vente_vehicule`. */
  domain: varchar("domain", { length: 48 }).notNull(),
  /** Sujet précis à l'intérieur du domaine, quand il y en a un. */
  topic: varchar("topic", { length: 120 }),
  rule: text("rule").notNull(),
  /** "autorise" | "interdit" | "conditionne" */
  effect: varchar("effect", { length: 16 }).notNull(),
  /** Conditions à remplir quand `effect = conditionne`. */
  conditions: jsonb("conditions").$type<Record<string, unknown>>().notNull().default({}),
  /** Autorité dont la règle émane (ministère, régulateur, texte de loi). */
  authority: varchar("authority", { length: 160 }),
  sourceCode: varchar("source_code", { length: 64 }),
  sourceRef: text("source_ref"),
  /**
   * Une règle n'est opposable que confirmée par un humain identifié. Tant que
   * `verified` est faux, elle n'autorise rien.
   */
  verified: boolean("verified").notNull().default(false),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  /** Fiabilité déclarée (0-100), null tant qu'elle n'est pas évaluée. */
  confidence: integer("confidence"),
  /** "projet" | "confirmee" | "obsolete" */
  status: varchar("status", { length: 16 }).notNull().default("projet"),
  signature: varchar("signature", { length: 400 }).notNull().unique(),
  declaredBy: integer("declared_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Journal des évaluations. Sans lui, un blocage réglementaire serait invisible :
 * on saurait que l'action ne s'est pas faite, pas pourquoi.
 */
export const cpeEvaluations = pgTable("cpe_evaluations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actionType: varchar("action_type", { length: 120 }).notNull(),
  domain: varchar("domain", { length: 48 }),
  countryCode: varchar("country_code", { length: 4 }),
  /** "autorise" | "bloque" | "validation_requise" | "hors_perimetre" */
  verdict: varchar("verdict", { length: 24 }).notNull(),
  reason: text("reason").notNull(),
  ruleId: integer("rule_id"),
  actorId: integer("actor_id"),
  context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
