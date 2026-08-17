-- Points 104-107 — Event Bus central : abonnements, remises, passes de distribution.
CREATE TABLE IF NOT EXISTS "eb_subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "engine" varchar(64) NOT NULL,
  "event_type" varchar(128) NOT NULL,
  "handler" varchar(64) NOT NULL,
  "effet" text DEFAULT '' NOT NULL,
  "actif" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "eb_subscriptions_unique" UNIQUE("engine","event_type")
);

CREATE TABLE IF NOT EXISTS "eb_deliveries" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "event_id" integer NOT NULL,
  "event_type" varchar(128) NOT NULL,
  "engine" varchar(64) NOT NULL,
  "handler" varchar(64) NOT NULL,
  "statut" varchar(16) DEFAULT 'remise' NOT NULL,
  "tentatives" integer DEFAULT 1 NOT NULL,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "detail" text DEFAULT '' NOT NULL,
  "erreur" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "eb_dispatch_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "finished_at" timestamp,
  "trigger" varchar(24) DEFAULT 'auto' NOT NULL,
  "requested_by" integer,
  "evenements" integer DEFAULT 0 NOT NULL,
  "remises" integer DEFAULT 0 NOT NULL,
  "echecs" integer DEFAULT 0 NOT NULL,
  "orphelins" integer DEFAULT 0 NOT NULL,
  "detail" jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS "eb_deliveries_event_idx" ON "eb_deliveries" ("event_id");
CREATE INDEX IF NOT EXISTS "eb_deliveries_engine_idx" ON "eb_deliveries" ("engine");
CREATE INDEX IF NOT EXISTS "eb_deliveries_created_idx" ON "eb_deliveries" ("created_at");
