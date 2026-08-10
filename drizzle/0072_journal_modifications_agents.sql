-- Point 42 : journal des modifications d'agents.
-- Table neuve, aucune table existante modifiée.
CREATE TABLE IF NOT EXISTS "agent_change_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "agent" varchar(96) NOT NULL,
  "kind" varchar(24) NOT NULL,
  "reference" varchar(200) NOT NULL,
  "title" varchar(240) NOT NULL,
  "detail" text,
  "engine_name" varchar(64),
  "status" varchar(16) DEFAULT 'declaree' NOT NULL,
  "rollback_plan" text,
  "applied_in_db" integer DEFAULT 0 NOT NULL,
  "applied_at" timestamp,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "review_note" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "agent_change_log_reference_unique" UNIQUE("kind", "reference")
);

CREATE INDEX IF NOT EXISTS "agent_change_log_kind_idx" ON "agent_change_log" ("kind", "status");
CREATE INDEX IF NOT EXISTS "agent_change_log_created_idx" ON "agent_change_log" ("created_at" DESC);
