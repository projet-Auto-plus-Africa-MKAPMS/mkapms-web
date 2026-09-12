/**
 * MKA.P-MS Gouvernance — persistance des règles permanentes adoptées à la
 * clôture du LOT IA02B : registre de versions par application, historique des
 * audits semestriels, registre des réglages plateforme.
 *
 * Trois tables, chacune source unique de vérité pour son sujet — aucune ne
 * duplique une table existante (`in_sessions`/`in_messages` restent la
 * conversation, `audit_logs`/`audit-os` restent le journal d'action).
 */
import { bigserial, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** Point 1 (règles permanentes) — une ligne par release réelle d'une application. */
export const gvVersions = pgTable("gv_versions", {
  id: serial("id").primaryKey(),
  appId: varchar("app_id", { length: 64 }).notNull(),
  currentVersion: varchar("current_version", { length: 24 }).notNull(),
  buildNumber: integer("build_number").notNull().default(0),
  releaseReason: text("release_reason").notNull().default(""),
  affectedModules: jsonb("affected_modules").$type<string[]>().notNull().default([]),
  engineChanges: jsonb("engine_changes").$type<string[]>().notNull().default([]),
  apiChanges: jsonb("api_changes").$type<string[]>().notNull().default([]),
  intelligenceChanges: jsonb("intelligence_changes").$type<string[]>().notNull().default([]),
  databaseMigrations: jsonb("database_migrations").$type<string[]>().notNull().default([]),
  compatibilityStatus: varchar("compatibility_status", { length: 24 }).notNull().default("compatible"),
  releaseNotes: text("release_notes").notNull().default(""),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Point 2 — historique des audits globaux (semestriels ou déclenchés en urgence). */
export const gvAudits = pgTable("gv_audits", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  type: varchar("type", { length: 24 }).notNull().default("semestriel"),
  motif: text("motif").notNull().default(""),
  rapportJson: jsonb("rapport_json").$type<Record<string, unknown>>().notNull().default({}),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 3 — état réellement constaté d'un réglage plateforme, pour le
 * distinguer d'une simple fiche : deux lignes par réglage (le catalogue
 * statique reste dans settings-registry.ts, cette table ne porte que la
 * réévaluation la plus récente, quand une lecture automatique existe).
 */
export const gvSettingsEtat = pgTable("gv_settings_etat", {
  id: serial("id").primaryKey(),
  cle: varchar("cle", { length: 80 }).notNull().unique(),
  etat: varchar("etat", { length: 24 }).notNull(),
  motif: text("motif").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
