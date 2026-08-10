-- Point 45 — Assurance auto & bornes de recharge.
-- Aucune table existante modifiée : `user_assurances` (contrat déjà souscrit
-- ailleurs) reste intacte, ces tables couvrent la mise en relation et
-- l'annuaire des bornes.

CREATE TABLE IF NOT EXISTS "insurance_partners" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "formulas" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "usages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "contact_email" varchar(255),
  "contact_phone" varchar(32),
  "status" varchar(16) DEFAULT 'actif' NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "insurance_partners_zone_idx"
  ON "insurance_partners" ("country_code", "status");

CREATE TABLE IF NOT EXISTS "insurance_quote_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "user_id" integer,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "formula" varchar(24) NOT NULL,
  "usage" varchar(24) NOT NULL,
  "vehicle_brand" varchar(80),
  "vehicle_model" varchar(120),
  "vehicle_year" integer,
  "plate" varchar(24),
  "driver_license_year" integer,
  "claims_last_3_years" integer,
  "contact_name" varchar(160),
  "contact_email" varchar(255),
  "contact_phone" varchar(32),
  "message" text,
  "status" varchar(20) DEFAULT 'transmise' NOT NULL,
  "contacted_partners" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "offer_partner_id" integer,
  "offer_amount" numeric(12, 2),
  "offer_currency" varchar(8),
  "offer_valid_until" timestamp,
  "offer_note" text,
  "offer_by" integer,
  "offer_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "insurance_quote_requests_reference_unique" UNIQUE("reference")
);

CREATE INDEX IF NOT EXISTS "insurance_quote_requests_status_idx"
  ON "insurance_quote_requests" ("status", "country_code");

CREATE INDEX IF NOT EXISTS "insurance_quote_requests_user_idx"
  ON "insurance_quote_requests" ("user_id");

CREATE TABLE IF NOT EXISTS "charging_points" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(180) NOT NULL,
  "operator" varchar(160),
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120) NOT NULL,
  "postal_code" varchar(16),
  "address" varchar(255),
  "latitude" double precision,
  "longitude" double precision,
  "connectors" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "power_kw" integer,
  "outlets" integer,
  "access" varchar(24) DEFAULT 'public' NOT NULL,
  "pricing_note" varchar(200),
  "opening_hours" varchar(160),
  "source" varchar(24) DEFAULT 'declaration' NOT NULL,
  "declared_by" integer,
  "status" varchar(16) DEFAULT 'en_attente' NOT NULL,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "review_note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "charging_points_zone_idx"
  ON "charging_points" ("country_code", "city", "status");

CREATE INDEX IF NOT EXISTS "charging_points_status_idx"
  ON "charging_points" ("status");
