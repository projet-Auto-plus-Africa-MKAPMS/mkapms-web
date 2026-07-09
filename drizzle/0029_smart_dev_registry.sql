-- Smart Engine — Apprentissage des développements (Partie 11)
-- À chaque nouveau développement (moteur, table, API, page, bouton,
-- formulaire), le Système Intelligent l'analyse, comprend sa fonction,
-- l'ajoute à sa surveillance et vérifie qu'une permission est bien définie
-- (Permission Engine). Table isolée, préfixée smart_. Aucune donnée
-- existante n'est modifiée.

DO $$ BEGIN
  CREATE TYPE "smart_dev_kind" AS ENUM ('moteur', 'table', 'api', 'page', 'bouton', 'formulaire');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "smart_dev_status" AS ENUM ('nouveau', 'surveille', 'ignore');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "smart_dev_permission" AS ENUM ('definie', 'requise', 'publique', 'na');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "smart_dev_registry" (
  "id" bigserial PRIMARY KEY,
  "kind" "smart_dev_kind" NOT NULL,
  "name" varchar(255) NOT NULL,
  "function_guess" text,
  "subtype" varchar(32),
  "permission_module" varchar(64),
  "permission" "smart_dev_permission" DEFAULT 'na',
  "status" "smart_dev_status" DEFAULT 'nouveau',
  "signature" varchar(320) NOT NULL UNIQUE,
  "detections" integer DEFAULT 1,
  "metadata" jsonb,
  "acknowledged_by" integer,
  "first_seen_at" timestamp DEFAULT now(),
  "last_seen_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_dev_kind_idx" ON "smart_dev_registry" ("kind");
CREATE INDEX IF NOT EXISTS "smart_dev_status_idx" ON "smart_dev_registry" ("status");
CREATE INDEX IF NOT EXISTS "smart_dev_permission_idx" ON "smart_dev_registry" ("permission");
