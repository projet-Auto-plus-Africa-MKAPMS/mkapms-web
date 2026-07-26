/**
 * MKA.P-MS Redirection Engine — Schema (tables isolées)
 *
 * Moteur central de redirection développé séparément de la plateforme
 * principale. Toutes les tables sont préfixées `redir_` pour éviter tout conflit.
 *
 * Nom visible : "Moteur de Redirection MKA.P-MS"
 * Nom technique : "MKA.P-MS Redirection Engine"
 *
 * Rôle : centraliser les redirections (boutons, services, routes) pour ne plus
 * les câbler en dur. On demande au moteur « où va la clé X ? » et il répond
 * selon les règles configurées par le PDG.
 */
import {
  bigserial,
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ── Règles de redirection ────────────────────────────────────────────────
// Une règle associe une "clé" (identifiant stable d'un bouton/service/route)
// à une destination (chemin interne ou URL externe).
export const redirRules = pgTable("redir_rules", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(), // ex: "bouton_devenir_pro", "service_garage"
  label: varchar("label", { length: 200 }).notNull(), // libellé lisible pour le PDG
  kind: varchar("kind", { length: 16 }).default("button"), // "button" | "service" | "route"
  target: varchar("target", { length: 512 }).notNull(), // "/abonnements" ou "https://…"
  external: boolean("external").default(false), // true = URL externe (nouvel onglet)
  active: boolean("active").default(true),
  priority: integer("priority").default(0),
  description: text("description"),
  hitCount: integer("hit_count").default(0),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Journal des résolutions ───────────────────────────────────────────────
// Chaque demande de résolution est journalisée (clé demandée, résultat).
export const redirLogs = pgTable("redir_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  key: varchar("key", { length: 128 }).notNull(),
  matched: boolean("matched").notNull(), // une règle active a-t-elle été trouvée ?
  resolvedTo: varchar("resolved_to", { length: 512 }),
  source: varchar("source", { length: 256 }), // page/contexte d'origine du clic
  outcome: varchar("outcome", { length: 24 }).default("resolved"), // resolved | navigated | unmatched | not_found | error
  durationMs: integer("duration_ms"), // durée du parcours (client → destination)
  error: text("error"), // message d'erreur éventuel
  userId: integer("user_id"),
  role: varchar("role", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow(),
});
