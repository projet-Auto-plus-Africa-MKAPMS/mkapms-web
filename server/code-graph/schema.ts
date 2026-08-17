/**
 * Points 116-117-118 — mémoire technique de la plateforme.
 *
 * Module additif et isolé (préfixe `cg_`). Il ne modifie aucune table
 * existante. Trois besoins distincts, trois familles de tables :
 *
 *  - 117 : le graphe lui-même (`cg_snapshots`, `cg_nodes`, `cg_edges`) — quel
 *    service touche quels fichiers, quelles API, quelles tables, quels
 *    événements, quelles permissions, quels tests ;
 *  - 116 : ce que l'agent code **observe** d'un relevé à l'autre
 *    (`cg_observations`) — apparition d'une table, d'une route, d'un moteur, ou
 *    disparition. C'est son apprentissage réel, pas une intention ;
 *  - 118 : ce qu'il **retient** des corrections des autres agents
 *    (`cg_lessons`) — problème, proposition, correctif, tests, validation,
 *    résultat. Si la même classe d'anomalie revient, elle est reconnue.
 */
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const cgSnapshots = pgTable("cg_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** Date de génération de l'artefact lu (et non date d'ingestion). */
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  commit: varchar("commit", { length: 40 }),
  fichiers: integer("fichiers").notNull().default(0),
  modules: integer("modules").notNull().default(0),
  moteurs: integer("moteurs").notNull().default(0),
  tables: integer("tables").notNull().default(0),
  api: integer("api").notNull().default(0),
  evenements: integer("evenements").notNull().default(0),
  tests: integer("tests").notNull().default(0),
  routes: integer("routes").notNull().default(0),
  aretes: integer("aretes").notNull().default(0),
  /** Conventions relevées : ce que l'agent doit imiter pour ne rien casser. */
  conventions: jsonb("conventions").$type<Record<string, number>>().notNull().default({}),
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
});

export const cgNodes = pgTable(
  "cg_nodes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    snapshotId: integer("snapshot_id").notNull(),
    /** `moteur` | `module` | `fichier` | `api` | `table` | `evenement` | `test` | `route` | `page` */
    type: varchar("type", { length: 16 }).notNull(),
    key: varchar("key", { length: 300 }).notNull(),
    label: varchar("label", { length: 300 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => ({
    parSnapshot: index("cg_nodes_snapshot_idx").on(t.snapshotId),
    parType: index("cg_nodes_type_idx").on(t.type),
    unicite: unique("cg_nodes_unique").on(t.snapshotId, t.key),
  }),
);

export const cgEdges = pgTable(
  "cg_edges",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    snapshotId: integer("snapshot_id").notNull(),
    source: varchar("source", { length: 300 }).notNull(),
    target: varchar("target", { length: 300 }).notNull(),
    /** `contient` | `declare` | `possede` | `migre` | `expose` | `implemente` | `utilise` | `prouve` | `depend` | `porte` | `rend` */
    kind: varchar("kind", { length: 16 }).notNull(),
  },
  (t) => ({
    parSnapshot: index("cg_edges_snapshot_idx").on(t.snapshotId),
    parSource: index("cg_edges_source_idx").on(t.source),
    parTarget: index("cg_edges_target_idx").on(t.target),
  }),
);

export const cgObservations = pgTable(
  "cg_observations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    snapshotId: integer("snapshot_id").notNull(),
    /** `apparition` | `disparition` | `convention` */
    kind: varchar("kind", { length: 16 }).notNull(),
    nodeType: varchar("node_type", { length: 16 }).notNull(),
    key: varchar("key", { length: 300 }).notNull(),
    /** Ce que l'agent a compris, écrit en clair pour être contredit si c'est faux. */
    comprehension: text("comprehension").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    parSnapshot: index("cg_observations_snapshot_idx").on(t.snapshotId),
    parCle: index("cg_observations_key_idx").on(t.key),
  }),
);

export const cgLessons = pgTable(
  "cg_lessons",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Classe d'anomalie : c'est elle qui permet de dire « je connais ça ». */
    classe: varchar("classe", { length: 120 }).notNull(),
    /** Origine réelle de la leçon : `agent_change` | `regression` | `alerte` | `pdg` */
    source: varchar("source", { length: 20 }).notNull(),
    sourceRef: varchar("source_ref", { length: 200 }),
    probleme: text("probleme").notNull(),
    proposition: text("proposition"),
    correctif: text("correctif"),
    tests: text("tests"),
    /** `validee` | `rejetee` | `en_attente` — la validation humaine reste un fait. */
    validation: varchar("validation", { length: 16 }).notNull().default("en_attente"),
    resultat: text("resultat"),
    moteurs: jsonb("moteurs").$type<string[]>().notNull().default([]),
    /** Nombre de fois que cette classe est revenue : l'expérience, comptée. */
    occurrences: integer("occurrences").notNull().default(1),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    unicite: unique("cg_lessons_classe_unique").on(t.classe, t.source, t.sourceRef),
    parClasse: index("cg_lessons_classe_idx").on(t.classe),
  }),
);
