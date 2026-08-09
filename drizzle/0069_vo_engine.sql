-- Points 32-33 : VO Engine (estimation, reprise, dossier VO).
CREATE TABLE IF NOT EXISTS "vo_estimations" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "plaque" varchar(24),
  "vin" varchar(32),
  "marque" varchar(80) NOT NULL,
  "modele" varchar(120) NOT NULL,
  "version" varchar(160),
  "annee" integer,
  "kilometrage" integer,
  "carburant" varchar(32),
  "boite" varchar(32),
  "etat" varchar(32),
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "low" numeric(12, 2) NOT NULL,
  "mid" numeric(12, 2) NOT NULL,
  "high" numeric(12, 2) NOT NULL,
  "currency" varchar(8) DEFAULT 'EUR' NOT NULL,
  "method" varchar(24) NOT NULL,
  "sample_size" integer DEFAULT 0 NOT NULL,
  "confidence" varchar(12) DEFAULT 'faible' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vo_estimations_user_idx" ON "vo_estimations" ("user_id","created_at");

CREATE TABLE IF NOT EXISTS "vo_reprise_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "user_id" integer NOT NULL,
  "estimation_id" integer,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "contact_phone" varchar(40),
  "message" text,
  "status" varchar(16) DEFAULT 'envoyee' NOT NULL,
  "offer_amount" numeric(12, 2),
  "offer_by" integer,
  "offer_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "vo_reprise_requests_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "vo_reprise_requests_status_idx" ON "vo_reprise_requests" ("status","created_at");

CREATE TABLE IF NOT EXISTS "vo_dossier_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "annonce_id" integer,
  "vo_vehicule_id" integer,
  "estimation_id" integer,
  "category" varchar(32) NOT NULL,
  "title" varchar(200) NOT NULL,
  "detail" text,
  "document_url" text,
  "occurred_at" timestamp,
  "amount" numeric(12, 2),
  "meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "vo_dossier_items_annonce_idx" ON "vo_dossier_items" ("annonce_id","category");
CREATE INDEX IF NOT EXISTS "vo_dossier_items_vehicule_idx" ON "vo_dossier_items" ("vo_vehicule_id","category");
