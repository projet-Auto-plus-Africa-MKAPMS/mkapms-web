-- Phase 53 — Scheduler OS : registre central des tâches planifiées
CREATE TABLE IF NOT EXISTS "scheduler_tasks" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "task_type" varchar(48) NOT NULL,
  "run_at" timestamp with time zone NOT NULL,
  "recurrence" varchar(16),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "user_id" integer,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "attempts" integer NOT NULL DEFAULT 0,
  "last_run_at" timestamp with time zone,
  "last_error" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "scheduler_tasks_due_idx"
ON "scheduler_tasks" ("status", "run_at");
