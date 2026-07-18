-- Smart Engine — Moteur Qualité (Partie 12)
-- Le Système Intelligent évalue en continu la qualité réelle de la plateforme
-- (annonces, photos, descriptions, prix, confiance, doublons, santé, avis) et
-- produit un score par domaine + un score global. 100% lecture seule sur les
-- données existantes ; les audits sont stockés dans une table isolée smart_.
-- Aucune donnée existante n'est modifiée.

DO $$ BEGIN
  CREATE TYPE "smart_quality_category" AS ENUM ('annonces', 'photos', 'descriptions', 'prix', 'confiance', 'doublons', 'sante', 'avis');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "smart_quality_status" AS ENUM ('bon', 'moyen', 'faible');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "smart_quality_audits" (
  "id" bigserial PRIMARY KEY,
  "category" "smart_quality_category" NOT NULL,
  "score" integer NOT NULL,
  "status" "smart_quality_status" NOT NULL,
  "headline" text NOT NULL,
  "recommendation" text,
  "details" jsonb,
  "sample_size" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_quality_category_idx" ON "smart_quality_audits" ("category");
CREATE INDEX IF NOT EXISTS "smart_quality_created_idx" ON "smart_quality_audits" ("created_at");
