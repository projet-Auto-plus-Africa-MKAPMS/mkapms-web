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
