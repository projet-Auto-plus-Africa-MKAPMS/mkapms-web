-- LOT 1 du Plan Maître Fournisseurs : Supplier Registry, Onboarding,
-- Connector Engine, Universal Mapping Engine, Audit.
-- Complète le réseau de partenaires existant (`partners`, `partner_applications`,
-- `partner_contracts`) au lieu de le dupliquer : `partner_id` référence
-- `partners.id` en lecture seule, sans contrainte FK dure (moteur indépendant).
CREATE TABLE IF NOT EXISTS "supplier_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "partner_id" integer NOT NULL,
  "supplier_type" varchar(24) NOT NULL,
  "company_legal_name" varchar(200) NOT NULL,
  "registration_number" varchar(64),
  "vat_number" varchar(32),
  "country_code" varchar(4) NOT NULL,
  "currency" varchar(8) DEFAULT 'EUR' NOT NULL,
  "territories_allowed" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "territories_excluded" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "payment_terms_days" integer DEFAULT 30 NOT NULL,
  "commercial_terms" text,
  "kyb_status" varchar(16) DEFAULT 'non_verifie' NOT NULL,
  "kyb_verified_by" integer,
  "kyb_verified_at" timestamp,
  "kyb_note" text,
  "status" varchar(24) DEFAULT 'brouillon' NOT NULL,
  "validated_by_direction" integer,
  "validated_at" timestamp,
  "contract_terms_id" integer,
  "activated_at" timestamp,
  "activated_by" integer,
  "suspended_at" timestamp,
  "suspended_reason" text,
  "deactivated_at" timestamp,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "supplier_profiles_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "supplier_profiles_partner_idx" ON "supplier_profiles" ("partner_id");
CREATE INDEX IF NOT EXISTS "supplier_profiles_status_idx" ON "supplier_profiles" ("status","supplier_type");
CREATE INDEX IF NOT EXISTS "supplier_profiles_country_idx" ON "supplier_profiles" ("country_code");

CREATE TABLE IF NOT EXISTS "supplier_contacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "kind" varchar(16) NOT NULL,
  "name" varchar(160),
  "email" varchar(255),
  "phone" varchar(32),
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "supplier_contacts_supplier_idx" ON "supplier_contacts" ("supplier_profile_id","kind");

CREATE TABLE IF NOT EXISTS "supplier_onboarding_steps" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "step" varchar(32) NOT NULL,
  "status" varchar(16) DEFAULT 'a_faire' NOT NULL,
  "completed_by" integer,
  "completed_at" timestamp,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "supplier_onboarding_steps_supplier_idx" ON "supplier_onboarding_steps" ("supplier_profile_id","step");

CREATE TABLE IF NOT EXISTS "supplier_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "method" varchar(32) NOT NULL,
  "auth_type" varchar(16) DEFAULT 'none' NOT NULL,
  "environment" varchar(16) DEFAULT 'sandbox' NOT NULL,
  "status" varchar(16) DEFAULT 'not_connected' NOT NULL,
  "endpoint_url" text,
  "secret_ref" varchar(128),
  "rate_limit_per_minute" integer,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_health_check_at" timestamp,
  "last_health_status" varchar(16) DEFAULT 'not_connected' NOT NULL,
  "last_health_message" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "supplier_connections_supplier_idx" ON "supplier_connections" ("supplier_profile_id","active");

CREATE TABLE IF NOT EXISTS "supplier_mappings" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "entity_type" varchar(16) NOT NULL,
  "canonical_field" varchar(96) NOT NULL,
  "supplier_field" varchar(96) NOT NULL,
  "transform" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "supplier_mappings_supplier_idx" ON "supplier_mappings" ("supplier_profile_id","entity_type","active");

CREATE TABLE IF NOT EXISTS "supplier_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "from_status" varchar(24),
  "to_status" varchar(24),
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "supplier_audit_log_supplier_idx" ON "supplier_audit_log" ("supplier_profile_id","created_at");

CREATE TABLE IF NOT EXISTS "supplier_health_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
