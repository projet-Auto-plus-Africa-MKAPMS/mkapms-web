-- Points 69-70 — une validation du PDG produit une action traçable.
-- Chaque proposition validée devient une tâche qui possède un cycle de vie
-- complet, des étapes horodatées et, en cas d'échec, la raison exacte.
CREATE TABLE IF NOT EXISTS "smart_action_tasks" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "source" varchar(32) NOT NULL,
  "source_id" integer,
  "action_type" varchar(48) NOT NULL,
  "title" varchar(240) NOT NULL,
  "description" text,
  "params" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "risk_level" integer DEFAULT 1 NOT NULL,
  "country_code" varchar(4),
  "status" varchar(20) DEFAULT 'propose' NOT NULL,
  "failure_reason" text,
  "result" jsonb,
  "verified_at" timestamp,
  "requested_by" integer,
  "validated_by" integer,
  "validated_at" timestamp,
  "started_at" timestamp,
  "finished_at" timestamp,
  "signature" varchar(400) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "smart_action_tasks_signature_unique" UNIQUE ("signature")
);

CREATE INDEX IF NOT EXISTS "smart_action_tasks_status_idx"
  ON "smart_action_tasks" ("status", "updated_at");

CREATE INDEX IF NOT EXISTS "smart_action_tasks_source_idx"
  ON "smart_action_tasks" ("source", "source_id");

CREATE TABLE IF NOT EXISTS "smart_action_steps" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "task_id" integer NOT NULL,
  "step" varchar(32) NOT NULL,
  "status" varchar(16) NOT NULL,
  "detail" text,
  "evidence" jsonb,
  "actor_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "smart_action_steps_task_idx"
  ON "smart_action_steps" ("task_id", "created_at");

-- Points 67-68 — verdict d'analyse automatique après chaque dépôt d'agent.
-- Colonnes additives sur le journal existant : rien n'est retiré.
ALTER TABLE "agent_change_log" ADD COLUMN IF NOT EXISTS "impact_verdict" varchar(32);
ALTER TABLE "agent_change_log" ADD COLUMN IF NOT EXISTS "impact_findings" jsonb;
ALTER TABLE "agent_change_log" ADD COLUMN IF NOT EXISTS "impact_at" timestamp;

CREATE INDEX IF NOT EXISTS "agent_change_log_impact_idx"
  ON "agent_change_log" ("impact_verdict", "created_at");
