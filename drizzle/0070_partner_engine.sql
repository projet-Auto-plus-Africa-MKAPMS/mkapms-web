-- Points 36-37 : Partner Engine (réseau partenaires + acquisition automatique).
-- La table historique `partners` n'est pas modifiée : ces tables la complètent.
CREATE TABLE IF NOT EXISTS "partner_applications" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "user_id" integer,
  "company_name" varchar(180) NOT NULL,
  "profession" varchar(48) NOT NULL,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "zone_radius_km" integer,
  "services" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "contact_name" varchar(160),
  "contact_email" varchar(255),
  "contact_phone" varchar(32),
  "message" text,
  "status" varchar(16) DEFAULT 'recue' NOT NULL,
  "opportunity_id" integer,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "review_note" text,
  "partner_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "partner_applications_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "partner_applications_status_idx" ON "partner_applications" ("status","country_code");
CREATE INDEX IF NOT EXISTS "partner_applications_zone_idx" ON "partner_applications" ("profession","country_code","city");

CREATE TABLE IF NOT EXISTS "partner_coverage" (
  "id" serial PRIMARY KEY NOT NULL,
  "partner_id" integer NOT NULL,
  "service" varchar(48) NOT NULL,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "radius_km" integer,
  "status" varchar(16) DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "partner_coverage_zone_idx" ON "partner_coverage" ("service","country_code","city","status");
CREATE INDEX IF NOT EXISTS "partner_coverage_partner_idx" ON "partner_coverage" ("partner_id");

CREATE TABLE IF NOT EXISTS "partner_contracts" (
  "id" serial PRIMARY KEY NOT NULL,
  "partner_id" integer NOT NULL,
  "reference" varchar(24) NOT NULL,
  "kind" varchar(32) DEFAULT 'prestataire' NOT NULL,
  "commission_rate" numeric(5, 2),
  "currency" varchar(8) DEFAULT 'EUR' NOT NULL,
  "starts_at" timestamp,
  "ends_at" timestamp,
  "status" varchar(16) DEFAULT 'brouillon' NOT NULL,
  "signed_by" integer,
  "signed_at" timestamp,
  "terms" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "partner_contracts_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "partner_contracts_partner_idx" ON "partner_contracts" ("partner_id","status");

CREATE TABLE IF NOT EXISTS "partner_leads" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "partner_id" integer,
  "service" varchar(48) NOT NULL,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "source" varchar(32) DEFAULT 'recherche' NOT NULL,
  "status" varchar(16) DEFAULT 'nouveau' NOT NULL,
  "user_id" integer,
  "amount" numeric(14, 2),
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "partner_leads_partner_idx" ON "partner_leads" ("partner_id","status");
CREATE INDEX IF NOT EXISTS "partner_leads_zone_idx" ON "partner_leads" ("service","country_code","city");

CREATE TABLE IF NOT EXISTS "partner_opportunities" (
  "id" serial PRIMARY KEY NOT NULL,
  "service" varchar(48) NOT NULL,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "demand_signals" integer DEFAULT 0 NOT NULL,
  "demand_without_results" integer DEFAULT 0 NOT NULL,
  "partners_available" integer DEFAULT 0 NOT NULL,
  "priority" varchar(16) DEFAULT 'a_surveiller' NOT NULL,
  "status" varchar(16) DEFAULT 'ouverte' NOT NULL,
  "actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "period_days" integer DEFAULT 30 NOT NULL,
  "detected_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "partner_opportunities_zone_idx" ON "partner_opportunities" ("service","country_code","city");
CREATE INDEX IF NOT EXISTS "partner_opportunities_status_idx" ON "partner_opportunities" ("status","priority");
