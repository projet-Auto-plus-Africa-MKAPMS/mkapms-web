-- Points 116-117-118 — Code Knowledge Graph, observations de l'agent code,
-- mémoire des anomalies apprises des autres agents.
CREATE TABLE IF NOT EXISTS "cg_snapshots" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "generated_at" timestamp with time zone NOT NULL,
  "commit" varchar(40),
  "fichiers" integer DEFAULT 0 NOT NULL,
  "modules" integer DEFAULT 0 NOT NULL,
  "moteurs" integer DEFAULT 0 NOT NULL,
  "tables" integer DEFAULT 0 NOT NULL,
  "api" integer DEFAULT 0 NOT NULL,
  "evenements" integer DEFAULT 0 NOT NULL,
  "tests" integer DEFAULT 0 NOT NULL,
  "routes" integer DEFAULT 0 NOT NULL,
  "aretes" integer DEFAULT 0 NOT NULL,
  "conventions" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "ingested_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cg_nodes" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "type" varchar(16) NOT NULL,
  "key" varchar(300) NOT NULL,
  "label" varchar(300) NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT "cg_nodes_unique" UNIQUE ("snapshot_id", "key")
);

CREATE INDEX IF NOT EXISTS "cg_nodes_snapshot_idx" ON "cg_nodes" ("snapshot_id");
CREATE INDEX IF NOT EXISTS "cg_nodes_type_idx" ON "cg_nodes" ("type");

CREATE TABLE IF NOT EXISTS "cg_edges" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "source" varchar(300) NOT NULL,
  "target" varchar(300) NOT NULL,
  "kind" varchar(16) NOT NULL
);

CREATE INDEX IF NOT EXISTS "cg_edges_snapshot_idx" ON "cg_edges" ("snapshot_id");
CREATE INDEX IF NOT EXISTS "cg_edges_source_idx" ON "cg_edges" ("source");
CREATE INDEX IF NOT EXISTS "cg_edges_target_idx" ON "cg_edges" ("target");

CREATE TABLE IF NOT EXISTS "cg_observations" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "kind" varchar(16) NOT NULL,
  "node_type" varchar(16) NOT NULL,
  "key" varchar(300) NOT NULL,
  "comprehension" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cg_observations_snapshot_idx" ON "cg_observations" ("snapshot_id");
CREATE INDEX IF NOT EXISTS "cg_observations_key_idx" ON "cg_observations" ("key");

CREATE TABLE IF NOT EXISTS "cg_lessons" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "classe" varchar(120) NOT NULL,
  "source" varchar(20) NOT NULL,
  "source_ref" varchar(200),
  "probleme" text NOT NULL,
  "proposition" text,
  "correctif" text,
  "tests" text,
  "validation" varchar(16) DEFAULT 'en_attente' NOT NULL,
  "resultat" text,
  "moteurs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "occurrences" integer DEFAULT 1 NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "cg_lessons_classe_unique" UNIQUE ("classe", "source", "source_ref")
);

CREATE INDEX IF NOT EXISTS "cg_lessons_classe_idx" ON "cg_lessons" ("classe");
