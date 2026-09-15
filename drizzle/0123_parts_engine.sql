-- LOT 3 du Plan Maître Fournisseurs (pièces automobiles uniquement) : Parts
-- Supplier Engine, identité canonique multi-fournisseurs, OEM/Cross-Reference
-- Engine, Parts Compatibility Engine, Pricing, Stock (ledger + réservations),
-- Territory, Data Quality, Publication. `supplier_profile_id` référence
-- `supplier_profiles.id` (LOT 1) en lecture seule, sans contrainte FK dure.
CREATE TABLE IF NOT EXISTS "parts_canonical" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "reference_oem" varchar(96),
  "marque_piece" varchar(128),
  "categorie" varchar(128),
  "sous_categorie" varchar(128),
  "nom_piece" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "parts_canonical_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "parts_canonical_oem_idx" ON "parts_canonical" ("reference_oem");

CREATE TABLE IF NOT EXISTS "parts_supplier_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "supplier_part_id" varchar(128) NOT NULL,
  "ingest_method" varchar(32) NOT NULL,
  "reference_oem" varchar(96),
  "ean" varchar(32),
  "status" varchar(24) DEFAULT 'IMPORTED' NOT NULL,
  "status_reason" text,
  "raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "normalized_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "enriched_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "ai_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "validated_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "mapping_version" integer,
  "canonical_part_id" integer,
  "canonical_match_status" varchar(24) DEFAULT 'non_evalue' NOT NULL,
  "catalog_id" integer,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "parts_supplier_items_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "parts_supplier_items_supplier_idx" ON "parts_supplier_items" ("supplier_profile_id","supplier_part_id");
CREATE INDEX IF NOT EXISTS "parts_supplier_items_status_idx" ON "parts_supplier_items" ("status");
CREATE INDEX IF NOT EXISTS "parts_supplier_items_oem_idx" ON "parts_supplier_items" ("reference_oem");
CREATE INDEX IF NOT EXISTS "parts_supplier_items_ean_idx" ON "parts_supplier_items" ("ean");
CREATE INDEX IF NOT EXISTS "parts_supplier_items_catalog_idx" ON "parts_supplier_items" ("catalog_id");

CREATE TABLE IF NOT EXISTS "parts_oem_cross_references" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "reference_oem" varchar(96) NOT NULL,
  "reference_alternative" varchar(96) NOT NULL,
  "marque_alternative" varchar(128),
  "source_type" varchar(24) NOT NULL,
  "source_ref" text,
  "confidence_pct" numeric(5,2) NOT NULL,
  "status" varchar(16) DEFAULT 'a_verifier' NOT NULL,
  "decided_by" integer,
  "decided_at" timestamp,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "parts_oem_cross_references_oem_idx" ON "parts_oem_cross_references" ("reference_oem","status");

CREATE TABLE IF NOT EXISTS "parts_compatibility_checks" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "marque" varchar(96) NOT NULL,
  "modele" varchar(128),
  "generation" varchar(64),
  "annee_debut" integer,
  "annee_fin" integer,
  "code_moteur" varchar(64),
  "code_boite" varchar(64),
  "carburant" varchar(32),
  "transmission" varchar(32),
  "match_level" varchar(32) DEFAULT 'UNKNOWN' NOT NULL,
  "source" text NOT NULL,
  "decided_by" integer,
  "decided_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "parts_compatibility_checks_item_idx" ON "parts_compatibility_checks" ("supplier_item_id","match_level");

CREATE TABLE IF NOT EXISTS "parts_pricing" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "supplier_price" numeric(12,2) NOT NULL,
  "supplier_currency" varchar(8) NOT NULL,
  "commission_rate_pct" numeric(6,3) DEFAULT '0' NOT NULL,
  "vat_rate_pct" numeric(5,2) DEFAULT '20' NOT NULL,
  "retail_price_ht" numeric(12,2),
  "retail_price_ttc" numeric(12,2),
  "retail_currency" varchar(8),
  "min_price_contractual" numeric(12,2),
  "computed_at" timestamp,
  "computed_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "parts_pricing_supplier_item_id_unique" UNIQUE("supplier_item_id")
);
CREATE INDEX IF NOT EXISTS "parts_pricing_item_idx" ON "parts_pricing" ("supplier_item_id");

CREATE TABLE IF NOT EXISTS "parts_stock_ledger" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "warehouse_id" integer,
  "country_code" varchar(4),
  "physical_quantity" integer DEFAULT 0 NOT NULL,
  "reserved_quantity" integer DEFAULT 0 NOT NULL,
  "incoming_quantity" integer DEFAULT 0 NOT NULL,
  "restock_date" timestamp,
  "stock_status" varchar(16) DEFAULT 'UNKNOWN' NOT NULL,
  "low_stock_threshold" integer DEFAULT 2 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "parts_stock_ledger_supplier_item_id_unique" UNIQUE("supplier_item_id")
);
CREATE INDEX IF NOT EXISTS "parts_stock_ledger_item_idx" ON "parts_stock_ledger" ("supplier_item_id");
CREATE INDEX IF NOT EXISTS "parts_stock_ledger_status_idx" ON "parts_stock_ledger" ("stock_status");

CREATE TABLE IF NOT EXISTS "parts_stock_reservations" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "order_ref" varchar(64),
  "status" varchar(16) DEFAULT 'active' NOT NULL,
  "reserved_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  "released_at" timestamp,
  "released_reason" text,
  "created_by" integer
);
CREATE INDEX IF NOT EXISTS "parts_stock_reservations_item_idx" ON "parts_stock_reservations" ("supplier_item_id","status");

CREATE TABLE IF NOT EXISTS "parts_territories" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "allowed_sale_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "excluded_sale_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "restricted_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "export_allowed" boolean DEFAULT false NOT NULL,
  "hazardous_material" boolean DEFAULT false NOT NULL,
  "fragile" boolean DEFAULT false NOT NULL,
  "oversized" boolean DEFAULT false NOT NULL,
  "transport_restrictions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "preparation_delay" integer,
  "updated_by" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "parts_territories_supplier_item_id_unique" UNIQUE("supplier_item_id")
);
CREATE INDEX IF NOT EXISTS "parts_territories_item_idx" ON "parts_territories" ("supplier_item_id");

CREATE TABLE IF NOT EXISTS "parts_quality_checks" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "check_type" varchar(48) NOT NULL,
  "result" varchar(16) NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "parts_quality_checks_item_idx" ON "parts_quality_checks" ("supplier_item_id");

CREATE TABLE IF NOT EXISTS "parts_publication_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer NOT NULL,
  "from_status" varchar(24),
  "to_status" varchar(24) NOT NULL,
  "reason" text,
  "actor_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "parts_publication_log_item_idx" ON "parts_publication_log" ("supplier_item_id","created_at");

CREATE TABLE IF NOT EXISTS "parts_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_item_id" integer,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "parts_audit_log_item_idx" ON "parts_audit_log" ("supplier_item_id","created_at");

CREATE TABLE IF NOT EXISTS "parts_health_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "parts_supplier_shop_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "shop_id" integer NOT NULL,
  "technique" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "parts_supplier_shop_links_supplier_profile_id_unique" UNIQUE("supplier_profile_id")
);
CREATE INDEX IF NOT EXISTS "parts_supplier_shop_links_supplier_idx" ON "parts_supplier_shop_links" ("supplier_profile_id");
