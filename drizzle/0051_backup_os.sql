-- Phase 50 — Backup & Recovery OS : registre des sauvegardes + demandes de restauration
CREATE TABLE IF NOT EXISTS "backup_snapshots" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "scope" jsonb NOT NULL,
  "row_counts" jsonb DEFAULT '{}'::jsonb,
  "total_rows" integer NOT NULL DEFAULT 0,
  "status" varchar(16) NOT NULL DEFAULT 'captured',
  "note" varchar(255),
  "created_by" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "backup_restore_requests" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "scope" jsonb NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "requested_by" integer,
  "decided_by" integer,
  "decided_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
