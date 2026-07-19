-- Engine Registry — Registre central des moteurs (Phase 1 — Fondations)
-- Le Core Engine s'appuie sur ce registre pour connaître l'état, la version,
-- les dépendances et la santé de chaque moteur, et pour tracer les événements
-- inter-moteurs. Tables isolées préfixées engine_. Aucune table existante
-- n'est modifiée. Migration idempotente.

CREATE TABLE IF NOT EXISTS "engine_registry" (
  "id" serial PRIMARY KEY,
  "name" varchar(64) NOT NULL UNIQUE,
  "label" varchar(160) NOT NULL,
  "category" varchar(24) NOT NULL DEFAULT 'univers',
  "version" varchar(32) NOT NULL DEFAULT '0.0.0',
  "state" varchar(16) NOT NULL DEFAULT 'active',
  "health" varchar(16) NOT NULL DEFAULT 'unknown',
  "description" text,
  "dependencies" jsonb DEFAULT '[]'::jsonb,
  "last_heartbeat" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "engine_events" (
  "id" bigserial PRIMARY KEY,
  "source" varchar(64) NOT NULL,
  "type" varchar(128) NOT NULL,
  "payload" jsonb,
  "targets" jsonb DEFAULT '[]'::jsonb,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "error" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "dispatched_at" timestamp
);

CREATE TABLE IF NOT EXISTS "engine_health_log" (
  "id" bigserial PRIMARY KEY,
  "engine_name" varchar(64) NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "engine_admin_log" (
  "id" bigserial PRIMARY KEY,
  "engine_name" varchar(64) NOT NULL,
  "action" varchar(32) NOT NULL,
  "from_state" varchar(16),
  "to_state" varchar(16),
  "user_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "engine_events_created_idx" ON "engine_events" ("created_at");
CREATE INDEX IF NOT EXISTS "engine_events_status_idx" ON "engine_events" ("status");
CREATE INDEX IF NOT EXISTS "engine_health_name_idx" ON "engine_health_log" ("engine_name");
CREATE INDEX IF NOT EXISTS "engine_admin_name_idx" ON "engine_admin_log" ("engine_name");
