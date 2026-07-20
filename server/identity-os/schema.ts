/**
 * Identity OS — Schema (Sprint 1)
 *
 * Tables isolées préfixées `identity_` pour respecter la doctrine MOS :
 *   • aucune modification des tables existantes (notamment `users`).
 *   • module 100 % additif, activable/désactivable sans casser l'existant.
 *   • collaboration avec `users` via `legacy_user_id` (référence molle).
 *
 * Rôle : moteur d'identité universel (Visitor → AI Agent) avec audit complet,
 * sessions multi-device, journal de sécurité, et santé (Health Status).
 *
 * Toutes les migrations associées sont idempotentes (voir `drizzle/0034_identity_os.sql`).
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

// ── Table principale : identités MKA.P-MS ────────────────────────────────
// Une ligne par identité. Une identité peut être humaine ou machine (ai_agent).
// Le champ `type` reflète les 9 types de la doctrine (voir contract.ts).
export const identities = pgTable("identity_identities", {
  id: serial("id").primaryKey(),
  // Référence molle vers la table legacy `users` (le temps de la migration
  // progressive). Peut être nul pour les identités purement IA / partner.
  legacyUserId: integer("legacy_user_id"),
  // Type d'identité — 9 valeurs (visitor, user, pro, partner, franchisee,
  // universe_operator, employee, admin, ai_agent). Stocké en varchar pour
  // faciliter l'ajout de nouveaux types sans migration d'enum.
  type: varchar("type", { length: 32 }).notNull(),
  // Rôles cumulables (buyer, seller, mechanic, ai_agent_seo, etc.).
  roles: jsonb("roles").$type<string[]>().notNull().default([]),
  email: varchar("email", { length: 255 }),
  displayName: varchar("display_name", { length: 160 }),
  // Sécurité — password hash bcrypt (cost ≥ 12). Nul pour visitors / ai_agent.
  passwordHash: varchar("password_hash", { length: 255 }),
  // Contexte transversal (résolu par Country/Language OS quand ils existeront).
  countryCode: varchar("country_code", { length: 4 }),
  languageCode: varchar("language_code", { length: 8 }),
  // Statut : active, suspended, archived (jamais supprimé — doctrine MOS #8).
  status: varchar("status", { length: 16 }).notNull().default("active"),
  // Vérifications
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  // Multi-facteur (Sprint 2 — colonne prévue mais non exploitée)
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  // Métadonnées additives libres (ex: parrainage, canal d'inscription).
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

// ── Sessions actives — multi-device ─────────────────────────────────────
// Une ligne par session ouverte. Révocable individuellement.
export const identitySessions = pgTable("identity_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id").notNull(),
  // Identifiant opaque de session (rotation à chaque login).
  sessionToken: varchar("session_token", { length: 128 }).notNull().unique(),
  // Device / user-agent condensés (jamais l'UA brut si trop long).
  deviceId: varchar("device_id", { length: 128 }),
  userAgent: varchar("user_agent", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedReason: varchar("revoked_reason", { length: 32 }),
});

// ── Journal d'audit — traçabilité complète (doctrine #7) ────────────────
// Toute action structurante sur une identité est loguée : qui, quand, quoi,
// depuis où, pourquoi (motif libre). Zéro suppression, uniquement des ajouts.
export const identityAuditLog = pgTable("identity_audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id"),
  // Acteur ayant déclenché l'action (peut être différent de l'identité cible,
  // ex: un admin qui suspend un compte).
  actorIdentityId: integer("actor_identity_id"),
  action: varchar("action", { length: 64 }).notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Journal de santé Identity OS ────────────────────────────────────────
// Sert d'endpoint Health Status normalisé (règle MOS #11).
export const identityHealthLog = pgTable("identity_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(), // ok | degraded | down
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ────────────────────────────────────────────────────────────────────────
// Complétude fonctionnelle Identity OS (règle MOS #15) — migration 0035
// ────────────────────────────────────────────────────────────────────────

/** Vérifications email (double opt-in). */
export const identityEmailVerifications = pgTable("identity_email_verifications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  requestedIp: varchar("requested_ip", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Vérifications téléphone (OTP SMS 6 chiffres). */
export const identityPhoneVerifications = pgTable("identity_phone_verifications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  codeHash: varchar("code_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  requestedIp: varchar("requested_ip", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Réinitialisations mot de passe. */
export const identityPasswordResets = pgTable("identity_password_resets", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id").notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  requestedIp: varchar("requested_ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Secrets MFA TOTP (RFC 6238) + codes de secours (hashés). */
export const identityMfaSecrets = pgTable("identity_mfa_secrets", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identityId: integer("identity_id").notNull().unique(),
  secretBase32: varchar("secret_base32", { length: 64 }).notNull(),
  backupCodes: jsonb("backup_codes").$type<string[]>().notNull().default([]),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tentatives de connexion (détection d'anomalies + lockout). */
export const identityLoginAttempts = pgTable("identity_login_attempts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: varchar("email", { length: 255 }),
  identityId: integer("identity_id"),
  success: boolean("success").notNull(),
  reason: varchar("reason", { length: 64 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Comptes agents IA (clés d'API dédiées, hashées). */
export const identityAiAgents = pgTable("identity_ai_agents", {
  id: serial("id").primaryKey(),
  identityId: integer("identity_id").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  purpose: varchar("purpose", { length: 64 }).notNull(),
  apiKeyHash: varchar("api_key_hash", { length: 128 }).notNull().unique(),
  scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
