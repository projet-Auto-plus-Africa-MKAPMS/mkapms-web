-- LOT 6 du Plan Maître Fournisseurs (documents) : Supplier Document Engine
-- (§33), Vehicle Document Engine (§34), Document Custody Engine (§35).
-- 100 % additif — aucune table existante modifiée. `doc_document_id`
-- référence `doc_documents.id` (Document OS, server/document-os/index.ts) en
-- lecture seule, sans contrainte FK dure, même principe que le reste du plan.

CREATE TABLE IF NOT EXISTS "supplier_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "doc_type" varchar(48) NOT NULL,
  "doc_document_id" integer,
  "notes" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "supplier_documents_supplier_idx" ON "supplier_documents" ("supplier_profile_id","doc_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "vehicle_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_item_id" integer NOT NULL,
  "doc_type" varchar(48) NOT NULL,
  "doc_document_id" integer,
  "notes" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vehicle_documents_vehicle_idx" ON "vehicle_documents" ("vehicle_item_id","doc_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "custody_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "entity_type" varchar(32) NOT NULL,
  "entity_id" integer NOT NULL,
  "doc_type" varchar(48) NOT NULL,
  "doc_document_id" integer,
  "kind" varchar(16) DEFAULT 'original' NOT NULL,
  "status" varchar(16) DEFAULT 'attendu' NOT NULL,
  "current_holder" varchar(160),
  "received_at" timestamp,
  "handed_over_at" timestamp,
  "recipient" varchar(160),
  "proof_of_handover" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "custody_records_entity_idx" ON "custody_records" ("entity_type","entity_id","doc_type");
CREATE INDEX IF NOT EXISTS "custody_records_status_idx" ON "custody_records" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "custody_requirements" (
  "id" serial PRIMARY KEY NOT NULL,
  "entity_type" varchar(32) NOT NULL,
  "step" varchar(48) NOT NULL,
  "doc_type" varchar(48) NOT NULL,
  "mandatory" boolean DEFAULT true NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "custody_requirements_step_idx" ON "custody_requirements" ("entity_type","step","active");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "document_engine_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "entity_type" varchar(32),
  "entity_id" integer,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "document_engine_audit_log_entity_idx" ON "document_engine_audit_log" ("entity_type","entity_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "document_engine_health_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
