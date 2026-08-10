CREATE TABLE IF NOT EXISTS "gbp_locations" (
  "id" serial PRIMARY KEY NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" integer NOT NULL,
  "nom" varchar(200) NOT NULL,
  "country_code" varchar(4),
  "ville" varchar(120),
  "place_id" varchar(128),
  "gbp_location_name" varchar(200),
  "gbp_url" text,
  "status" varchar(20) DEFAULT 'declare' NOT NULL,
  "declared_by" integer,
  "verified_by" integer,
  "verified_at" timestamp,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "gbp_locations_target_idx"
  ON "gbp_locations" ("target_type", "target_id");

CREATE TABLE IF NOT EXISTS "gbp_review_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "location_id" integer NOT NULL,
  "source" varchar(16) DEFAULT 'google' NOT NULL,
  "average_rating" numeric(3, 2),
  "review_count" integer DEFAULT 0 NOT NULL,
  "collection_mode" varchar(20) NOT NULL,
  "collected_by" integer,
  "collected_at" timestamp DEFAULT now() NOT NULL,
  "from_api" boolean DEFAULT false NOT NULL,
  "detail" text
);

CREATE INDEX IF NOT EXISTS "gbp_review_snapshots_location_idx"
  ON "gbp_review_snapshots" ("location_id", "collected_at");
