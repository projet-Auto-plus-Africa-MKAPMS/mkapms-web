-- Points 64-65-66 — veille mondiale par pays + Country Policy Engine.
-- Migration additive : aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "ake_watch_runs" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "country_code" varchar(4) NOT NULL,
  "topic" varchar(40) NOT NULL,
  "status" varchar(28) NOT NULL,
  "authorized_sources" integer DEFAULT 0 NOT NULL,
  "findings" integer DEFAULT 0 NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ake_watch_runs_country_topic_idx"
  ON "ake_watch_runs" ("country_code", "topic");
CREATE INDEX IF NOT EXISTS "ake_watch_runs_created_idx"
  ON "ake_watch_runs" ("created_at");

CREATE TABLE IF NOT EXISTS "cpe_rules" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "country_code" varchar(4) NOT NULL,
  "domain" varchar(48) NOT NULL,
  "topic" varchar(120),
  "rule" text NOT NULL,
  "effect" varchar(16) NOT NULL,
  "conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "authority" varchar(160),
  "source_code" varchar(64),
  "source_ref" text,
  "verified" boolean DEFAULT false NOT NULL,
  "verified_by" integer,
  "verified_at" timestamp,
  "valid_from" timestamp,
  "valid_until" timestamp,
  "confidence" integer,
  "status" varchar(16) DEFAULT 'projet' NOT NULL,
  "signature" varchar(400) NOT NULL,
  "declared_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "cpe_rules_signature_unique" UNIQUE ("signature")
);

CREATE INDEX IF NOT EXISTS "cpe_rules_country_domain_idx"
  ON "cpe_rules" ("country_code", "domain");
CREATE INDEX IF NOT EXISTS "cpe_rules_status_idx"
  ON "cpe_rules" ("status", "verified");

CREATE TABLE IF NOT EXISTS "cpe_evaluations" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "action_type" varchar(120) NOT NULL,
  "domain" varchar(48),
  "country_code" varchar(4),
  "verdict" varchar(24) NOT NULL,
  "reason" text NOT NULL,
  "rule_id" integer,
  "actor_id" integer,
  "context" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cpe_evaluations_verdict_idx"
  ON "cpe_evaluations" ("verdict", "created_at");
CREATE INDEX IF NOT EXISTS "cpe_evaluations_country_idx"
  ON "cpe_evaluations" ("country_code");
