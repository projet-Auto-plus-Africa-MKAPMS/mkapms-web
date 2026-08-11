-- Points 84-85-86-88 — MKA.P-MS AI FABRIC.
-- Migration strictement additive : aucune table existante n'est modifiée.
-- `af_providers.env_keys` ne contient QUE des noms de variables d'environnement,
-- jamais leur valeur : aucun secret n'entre en base.

CREATE TABLE IF NOT EXISTS "af_providers" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "code" varchar(48) NOT NULL UNIQUE,
  "label" varchar(120) NOT NULL,
  "capability" varchar(32) NOT NULL,
  "env_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" varchar(16) DEFAULT 'non_configure' NOT NULL,
  "data_residency" varchar(64),
  "confidentiality_max" varchar(16) DEFAULT 'publique' NOT NULL,
  "unit_cost_cents" integer,
  "unit_label" varchar(40),
  "switching_note" text,
  "last_used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "af_providers_capability_idx" ON "af_providers" ("capability", "status");

CREATE TABLE IF NOT EXISTS "af_routes" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "capability" varchar(32) NOT NULL,
  "task_type" varchar(64) NOT NULL,
  "engine" varchar(48),
  "country_code" varchar(4),
  "confidentiality" varchar(16) DEFAULT 'publique' NOT NULL,
  "verdict" varchar(24) NOT NULL,
  "provider_code" varchar(48),
  "reason" text NOT NULL,
  "candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "af_routes_created_idx" ON "af_routes" ("created_at");
CREATE INDEX IF NOT EXISTS "af_routes_verdict_idx" ON "af_routes" ("verdict");

CREATE TABLE IF NOT EXISTS "af_cost_entries" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "engine" varchar(48) NOT NULL,
  "task_type" varchar(64) NOT NULL,
  "provider_code" varchar(48),
  "capability" varchar(32) NOT NULL,
  "units" integer DEFAULT 1 NOT NULL,
  "unit_label" varchar(40),
  "cost_cents" integer DEFAULT 0 NOT NULL,
  "measured" boolean DEFAULT false NOT NULL,
  "manual_ops_avoided" integer,
  "country_code" varchar(4),
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "af_cost_engine_idx" ON "af_cost_entries" ("engine", "created_at");
CREATE INDEX IF NOT EXISTS "af_cost_created_idx" ON "af_cost_entries" ("created_at");

CREATE TABLE IF NOT EXISTS "af_memory_backups" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "snapshot_id" integer,
  "version" integer DEFAULT 1 NOT NULL,
  "scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "row_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "total_rows" integer DEFAULT 0 NOT NULL,
  "checksum" varchar(64) NOT NULL,
  "integrity" varchar(16) DEFAULT 'non_verifiee' NOT NULL,
  "verified_at" timestamp,
  "note" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "af_memory_version_idx" ON "af_memory_backups" ("version");
