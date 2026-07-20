/**
 * MKA.P-MS Permission Engine — Schema (tables isolées)
 *
 * Module central d'autorisation développé séparément de la plateforme principale.
 * Toutes les tables sont préfixées `perm_` pour éviter tout conflit.
 *
 * Nom visible : "Moteur de Permissions MKA.P-MS"
 * Nom technique : "MKA.P-MS Permission Engine"
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

// ── Journal de sécurité (§7 du plan) ─────────────────────────────────────
// Chaque tentative d'accès sensible est enregistrée (autorisée ou refusée).
export const permSecurityLog = pgTable("perm_security_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id"),
  role: varchar("role", { length: 32 }),
  module: varchar("module", { length: 64 }),
  action: varchar("action", { length: 32 }),
  path: varchar("path", { length: 255 }),
  side: varchar("side", { length: 16 }).default("api"), // "api" | "ui"
  allowed: boolean("allowed").notNull(),
  reason: varchar("reason", { length: 128 }),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Accès temporaires (§6 du plan) ───────────────────────────────────────
// Le PDG peut accorder un accès temporaire à un employé/développeur.
export const permTemporaryGrants = pgTable("perm_temporary_grants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  module: varchar("module", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).default("voir"),
  readOnly: boolean("read_only").default(true),
  grantedBy: integer("granted_by").notNull(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  revoked: boolean("revoked").default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ────────────────────────────────────────────────────────────────────────
// Complétude fonctionnelle Permission OS (règle MOS #15) — migration 0036
// ────────────────────────────────────────────────────────────────────────

/** Politiques contextuelles (niveau 2 — permissions intelligentes). */
export const permPolicies = pgTable("perm_policies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  module: varchar("module", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  effect: varchar("effect", { length: 8 }).notNull(),
  priority: integer("priority").notNull().default(100),
  conditions: jsonb("conditions").notNull().default({}),
  active: boolean("active").notNull().default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

/** Délégations de droits (temporaires, entre identités). */
export const permDelegations = pgTable("perm_delegations", {
  id: serial("id").primaryKey(),
  fromIdentityId: integer("from_identity_id").notNull(),
  toIdentityId: integer("to_identity_id").notNull(),
  module: varchar("module", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).notNull().default("voir"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedReason: varchar("revoked_reason", { length: 64 }),
});

/** Journal de résolution (chaque décision : accord / refus + raison). */
export const permResolutionLog = pgTable("perm_resolution_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id"),
  userId: integer("user_id"),
  role: varchar("role", { length: 32 }),
  module: varchar("module", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).notNull().default("voir"),
  allowed: boolean("allowed").notNull(),
  reason: varchar("reason", { length: 48 }).notNull(),
  policyId: integer("policy_id"),
  context: jsonb("context"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Santé du moteur (règle MOS #11). */
export const permHealthLog = pgTable("perm_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
