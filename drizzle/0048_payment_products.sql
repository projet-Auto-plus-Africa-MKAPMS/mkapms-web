-- Payment OS — Phase 24 : registre central des produits & tarifs.
-- Source unique de vérité des prix. Idempotent et sûr sur base existante.
CREATE TABLE IF NOT EXISTS "payment_products" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(64) NOT NULL,
  "name" varchar(160) NOT NULL,
  "univers" varchar(48) NOT NULL DEFAULT 'general',
  "payment_case" varchar(48) NOT NULL DEFAULT 'options_premium',
  "price" numeric(12,2) NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'EUR',
  "vat_rate" numeric(5,2) NOT NULL DEFAULT '20.00',
  "country_code" varchar(4) NOT NULL DEFAULT 'FR',
  "payment_type" varchar(24) NOT NULL DEFAULT 'unique',
  "periodicity" varchar(16),
  "beneficiary" varchar(24) NOT NULL DEFAULT 'mkapms',
  "commission_rate" numeric(5,2) NOT NULL DEFAULT '0.00',
  "validity_days" integer NOT NULL DEFAULT 0,
  "refund_policy" text,
  "active" boolean NOT NULL DEFAULT true,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "payment_products_code_uniq" ON "payment_products" ("code");
