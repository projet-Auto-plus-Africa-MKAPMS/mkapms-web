-- Smart Engine — Préproduction / Staging (Partie 13)
-- Toute évolution préparée par le Système Intelligent passe par une zone de
-- préproduction avant toute mise en production : brouillon → en test →
-- attente de validation → approuvé/rejeté → intégré. L'intégration exige une
-- validation humaine. Table isolée, préfixée smart_. Additif.

DO $$ BEGIN
  CREATE TYPE "smart_staging_type" AS ENUM ('moteur', 'interface', 'formulaire', 'systeme', 'api', 'automatisation', 'correction', 'optimisation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "smart_staging_status" AS ENUM ('brouillon', 'en_test', 'attente_validation', 'approuve', 'rejete', 'integre');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "smart_staging" (
  "id" bigserial PRIMARY KEY,
  "type" "smart_staging_type" NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "status" "smart_staging_status" DEFAULT 'brouillon',
  "test_result" text,
  "risk_note" text,
  "proposed_by" varchar(64) DEFAULT 'systeme',
  "validated_by" integer,
  "validated_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_staging_status_idx" ON "smart_staging" ("status");
CREATE INDEX IF NOT EXISTS "smart_staging_type_idx" ON "smart_staging" ("type");
