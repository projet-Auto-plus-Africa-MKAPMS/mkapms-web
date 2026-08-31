-- Connecteur Google Business Profile — tables de rattachement et de relevés.
-- Sans ces CREATE TABLE, la sonde connecteur_google_business reste en état dégradé.

CREATE TABLE IF NOT EXISTS "gbp_locations" (
  "id" serial PRIMARY KEY,
  "target_type" varchar(32) NOT NULL,
  "target_id" integer NOT NULL,
  "nom" varchar(200) NOT NULL,
  "country_code" varchar(4),
  "ville" varchar(120),
  "place_id" varchar(128),
  "gbp_location_name" varchar(200),
  "gbp_url" text,
  "status" varchar(20) NOT NULL DEFAULT 'declare',
  "declared_by" integer,
  "verified_by" integer,
  "verified_at" timestamp,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gbp_review_snapshots" (
  "id" serial PRIMARY KEY,
  "location_id" integer NOT NULL,
  "source" varchar(16) NOT NULL DEFAULT 'google',
  "average_rating" numeric(3,2),
  "review_count" integer NOT NULL DEFAULT 0,
  "collection_mode" varchar(20) NOT NULL,
  "collected_by" integer,
  "collected_at" timestamp NOT NULL DEFAULT now(),
  "from_api" boolean NOT NULL DEFAULT false,
  "detail" text
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "gbp_locations_target_idx" ON "gbp_locations" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "gbp_locations_status_idx" ON "gbp_locations" ("status", "country_code");
CREATE INDEX IF NOT EXISTS "gbp_review_snapshots_location_idx" ON "gbp_review_snapshots" ("location_id", "collected_at");
