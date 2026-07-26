-- Système Intelligent — Évolution autonome (préproduction / staging).
-- Le Smart Engine dépose des propositions d'évolution au statut « brouillon » ;
-- elles ne sont JAMAIS appliquées seules : approbation humaine (PDG) requise.
-- Migration idempotente et non destructive (fait partie du Smart Engine, pas
-- d'un nouveau moteur).
DO $$ BEGIN
  CREATE TYPE "smart_staging_type" AS ENUM ('optimisation', 'correction', 'evolution');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "smart_staging_status" AS ENUM ('brouillon', 'en_test', 'a_valider', 'approuve', 'integre', 'rejete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "smart_staging" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "type" "smart_staging_type" DEFAULT 'optimisation' NOT NULL,
  "title" varchar(240) NOT NULL,
  "description" text,
  "risk_note" text,
  "status" "smart_staging_status" DEFAULT 'brouillon' NOT NULL,
  "origin" varchar(48) DEFAULT 'evolution_autonome',
  "metadata" jsonb,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
