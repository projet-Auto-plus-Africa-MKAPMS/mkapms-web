-- Points 108-113 — Continuous Test Engine : campagnes de contrôle et résultats datés.
CREATE TABLE IF NOT EXISTS "ct_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "finished_at" timestamp,
  "trigger" varchar(24) DEFAULT 'auto' NOT NULL,
  "requested_by" integer,
  "portee" varchar(64) DEFAULT 'complet' NOT NULL,
  "total" integer DEFAULT 0 NOT NULL,
  "reussis" integer DEFAULT 0 NOT NULL,
  "echecs" integer DEFAULT 0 NOT NULL,
  "ignores" integer DEFAULT 0 NOT NULL,
  "regressions" integer DEFAULT 0 NOT NULL,
  "duree_ms" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "ct_results" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "run_id" integer NOT NULL,
  "scenario" varchar(96) NOT NULL,
  "domaine" varchar(64) NOT NULL,
  "label" varchar(200) NOT NULL,
  "criticite" varchar(16) DEFAULT 'normale' NOT NULL,
  "statut" varchar(12) NOT NULL,
  "observe" text DEFAULT '' NOT NULL,
  "attendu" text DEFAULT '' NOT NULL,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "regression" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ct_results_run_idx" ON "ct_results" ("run_id");
CREATE INDEX IF NOT EXISTS "ct_results_scenario_idx" ON "ct_results" ("scenario");
CREATE INDEX IF NOT EXISTS "ct_results_created_idx" ON "ct_results" ("created_at");
