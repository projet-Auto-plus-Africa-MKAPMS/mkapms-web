-- Points 71-72-75 — Centre de Commandes MKA.P-MS.
-- Migration additive : aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "cc_voice_sessions" (
  "id" bigserial PRIMARY KEY,
  "actor_id" integer NOT NULL,
  "strong_auth_method" varchar(40),
  "strong_auth_at" timestamp,
  "status" varchar(12) NOT NULL DEFAULT 'ouverte',
  "device" varchar(120),
  "commands_count" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp NOT NULL,
  "closed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_voice_sessions_actor_idx" ON "cc_voice_sessions" ("actor_id");
CREATE INDEX IF NOT EXISTS "cc_voice_sessions_status_idx" ON "cc_voice_sessions" ("status");

CREATE TABLE IF NOT EXISTS "cc_commands" (
  "id" bigserial PRIMARY KEY,
  "channel" varchar(12) NOT NULL DEFAULT 'ecrit',
  "raw_text" text NOT NULL,
  "language" varchar(8) NOT NULL DEFAULT 'fr',
  "intent" varchar(60),
  "action_type" varchar(120),
  "entities" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "country_code" varchar(4),
  "risk_level" integer NOT NULL DEFAULT 1,
  "verdict" varchar(20) NOT NULL,
  "reason" text NOT NULL,
  "action_task_id" integer,
  "voice_session_id" integer,
  "actor_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_commands_created_idx" ON "cc_commands" ("created_at");
CREATE INDEX IF NOT EXISTS "cc_commands_verdict_idx" ON "cc_commands" ("verdict");
CREATE INDEX IF NOT EXISTS "cc_commands_channel_idx" ON "cc_commands" ("channel");

CREATE TABLE IF NOT EXISTS "cc_dev_requests" (
  "id" bigserial PRIMARY KEY,
  "need" text NOT NULL,
  "scope" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "analysis" text,
  "plan" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "risk_level" integer NOT NULL DEFAULT 2,
  "country_code" varchar(4),
  "generation_available" boolean NOT NULL DEFAULT false,
  "status" varchar(16) NOT NULL DEFAULT 'analyse',
  "blocked_reason" text,
  "pipeline_run_id" integer,
  "requested_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_dev_requests_status_idx" ON "cc_dev_requests" ("status");
CREATE INDEX IF NOT EXISTS "cc_dev_requests_created_idx" ON "cc_dev_requests" ("created_at");
