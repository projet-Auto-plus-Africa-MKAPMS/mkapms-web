-- Order Engine (Plan Maître Fournisseurs §36-37, section "COMMANDES").
-- Portail « Véhicule sur commande » (demande PDG). Prend le relais du
-- Vehicle Engine (LOT 2) une fois un véhicule publié : `vehicle_item_id`,
-- `annonce_id` et `supplier_profile_id` référencent des tables d'autres
-- moteurs en lecture seule, sans contrainte FK dure (moteur indépendant).
CREATE TABLE IF NOT EXISTS "order_listings" (
  "id" serial PRIMARY KEY NOT NULL,
  "annonce_id" integer NOT NULL,
  "vehicle_item_id" integer,
  "supplier_profile_id" integer NOT NULL,
  "creation_mode" varchar(16) NOT NULL,
  "created_by_employee_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_listings_annonce_id_unique" UNIQUE("annonce_id")
);
CREATE INDEX IF NOT EXISTS "order_listings_annonce_idx" ON "order_listings" ("annonce_id");
CREATE INDEX IF NOT EXISTS "order_listings_supplier_idx" ON "order_listings" ("supplier_profile_id");

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "vehicle_item_id" integer,
  "annonce_id" integer NOT NULL,
  "supplier_profile_id" integer NOT NULL,
  "customer_id" integer NOT NULL,
  "assigned_employee_id" integer,
  "assigned_at" timestamp,
  "assigned_by" integer,
  "status" varchar(32) DEFAULT 'vehicule_selectionne' NOT NULL,
  "total_amount" numeric(12, 2),
  "deposit_amount" numeric(12, 2),
  "balance_amount" numeric(12, 2),
  "currency" varchar(4) DEFAULT 'EUR' NOT NULL,
  "supplier_price_confidential" numeric(12, 2),
  "margin_confidential" numeric(12, 2),
  "price_margin_validated_by" integer,
  "price_margin_validated_at" timestamp,
  "deposit_payment_ref" integer,
  "balance_payment_ref" integer,
  "estimated_ready_at" timestamp,
  "deadline_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_items_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "order_items_vehicle_idx" ON "order_items" ("vehicle_item_id");
CREATE INDEX IF NOT EXISTS "order_items_annonce_idx" ON "order_items" ("annonce_id");
CREATE INDEX IF NOT EXISTS "order_items_customer_idx" ON "order_items" ("customer_id");
CREATE INDEX IF NOT EXISTS "order_items_employee_idx" ON "order_items" ("assigned_employee_id");
CREATE INDEX IF NOT EXISTS "order_items_status_idx" ON "order_items" ("status");

CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "order_item_id" integer NOT NULL,
  "status" varchar(32) NOT NULL,
  "actor_type" varchar(16) NOT NULL,
  "actor_id" integer,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "order_status_history_order_idx" ON "order_status_history" ("order_item_id","created_at");

CREATE TABLE IF NOT EXISTS "order_decisions" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_item_id" integer NOT NULL,
  "decision" varchar(16) NOT NULL,
  "decided_by" integer NOT NULL,
  "note" text,
  "return_reference" varchar(64),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_decisions_order_item_id_unique" UNIQUE("order_item_id")
);
CREATE INDEX IF NOT EXISTS "order_decisions_order_idx" ON "order_decisions" ("order_item_id");

CREATE TABLE IF NOT EXISTS "order_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_item_id" integer NOT NULL,
  "document_type" varchar(32) NOT NULL,
  "doc_document_id" integer NOT NULL,
  "generated_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "order_documents_order_idx" ON "order_documents" ("order_item_id","document_type");

CREATE TABLE IF NOT EXISTS "order_engine_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "action" varchar(64) NOT NULL,
  "order_item_id" integer,
  "actor_id" integer,
  "detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "order_engine_audit_log_order_idx" ON "order_engine_audit_log" ("order_item_id","created_at");
