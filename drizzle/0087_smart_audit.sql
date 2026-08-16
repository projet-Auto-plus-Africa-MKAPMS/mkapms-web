-- Points 102-103 — audit et activation réelle du Système Intelligent.
CREATE TABLE IF NOT EXISTS "smart_audit_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "finished_at" timestamp,
  "trigger" varchar(24) DEFAULT 'manuel' NOT NULL,
  "requested_by" integer,
  "total" integer DEFAULT 0 NOT NULL,
  "par_etat" jsonb DEFAULT '{}'::jsonb,
  "autonomie" varchar(24) DEFAULT 'observation' NOT NULL,
  "autonomie_motif" text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "smart_audit_items" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "run_id" integer NOT NULL,
  "capacite" varchar(32) NOT NULL,
  "ordre" integer DEFAULT 0 NOT NULL,
  "label" varchar(160) NOT NULL,
  "etat" varchar(20) NOT NULL,
  "code_present" boolean DEFAULT false NOT NULL,
  "branche" boolean DEFAULT false NOT NULL,
  "usage_reel" boolean DEFAULT false NOT NULL,
  "lignes" integer DEFAULT 0 NOT NULL,
  "dernier_usage" timestamp,
  "autonomie" varchar(24) DEFAULT 'observation' NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "manquant" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "smart_cycle_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "finished_at" timestamp,
  "trigger" varchar(24) DEFAULT 'manuel' NOT NULL,
  "requested_by" integer,
  "etapes" jsonb DEFAULT '[]'::jsonb,
  "alertes_creees" integer DEFAULT 0 NOT NULL,
  "propositions_creees" integer DEFAULT 0 NOT NULL,
  "corrections_appliquees" integer DEFAULT 0 NOT NULL,
  "echecs" integer DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS "smart_audit_items_run_idx" ON "smart_audit_items" ("run_id");
CREATE INDEX IF NOT EXISTS "smart_audit_items_capacite_idx" ON "smart_audit_items" ("capacite");
