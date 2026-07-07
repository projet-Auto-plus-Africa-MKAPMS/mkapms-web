-- Smart Engine — Système Intelligent MKA.P-MS (tables isolées, préfixées smart_)

-- Enums
DO $$ BEGIN CREATE TYPE "smart_alert_severity" AS ENUM ('info', 'warning', 'critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "smart_alert_status" AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "smart_duplicate_type" AS ENUM ('plaque', 'vin', 'photo', 'description', 'vendeur'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "smart_learned_status" AS ENUM ('proposed', 'confirmed', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Analyse des recherches
CREATE TABLE IF NOT EXISTS "smart_search_logs" (
  "id" bigserial PRIMARY KEY,
  "user_id" integer,
  "session_id" varchar(128),
  "query" text,
  "filters" jsonb,
  "ville" varchar(128),
  "pays" varchar(64),
  "rayon" integer,
  "budget_min" integer,
  "budget_max" integer,
  "result_count" integer DEFAULT 0,
  "has_results" boolean DEFAULT true,
  "clicked_annonce_id" integer,
  "created_at" timestamp DEFAULT now()
);

-- 2. Mémoire utilisateur
CREATE TABLE IF NOT EXISTS "smart_user_memory" (
  "id" bigserial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "type" varchar(32) NOT NULL,
  "data" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 3. Recommandations
CREATE TABLE IF NOT EXISTS "smart_recommendations" (
  "id" bigserial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "type" varchar(32) NOT NULL,
  "target_id" integer,
  "reason" text,
  "score" integer DEFAULT 0,
  "seen" boolean DEFAULT false,
  "clicked" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- 4. Apprentissage dépôt d'annonce
CREATE TABLE IF NOT EXISTS "smart_learned_data" (
  "id" serial PRIMARY KEY,
  "field" varchar(64) NOT NULL,
  "marque" varchar(64),
  "modele" varchar(64),
  "value" varchar(255) NOT NULL,
  "submitted_by" integer,
  "confirmations" integer DEFAULT 1,
  "status" "smart_learned_status" DEFAULT 'proposed',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 5. Détection doublon annonce
CREATE TABLE IF NOT EXISTS "smart_duplicates" (
  "id" serial PRIMARY KEY,
  "annonce_id" integer NOT NULL,
  "matched_annonce_id" integer NOT NULL,
  "type" "smart_duplicate_type" NOT NULL,
  "confidence" integer DEFAULT 0,
  "resolved" boolean DEFAULT false,
  "resolved_by" integer,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- 6. Reconnaissance photo
CREATE TABLE IF NOT EXISTS "smart_photo_fingerprints" (
  "id" bigserial PRIMARY KEY,
  "annonce_id" integer NOT NULL,
  "photo_index" integer DEFAULT 0,
  "fingerprint" varchar(128) NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- 7. Détection faux comptes
CREATE TABLE IF NOT EXISTS "smart_suspect_accounts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "reason" varchar(64) NOT NULL,
  "details" jsonb,
  "severity" "smart_alert_severity" DEFAULT 'warning',
  "resolved" boolean DEFAULT false,
  "resolved_by" integer,
  "created_at" timestamp DEFAULT now()
);

-- 8. Centre de contrôle — alertes
CREATE TABLE IF NOT EXISTS "smart_alerts" (
  "id" serial PRIMARY KEY,
  "category" varchar(48) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "severity" "smart_alert_severity" DEFAULT 'info',
  "status" "smart_alert_status" DEFAULT 'open',
  "target_type" varchar(32),
  "target_id" integer,
  "metadata" jsonb,
  "resolved_by" integer,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- 9. Journal d'activité
CREATE TABLE IF NOT EXISTS "smart_activity_log" (
  "id" bigserial PRIMARY KEY,
  "action" varchar(64) NOT NULL,
  "user_id" integer,
  "target_type" varchar(32),
  "target_id" integer,
  "data" jsonb,
  "result" varchar(32),
  "proposed_decision" text,
  "human_validation" boolean,
  "validated_by" integer,
  "created_at" timestamp DEFAULT now()
);

-- 13. Surveillance santé plateforme
CREATE TABLE IF NOT EXISTS "smart_health_checks" (
  "id" serial PRIMARY KEY,
  "page" varchar(255) NOT NULL,
  "element" varchar(128) NOT NULL,
  "element_type" varchar(32) NOT NULL,
  "status" varchar(16) DEFAULT 'ok',
  "last_checked_at" timestamp DEFAULT now(),
  "error_details" text,
  "suggested_fix" text,
  "created_at" timestamp DEFAULT now()
);
