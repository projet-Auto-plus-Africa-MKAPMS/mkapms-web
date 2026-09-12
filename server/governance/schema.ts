/**
 * MKA.P-MS Gouvernance — persistance des règles permanentes adoptées à la
 * clôture du LOT IA02B : registre de versions par application, historique des
 * audits semestriels, registre des réglages plateforme.
 *
 * Trois tables, chacune source unique de vérité pour son sujet — aucune ne
 * duplique une table existante (`in_sessions`/`in_messages` restent la
 * conversation, `audit_logs`/`audit-os` restent le journal d'action).
 */
import { bigserial, boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

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

/**
 * LOT IA02D — Provider Registry / Dependency Registry, source centrale de
 * vérité pour les dépendances de modèles externes en vue de l'échéance du 27 mars
 * 2027. Ne remplace ni ne duplique ai-fabric (catalogue et état réel des
 * fournisseurs), capacites.ts (capacités et remplacement MKA.P-MS visé) ni
 * shadow.ts (preuves de montée en charge du remplacement interne) : ce
 * registre les RELIE et porte ce qu'aucun des trois ne portait encore —
 * calendrier de sortie, disconnect readiness, droits sur les données.
 */
export const gvDependencies = pgTable("gv_dependencies", {
  id: serial("id").primaryKey(),
  providerId: varchar("provider_id", { length: 48 }).notNull().unique(),
  internalName: varchar("internal_name", { length: 120 }).notNull(),
  category: varchar("category", { length: 32 }).notNull().default("ia_modele"),
  adapterId: varchar("adapter_id", { length: 160 }).notNull(),
  capabilitiesAvailable: jsonb("capabilities_available").$type<string[]>().notNull().default([]),
  capabilitiesUsed: jsonb("capabilities_used").$type<string[]>().notNull().default([]),
  authenticationType: varchar("authentication_type", { length: 40 }).notNull().default("api_key"),
  fallback: text("fallback").notNull().default(""),
  alternativeProvider: varchar("alternative_provider", { length: 48 }),
  /** Nature réelle de ce qui est envoyé au fournisseur — écrit, jamais déduit automatiquement. */
  dataDependency: text("data_dependency").notNull().default(""),
  internalReplacement: varchar("internal_replacement", { length: 160 }).notNull().default(""),
  internalReplacementStatus: varchar("internal_replacement_status", { length: 40 }).notNull().default("external_primary"),
  migrationPriority: varchar("migration_priority", { length: 16 }).notNull().default("moyenne"),
  targetDisconnectDate: timestamp("target_disconnect_date"),
  lastIndependenceTest: timestamp("last_independence_test"),
  lastIndependenceTestOk: boolean("last_independence_test_ok"),
  /** Inconnu tant qu'aucune revue juridique n'a eu lieu — jamais supposé favorable. */
  trainingRights: varchar("training_rights", { length: 24 }).notNull().default("LEGAL_RIGHTS_UNKNOWN"),
  redistributionRights: varchar("redistribution_rights", { length: 24 }).notNull().default("LEGAL_RIGHTS_UNKNOWN"),
  retentionPolicy: text("retention_policy").notNull().default(""),
  cachePolicy: text("cache_policy").notNull().default(""),
  countryConstraints: jsonb("country_constraints").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 32 }).notNull().default("REGISTERED"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
