-- LOT 4 du Plan Maître Fournisseurs (transport/livraison) : Delivery/
-- Logistics API Gateway, Carrier Connector Engine, Delivery Quote/Routing
-- Engine, Multi-Leg Engine (MASTER SHIPMENT + LEG 1-4), Tracking Engine, API
-- MKA.P-MS pour transporteurs. `carrier_code` référence le catalogue
-- CARRIER_CATALOG (contract.ts), jamais une table par transporteur.
-- `supplier_profile_id` référence `supplier_profiles.id` (LOT 1) en lecture
-- seule, sans contrainte FK dure.
CREATE TABLE IF NOT EXISTS "logistics_carrier_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "carrier_code" varchar(32) NOT NULL,
  "supplier_profile_id" integer,
  "method" varchar(32) NOT NULL,
  "auth_type" varchar(16) DEFAULT 'none' NOT NULL,
  "environment" varchar(16) DEFAULT 'sandbox' NOT NULL,
  "status" varchar(16) DEFAULT 'not_connected' NOT NULL,
  "endpoint_url" text,
  "secret_ref" varchar(128),
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_health_check_at" timestamp,
  "last_health_status" varchar(16) DEFAULT 'not_connected' NOT NULL,
  "last_health_message" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_carrier_connections_carrier_idx" ON "logistics_carrier_connections" ("carrier_code","active");

CREATE TABLE IF NOT EXISTS "logistics_shipments" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "source_type" varchar(24) DEFAULT 'manuel' NOT NULL,
  "source_item_id" integer,
  "categorie" varchar(16) NOT NULL,
  "origine_ville" varchar(128),
  "origine_pays" varchar(4),
  "destination_ville" varchar(128),
  "destination_pays" varchar(4),
  "poids_kg" numeric(10,3),
  "valeur_declaree" numeric(12,2),
  "devise" varchar(8) DEFAULT 'EUR' NOT NULL,
  "status" varchar(24) DEFAULT 'CREATED' NOT NULL,
  "total_price" numeric(12,2),
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "logistics_shipments_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "logistics_shipments_source_idx" ON "logistics_shipments" ("source_type","source_item_id");
CREATE INDEX IF NOT EXISTS "logistics_shipments_status_idx" ON "logistics_shipments" ("status");

CREATE TABLE IF NOT EXISTS "logistics_legs" (
  "id" serial PRIMARY KEY NOT NULL,
  "shipment_id" integer NOT NULL,
  "leg_index" integer NOT NULL,
  "carrier_code" varchar(32) NOT NULL,
  "carrier_connection_id" integer,
  "mode" varchar(16) NOT NULL,
  "origine_ville" varchar(128),
  "origine_pays" varchar(4),
  "destination_ville" varchar(128),
  "destination_pays" varchar(4),
  "tarif" numeric(12,2),
  "devise" varchar(8) DEFAULT 'EUR' NOT NULL,
  "delai_jours_min" integer,
  "delai_jours_max" integer,
  "status" varchar(24) DEFAULT 'CREATED' NOT NULL,
  "responsabilite" text,
  "condition_paiement" text,
  "numero_suivi" varchar(128),
  "url_suivi" text,
  "documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "preuves" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_legs_shipment_idx" ON "logistics_legs" ("shipment_id","leg_index");
CREATE INDEX IF NOT EXISTS "logistics_legs_carrier_idx" ON "logistics_legs" ("carrier_code");

CREATE TABLE IF NOT EXISTS "logistics_quotes" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "shipment_id" integer,
  "categorie" varchar(16) NOT NULL,
  "request_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "chosen_tier" varchar(16),
  "chosen_carrier_code" varchar(32),
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_quotes_shipment_idx" ON "logistics_quotes" ("shipment_id");

CREATE TABLE IF NOT EXISTS "logistics_tracking_events" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "shipment_id" integer NOT NULL,
  "leg_id" integer,
  "status" varchar(24) NOT NULL,
  "raw_carrier_status" text,
  "source" varchar(24) NOT NULL,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_tracking_events_shipment_idx" ON "logistics_tracking_events" ("shipment_id","occurred_at");

CREATE TABLE IF NOT EXISTS "logistics_api_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "carrier_code" varchar(32) NOT NULL,
  "name" varchar(160) NOT NULL,
  "key_prefix" varchar(32) NOT NULL,
  "key_hash" varchar(128) NOT NULL,
  "scopes" varchar(255),
  "active" boolean DEFAULT true NOT NULL,
  "last_used_at" timestamp,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_api_keys_carrier_idx" ON "logistics_api_keys" ("carrier_code","active");
CREATE INDEX IF NOT EXISTS "logistics_api_keys_prefix_idx" ON "logistics_api_keys" ("key_prefix");

CREATE TABLE IF NOT EXISTS "logistics_webhook_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "carrier_code" varchar(32) NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "signature_valid" boolean DEFAULT false NOT NULL,
  "status" varchar(24) DEFAULT 'recu' NOT NULL,
  "error" text,
  "received_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_webhook_log_carrier_idx" ON "logistics_webhook_log" ("carrier_code","received_at");

CREATE TABLE IF NOT EXISTS "logistics_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "shipment_id" integer,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "logistics_audit_log_shipment_idx" ON "logistics_audit_log" ("shipment_id","created_at");

CREATE TABLE IF NOT EXISTS "logistics_health_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
