-- LOT 2 du Plan Maître Fournisseurs (véhicules uniquement) : Vehicle Supplier
-- Engine, Stock/Availability, Territory, Pricing, Duplicate, Condition, Data
-- Quality, Publication. `supplier_profile_id` référence `supplier_profiles.id`
-- (LOT 1) en lecture seule, sans contrainte FK dure (moteur indépendant).
CREATE TABLE IF NOT EXISTS "vehicle_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "supplier_vehicle_id" varchar(128) NOT NULL,
  "ingest_method" varchar(32) NOT NULL,
  "vin" varchar(17),
  "plaque" varchar(16),
  "status" varchar(24) DEFAULT 'IMPORTED' NOT NULL,
  "status_reason" text,
  "raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "normalized_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "enriched_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "ai_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "validated_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "mapping_version" integer,
  "annonce_id" integer,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "vehicle_items_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "vehicle_items_supplier_idx" ON "vehicle_items" ("supplier_profile_id","supplier_vehicle_id");
CREATE INDEX IF NOT EXISTS "vehicle_items_status_idx" ON "vehicle_items" ("status");
CREATE INDEX IF NOT EXISTS "vehicle_items_vin_idx" ON "vehicle_items" ("vin");
CREATE INDEX IF NOT EXISTS "vehicle_items_plaque_idx" ON "vehicle_items" ("plaque");
CREATE INDEX IF NOT EXISTS "vehicle_items_annonce_idx" ON "vehicle_items" ("annonce_id");

CREATE TABLE IF NOT EXISTS "vehicle_territories" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "allowed_sale_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "excluded_sale_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "export_allowed" boolean DEFAULT false NOT NULL,
  "eu_export_allowed" boolean DEFAULT false NOT NULL,
  "worldwide_export_allowed" boolean DEFAULT false NOT NULL,
  "pickup_city" varchar(120),
  "pickup_country_code" varchar(4),
  "vehicle_ready_delay" integer,
  "documents_ready_for_export" boolean DEFAULT false NOT NULL,
  "transport_eligible" boolean DEFAULT false NOT NULL,
  "transport_modes_allowed" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_by" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "vehicle_territories_vehicle_item_id_unique" UNIQUE("vehicle_item_id")
);
CREATE INDEX IF NOT EXISTS "vehicle_territories_vehicle_idx" ON "vehicle_territories" ("vehicle_item_id");

CREATE TABLE IF NOT EXISTS "vehicle_availability" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "status" varchar(16) DEFAULT 'available' NOT NULL,
  "reserved_by" integer,
  "reserved_at" timestamp,
  "reserved_until" timestamp,
  "booking_id" integer,
  "sold_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "vehicle_availability_vehicle_item_id_unique" UNIQUE("vehicle_item_id")
);
CREATE INDEX IF NOT EXISTS "vehicle_availability_vehicle_idx" ON "vehicle_availability" ("vehicle_item_id");
CREATE INDEX IF NOT EXISTS "vehicle_availability_status_idx" ON "vehicle_availability" ("status");

CREATE TABLE IF NOT EXISTS "vehicle_pricing" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "supplier_price" numeric(12,2) NOT NULL,
  "supplier_currency" varchar(8) NOT NULL,
  "commission_rate_pct" numeric(6,3) DEFAULT '0' NOT NULL,
  "public_price" numeric(12,2),
  "public_currency" varchar(8),
  "min_price_contractual" numeric(12,2),
  "computed_at" timestamp,
  "computed_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "vehicle_pricing_vehicle_item_id_unique" UNIQUE("vehicle_item_id")
);
CREATE INDEX IF NOT EXISTS "vehicle_pricing_vehicle_idx" ON "vehicle_pricing" ("vehicle_item_id");

CREATE TABLE IF NOT EXISTS "vehicle_duplicates" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "matched_vehicle_item_id" integer NOT NULL,
  "match_type" varchar(24) NOT NULL,
  "confidence_pct" numeric(5,2) NOT NULL,
  "status" varchar(16) DEFAULT 'a_verifier' NOT NULL,
  "decided_by" integer,
  "decided_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vehicle_duplicates_vehicle_idx" ON "vehicle_duplicates" ("vehicle_item_id","status");

CREATE TABLE IF NOT EXISTS "vehicle_condition_reports" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "stage" varchar(24) NOT NULL,
  "reported_by" integer,
  "kilometrage" integer,
  "notes" text,
  "photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "videos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vehicle_condition_reports_vehicle_idx" ON "vehicle_condition_reports" ("vehicle_item_id","stage");

CREATE TABLE IF NOT EXISTS "vehicle_quality_checks" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "check_type" varchar(48) NOT NULL,
  "result" varchar(16) NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vehicle_quality_checks_vehicle_idx" ON "vehicle_quality_checks" ("vehicle_item_id");

CREATE TABLE IF NOT EXISTS "vehicle_publication_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "from_status" varchar(24),
  "to_status" varchar(24) NOT NULL,
  "reason" text,
  "actor_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vehicle_publication_log_vehicle_idx" ON "vehicle_publication_log" ("vehicle_item_id","created_at");

CREATE TABLE IF NOT EXISTS "vehicle_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vehicle_audit_log_vehicle_idx" ON "vehicle_audit_log" ("vehicle_item_id","created_at");

CREATE TABLE IF NOT EXISTS "vehicle_health_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
