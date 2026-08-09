-- Payment Orchestrator (point 29) : prestataires configurables + journal des décisions.
CREATE TABLE IF NOT EXISTS "payment_providers" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(32) NOT NULL,
  "label" varchar(80) NOT NULL,
  "countries" jsonb DEFAULT '["*"]'::jsonb NOT NULL,
  "currencies" jsonb DEFAULT '["*"]'::jsonb NOT NULL,
  "methods" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "services" jsonb DEFAULT '["*"]'::jsonb NOT NULL,
  "priority" integer DEFAULT 100 NOT NULL,
  "integrated" boolean DEFAULT false NOT NULL,
  "config_env_key" varchar(64),
  "active" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "payment_providers_code_unique" UNIQUE("code")
);

CREATE TABLE IF NOT EXISTS "payment_routing_decisions" (
  "id" serial PRIMARY KEY NOT NULL,
  "country_code" varchar(4) NOT NULL,
  "currency" varchar(8) NOT NULL,
  "service" varchar(64),
  "method" varchar(24),
  "provider_code" varchar(32),
  "reason" varchar(200) NOT NULL,
  "rejected" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "user_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_providers_active_idx" ON "payment_providers" ("active","priority");
CREATE INDEX IF NOT EXISTS "payment_routing_decisions_country_idx" ON "payment_routing_decisions" ("country_code","created_at");
