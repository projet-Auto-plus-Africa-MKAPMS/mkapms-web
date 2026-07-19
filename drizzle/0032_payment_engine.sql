-- Payment Engine — Moteur de paiement propriétaire (Phase 2)
-- Tables isolées préfixées payment_. Aucune table existante n'est modifiée
-- (la table `payments` historique reste intacte ; référencée en lecture via
-- legacy_payment_id). Migration idempotente.

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" bigserial PRIMARY KEY,
  "reference" varchar(40) NOT NULL UNIQUE,
  "user_id" integer,
  "entity_type" varchar(32) NOT NULL DEFAULT 'other',
  "entity_id" varchar(64),
  "univers" varchar(48),
  "service" varchar(64),
  "amount" numeric(12,2) NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'EUR',
  "method" varchar(24) NOT NULL DEFAULT 'card',
  "status" varchar(24) NOT NULL DEFAULT 'cree',
  "country_code" varchar(4) NOT NULL DEFAULT 'FR',
  "stripe_session_id" varchar(256),
  "stripe_payment_id" varchar(256),
  "invoice_ref" varchar(64),
  "legacy_payment_id" integer,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_events" (
  "id" bigserial PRIMARY KEY,
  "transaction_id" integer NOT NULL,
  "type" varchar(48) NOT NULL,
  "from_status" varchar(24),
  "to_status" varchar(24),
  "data" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_bank_transfers" (
  "id" bigserial PRIMARY KEY,
  "transaction_id" integer NOT NULL,
  "beneficiary" varchar(160) NOT NULL,
  "iban" varchar(40) NOT NULL,
  "bic" varchar(16),
  "expected_amount" numeric(12,2) NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'EUR',
  "reference" varchar(40) NOT NULL,
  "due_date" timestamp,
  "reconciled" boolean NOT NULL DEFAULT false,
  "reconciled_at" timestamp,
  "reconciled_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_refunds" (
  "id" bigserial PRIMARY KEY,
  "transaction_id" integer NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "reason" text,
  "status" varchar(24) NOT NULL DEFAULT 'cree',
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_pro_rib" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "holder" varchar(160) NOT NULL,
  "iban" varchar(40) NOT NULL,
  "bic" varchar(16),
  "country_code" varchar(4) NOT NULL DEFAULT 'FR',
  "bank_name" varchar(120),
  "format_valid" boolean NOT NULL DEFAULT false,
  "verified" boolean NOT NULL DEFAULT false,
  "verified_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_country_rules" (
  "id" serial PRIMARY KEY,
  "country_code" varchar(4) NOT NULL UNIQUE,
  "currency" varchar(8) NOT NULL DEFAULT 'EUR',
  "methods" jsonb DEFAULT '[]'::jsonb,
  "active" boolean NOT NULL DEFAULT true,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "payment_tx_user_idx" ON "payment_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "payment_tx_status_idx" ON "payment_transactions" ("status");
CREATE INDEX IF NOT EXISTS "payment_tx_created_idx" ON "payment_transactions" ("created_at");
CREATE INDEX IF NOT EXISTS "payment_events_tx_idx" ON "payment_events" ("transaction_id");
CREATE INDEX IF NOT EXISTS "payment_bank_tx_idx" ON "payment_bank_transfers" ("transaction_id");
CREATE INDEX IF NOT EXISTS "payment_bank_reconciled_idx" ON "payment_bank_transfers" ("reconciled");
CREATE INDEX IF NOT EXISTS "payment_refunds_tx_idx" ON "payment_refunds" ("transaction_id");
CREATE INDEX IF NOT EXISTS "payment_rib_user_idx" ON "payment_pro_rib" ("user_id");
