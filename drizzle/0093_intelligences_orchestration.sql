-- Points 130-133 — orchestrateur, niveaux d'autonomie.
-- Tables isolées, préfixe in_. Aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "in_autonomie" (
  "id" serial PRIMARY KEY NOT NULL,
  "domaine" varchar(48) NOT NULL UNIQUE,
  "niveau" integer DEFAULT 2 NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "actor_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "in_autonomie_journal" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "domaine" varchar(48) NOT NULL,
  "avant" integer NOT NULL,
  "apres" integer NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "actor_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_autonomie_journal_domaine_idx"
  ON "in_autonomie_journal" ("domaine", "created_at");

CREATE TABLE IF NOT EXISTS "in_missions" (
  "id" serial PRIMARY KEY NOT NULL,
  "objectif" text NOT NULL,
  "domaine" varchar(48) DEFAULT 'inconnu' NOT NULL,
  "cote" varchar(16) DEFAULT 'direction' NOT NULL,
  "statut" varchar(32) DEFAULT 'en_cours' NOT NULL,
  "arret_sur" varchar(48) DEFAULT '' NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "rapport" text DEFAULT '' NOT NULL,
  "niveau_requis" integer DEFAULT 1 NOT NULL,
  "niveau_accorde" integer DEFAULT 0 NOT NULL,
  "dev_request_id" integer,
  "pipeline_run_id" integer,
  "test_run_id" integer,
  "actor_id" integer,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_missions_statut_idx" ON "in_missions" ("statut", "created_at");

CREATE TABLE IF NOT EXISTS "in_mission_etapes" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "mission_id" integer NOT NULL,
  "rang" integer NOT NULL,
  "etape" varchar(48) NOT NULL,
  "libelle" varchar(160) DEFAULT '' NOT NULL,
  "statut" varchar(32) DEFAULT 'non_execute' NOT NULL,
  "capacite" varchar(32),
  "permission" varchar(24),
  "niveau_requis" integer DEFAULT 1 NOT NULL,
  "observe" text DEFAULT '' NOT NULL,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_mission_etapes_mission_idx"
  ON "in_mission_etapes" ("mission_id", "rang");
