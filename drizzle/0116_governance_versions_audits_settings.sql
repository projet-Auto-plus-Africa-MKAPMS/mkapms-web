CREATE TABLE IF NOT EXISTS "gv_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" varchar(64) NOT NULL,
	"current_version" varchar(24) NOT NULL,
	"build_number" integer DEFAULT 0 NOT NULL,
	"release_reason" text DEFAULT '' NOT NULL,
	"affected_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"engine_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"api_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intelligence_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"database_migrations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compatibility_status" varchar(24) DEFAULT 'compatible' NOT NULL,
	"release_notes" text DEFAULT '' NOT NULL,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "gv_audits" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"type" varchar(24) DEFAULT 'semestriel' NOT NULL,
	"motif" text DEFAULT '' NOT NULL,
	"rapport_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "gv_settings_etat" (
	"id" serial PRIMARY KEY NOT NULL,
	"cle" varchar(80) NOT NULL UNIQUE,
	"etat" varchar(24) NOT NULL,
	"motif" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "gv_versions_app_idx" ON "gv_versions" ("app_id", "created_at");
