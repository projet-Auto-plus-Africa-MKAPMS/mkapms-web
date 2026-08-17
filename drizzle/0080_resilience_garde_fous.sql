-- Points 73-74-76-77-78 — Resilience & Safety Engine.
-- Migration additive : aucune table existante n'est modifiée ni supprimée.

CREATE TABLE IF NOT EXISTS "rs_emergency_scopes" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "scope" varchar(16) NOT NULL,
  "scope_key" varchar(40) NOT NULL UNIQUE,
  "level" varchar(16) DEFAULT 'ouvert' NOT NULL,
  "reason" text,
  "public_message" text,
  "activated_by" integer,
  "activated_at" timestamp,
  "released_by" integer,
  "released_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rs_emergency_events" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "scope" varchar(16) NOT NULL,
  "scope_key" varchar(40) NOT NULL,
  "from_level" varchar(16) NOT NULL,
  "to_level" varchar(16) NOT NULL,
  "reason" text,
  "actor_id" integer,
  "preserved" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rs_critical_requests" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "action_type" varchar(120) NOT NULL,
  "title" varchar(240) NOT NULL,
  "impact" text NOT NULL,
  "reversible" boolean DEFAULT false NOT NULL,
  "country_code" varchar(4),
  "params" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "challenge" varchar(120) NOT NULL,
  "status" varchar(16) DEFAULT 'attente' NOT NULL,
  "requested_by" integer,
  "confirmed_by" integer,
  "confirmed_at" timestamp,
  "consumed_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rs_pipeline_runs" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "origin" varchar(40) NOT NULL,
  "origin_ref" varchar(120),
  "title" varchar(240) NOT NULL,
  "risk_level" integer DEFAULT 1 NOT NULL,
  "steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" varchar(20) DEFAULT 'en_cours' NOT NULL,
  "blocked_reason" text,
  "rollback_plan" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rs_failure_lessons" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "signature" varchar(300) NOT NULL UNIQUE,
  "source" varchar(40) NOT NULL,
  "country_code" varchar(4),
  "problem" text NOT NULL,
  "cause" text,
  "solution" text,
  "result" text,
  "prevention" text,
  "occurrences" integer DEFAULT 1 NOT NULL,
  "reusable" boolean DEFAULT false NOT NULL,
  "validated_by" integer,
  "validated_at" timestamp,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rs_emergency_scopes_level_idx" ON "rs_emergency_scopes" ("level");
CREATE INDEX IF NOT EXISTS "rs_emergency_events_created_idx" ON "rs_emergency_events" ("created_at");
CREATE INDEX IF NOT EXISTS "rs_critical_requests_status_idx" ON "rs_critical_requests" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "rs_pipeline_runs_status_idx" ON "rs_pipeline_runs" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "rs_failure_lessons_seen_idx" ON "rs_failure_lessons" ("last_seen_at");
