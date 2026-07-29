-- Phase 43 — Messagerie OS : couche sécurité/modération au-dessus des messages.
-- Signalements. Le blocage réutilise la table existante user_blocks.
CREATE TABLE IF NOT EXISTS "message_reports" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "message_id" integer,
  "thread_id" integer,
  "reporter_id" integer NOT NULL,
  "reported_id" integer,
  "reason" varchar(64) NOT NULL,
  "detail" varchar(500),
  "status" varchar(16) NOT NULL DEFAULT 'ouvert',
  "resolved_by" integer,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "message_reports_status_idx" ON "message_reports" ("status");
CREATE INDEX IF NOT EXISTS "message_reports_thread_idx" ON "message_reports" ("thread_id");
