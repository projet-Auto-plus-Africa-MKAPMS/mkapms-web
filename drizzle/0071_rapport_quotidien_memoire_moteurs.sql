-- Points 39-40 : rapport quotidien archivé/livré et mémoire organisée des moteurs.
-- Aucune table existante n'est modifiée.

-- Point 39 — un rapport par jour, conservé et livré à la direction.
CREATE TABLE IF NOT EXISTS "smart_daily_reports" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "report_date" date NOT NULL,
  "generated_at" timestamp DEFAULT now() NOT NULL,
  "summary" jsonb NOT NULL,
  "anomalies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "delivery_status" varchar(16) DEFAULT 'en_attente' NOT NULL,
  "delivered_at" timestamp,
  "recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "delivery_error" text,
  CONSTRAINT "smart_daily_reports_date_unique" UNIQUE("report_date")
);

CREATE INDEX IF NOT EXISTS "smart_daily_reports_date_idx" ON "smart_daily_reports" ("report_date" DESC);

-- Point 40 — mémoire des moteurs, rangée par moteur puis par domaine.
CREATE TABLE IF NOT EXISTS "engine_memory" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "engine_key" varchar(64) NOT NULL,
  "scope" varchar(32) NOT NULL,
  "kind" varchar(48) NOT NULL,
  "ref_key" varchar(320) NOT NULL,
  "label" varchar(320),
  "value" jsonb,
  "observations" integer DEFAULT 1 NOT NULL,
  "first_seen_at" timestamp DEFAULT now() NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "engine_memory_unique" UNIQUE("engine_key", "scope", "kind", "ref_key")
);

CREATE INDEX IF NOT EXISTS "engine_memory_engine_idx" ON "engine_memory" ("engine_key", "scope");
CREATE INDEX IF NOT EXISTS "engine_memory_last_seen_idx" ON "engine_memory" ("last_seen_at" DESC);
