/**
 * MKA.P-MS Engine Registry — Schema (tables isolées)
 *
 * Registre central des moteurs de la plateforme (Phase 1 — Fondations).
 * Toutes les tables sont préfixées `engine_` pour éviter tout conflit.
 *
 * Nom visible : "Registre des Moteurs MKA.P-MS"
 * Nom technique : "MKA.P-MS Engine Registry"
 *
 * Rôle : le Core Engine s'appuie sur ce registre pour connaître, pour chaque
 * moteur : son état, sa version, ses dépendances, sa santé, et pour router les
 * événements entre moteurs sans qu'aucun moteur n'écrive dans les tables d'un
 * autre. Module 100 % additif — ne modifie AUCUNE table existante.
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

// ── Registre des moteurs ──────────────────────────────────────────────────
// Une ligne par moteur (transversal, univers ou core). Le PDG voit l'ensemble.
export const engineRegistry = pgTable("engine_registry", {
  id: serial("id").primaryKey(),
  // Identifiant technique stable, unique. Ex: "smart", "payment", "vo".
  name: varchar("name", { length: 64 }).notNull().unique(),
  // Libellé lisible. Ex: "Smart Engine".
  label: varchar("label", { length: 160 }).notNull(),
  // "core" | "transversal" | "univers"
  category: varchar("category", { length: 24 }).notNull().default("univers"),
  // Version déclarée par le moteur. Ex: "1.0.0".
  version: varchar("version", { length: 32 }).notNull().default("0.0.0"),
  // "active" | "read_only" | "maintenance" | "disabled" | "staging"
  state: varchar("state", { length: 16 }).notNull().default("active"),
  // "ok" | "degraded" | "down" | "unknown" — dernier état de santé connu.
  health: varchar("health", { length: 16 }).notNull().default("unknown"),
  description: text("description"),
  // Noms des moteurs dont celui-ci dépend. Ex: ["core","permission"].
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
  lastHeartbeat: timestamp("last_heartbeat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Bus d'événements inter-moteurs ────────────────────────────────────────
// Un moteur publie un événement ; le Core Engine le route vers les moteurs
// abonnés. Aucun accès direct aux tables d'autrui : tout passe par ici.
export const engineEvents = pgTable("engine_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // Moteur émetteur. Ex: "sale-official".
  source: varchar("source", { length: 64 }).notNull(),
  // Type d'événement (clé stable). Ex: "sale.official.sold".
  type: varchar("type", { length: 128 }).notNull(),
  payload: jsonb("payload"),
  // Moteurs destinataires visés (informational). Ex: ["payment","comptabilite"].
  targets: jsonb("targets").$type<string[]>().default([]),
  // "pending" | "dispatched" | "failed"
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  dispatchedAt: timestamp("dispatched_at"),
});

// ── Journal de santé ──────────────────────────────────────────────────────
// Historique des heartbeats / métriques envoyés par chaque moteur.
export const engineHealthLog = pgTable("engine_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  engineName: varchar("engine_name", { length: 64 }).notNull(),
  // "ok" | "degraded" | "down"
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Journal des actions sensibles (activation, désactivation, retour arrière)
export const engineAdminLog = pgTable("engine_admin_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  engineName: varchar("engine_name", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(), // "set_state" | "register" | ...
  fromState: varchar("from_state", { length: 16 }),
  toState: varchar("to_state", { length: 16 }),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
