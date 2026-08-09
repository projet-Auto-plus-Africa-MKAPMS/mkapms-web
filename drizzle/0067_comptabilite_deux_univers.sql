-- Point 26 : comptabilité en deux univers séparés.
-- A. Comptabilité interne — rapprochement paiement ↔ écriture.
CREATE TABLE IF NOT EXISTS "compta_rapprochements" (
  "id" serial PRIMARY KEY NOT NULL,
  "payment_id" integer NOT NULL,
  "ecriture_id" integer,
  "amount" numeric(14, 2) NOT NULL,
  "currency" varchar(8) DEFAULT 'EUR' NOT NULL,
  "status" varchar(16) DEFAULT 'rapproche' NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "compta_rapprochements_payment_id_unique" UNIQUE("payment_id")
);
CREATE INDEX IF NOT EXISTS "compta_rapprochements_status_idx" ON "compta_rapprochements" ("status","created_at");

-- B. Marketplace comptabilité — annuaire de comptables indépendants.
CREATE TABLE IF NOT EXISTS "accountant_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "cabinet_id" integer,
  "display_name" varchar(160) NOT NULL,
  "country_code" varchar(4) NOT NULL,
  "city" varchar(120),
  "postal_code" varchar(16),
  "latitude" numeric(9, 6),
  "longitude" numeric(9, 6),
  "specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "languages" jsonb DEFAULT '["fr"]'::jsonb NOT NULL,
  "hourly_rate" numeric(10, 2),
  "currency" varchar(8) DEFAULT 'EUR' NOT NULL,
  "availability" varchar(16) DEFAULT 'disponible' NOT NULL,
  "bio" text,
  "verified" boolean DEFAULT false NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "rating_avg" numeric(3, 2),
  "rating_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "accountant_profiles_search_idx" ON "accountant_profiles" ("country_code","published","verified");

CREATE TABLE IF NOT EXISTS "accountant_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "accountant_id" integer,
  "country_code" varchar(4) NOT NULL,
  "city" varchar(120),
  "specialty" varchar(48),
  "message" text,
  "status" varchar(16) DEFAULT 'envoyee' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "responded_at" timestamp
);
CREATE INDEX IF NOT EXISTS "accountant_requests_status_idx" ON "accountant_requests" ("status","created_at");
