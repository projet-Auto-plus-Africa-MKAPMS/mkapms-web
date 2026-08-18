/**
 * MKA.P-MS Intelligences — persistance propre au moteur.
 *
 * Deux côtés strictement séparés dans la même table par la colonne `cote` :
 *  - `direction` : le PDG. Contexte interne autorisé, commandes, code.
 *  - `public`    : les utilisateurs. Assistant automobile encadré, aucun accès
 *                  aux données internes.
 *
 * Rien ici ne duplique la mémoire du Système Intelligent ni le journal d'audit :
 * ces tables ne portent que les échanges Intelligences et leur consommation.
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

export const inSessions = pgTable("in_sessions", {
  id: serial("id").primaryKey(),
  cote: varchar("cote", { length: 16 }).notNull().default("public"),
  titre: varchar("titre", { length: 200 }).notNull().default(""),
  userId: integer("user_id"),
  /** Empreinte du visiteur non connecté, pour les quotas. Jamais l'IP en clair. */
  visiteur: varchar("visiteur", { length: 64 }),
  countryCode: varchar("country_code", { length: 8 }),
  langue: varchar("langue", { length: 8 }).notNull().default("fr"),
  messages: integer("messages").notNull().default(0),
  dernierAt: timestamp("dernier_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inMessages = pgTable("in_messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: integer("session_id").notNull(),
  cote: varchar("cote", { length: 16 }).notNull().default("public"),
  role: varchar("role", { length: 16 }).notNull(),
  contenu: text("contenu").notNull().default(""),
  /** Fournisseur et modèle réellement utilisés, ou null quand rien n'a répondu. */
  fournisseur: varchar("fournisseur", { length: 48 }),
  modele: varchar("modele", { length: 64 }),
  ok: boolean("ok").notNull().default(true),
  motif: text("motif").notNull().default(""),
  jetonsEntree: integer("jetons_entree").notNull().default(0),
  jetonsSortie: integer("jetons_sortie").notNull().default(0),
  dureeMs: integer("duree_ms").notNull().default(0),
  /** Éléments de contexte réellement injectés : traçabilité de ce qu'a vu le modèle. */
  contexte: jsonb("contexte").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Consommation par jour et par côté : le coût reste visible avant la facture. */
export const inUsage = pgTable("in_usage", {
  id: serial("id").primaryKey(),
  jour: varchar("jour", { length: 10 }).notNull(),
  cote: varchar("cote", { length: 16 }).notNull(),
  appels: integer("appels").notNull().default(0),
  echecs: integer("echecs").notNull().default(0),
  jetons: integer("jetons").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Commandes exécutées depuis Intelligences. La table ne réimplémente pas le
 * Centre de Commandes : elle enregistre le rattachement (dossier, passage de
 * pipeline) afin qu'aucune action ne parte sans trace côté Intelligences.
 */
export const inActions = pgTable("in_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  commande: varchar("commande", { length: 48 }).notNull(),
  argument: text("argument").notNull().default(""),
  resultat: varchar("resultat", { length: 16 }).notNull().default("propose"),
  detail: text("detail").notNull().default(""),
  devRequestId: integer("dev_request_id"),
  pipelineRunId: integer("pipeline_run_id"),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
