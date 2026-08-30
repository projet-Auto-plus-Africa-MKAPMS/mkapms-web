-- Moteur d'authenticité des médias — tables isolées (préfixe `ma_`).
--
-- Aucune table existante n'est modifiée. Le moteur enregistre ses propres
-- constats : une ligne par passage de détecteur, avec la preuve brute conservée
-- pour pouvoir être contestée. Aucune colonne ne dit « vrai » ou « faux » : un
-- détecteur qui n'a pas pu s'exécuter vaut `indisponible`, jamais rassurant.

CREATE TABLE IF NOT EXISTS "ma_medias" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "sha256" varchar(64) NOT NULL,
  "phash" varchar(64),
  "kind" varchar(16) DEFAULT 'inconnu' NOT NULL,
  "mime" varchar(96),
  "bytes" integer DEFAULT 0 NOT NULL,
  "contexte" varchar(32) DEFAULT 'inconnu' NOT NULL,
  "contexte_id" integer,
  "owner_id" integer,
  "country_code" varchar(8),
  "declaration" varchar(24) DEFAULT 'non_declare' NOT NULL,
  "provenance" jsonb DEFAULT '{}'::jsonb,
  "statut" varchar(16) DEFAULT 'en_attente' NOT NULL,
  "score" integer DEFAULT 0 NOT NULL,
  "niveau" varchar(16) DEFAULT 'indetermine' NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "analyse_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ma_medias_sha_idx" ON "ma_medias" ("sha256");
CREATE INDEX IF NOT EXISTS "ma_medias_phash_idx" ON "ma_medias" ("phash");
CREATE INDEX IF NOT EXISTS "ma_medias_contexte_idx" ON "ma_medias" ("contexte","contexte_id");
CREATE INDEX IF NOT EXISTS "ma_medias_statut_idx" ON "ma_medias" ("statut","created_at");

CREATE TABLE IF NOT EXISTS "ma_analyses" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "media_id" integer NOT NULL,
  "detecteur" varchar(48) NOT NULL,
  "verdict" varchar(16) NOT NULL,
  "poids" integer DEFAULT 0 NOT NULL,
  "raison" text DEFAULT '' NOT NULL,
  "preuve" jsonb DEFAULT '{}'::jsonb,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ma_analyses_media_idx" ON "ma_analyses" ("media_id");
CREATE INDEX IF NOT EXISTS "ma_analyses_detecteur_idx" ON "ma_analyses" ("detecteur","created_at");

CREATE TABLE IF NOT EXISTS "ma_labels" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "media_id" integer NOT NULL,
  "code" varchar(32) NOT NULL,
  "origine" varchar(16) NOT NULL,
  "visible" boolean DEFAULT false NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ma_labels_media_idx" ON "ma_labels" ("media_id");

CREATE TABLE IF NOT EXISTS "ma_incidents" (
  "id" serial PRIMARY KEY NOT NULL,
  "media_id" integer,
  "type" varchar(32) NOT NULL,
  "gravite" varchar(16) DEFAULT 'moyenne' NOT NULL,
  "statut" varchar(16) DEFAULT 'ouvert' NOT NULL,
  "resume" text DEFAULT '' NOT NULL,
  "preuves" jsonb DEFAULT '[]'::jsonb,
  "decision" varchar(24),
  "decision_motif" text DEFAULT '' NOT NULL,
  "decide_par" integer,
  "decide_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ma_incidents_statut_idx" ON "ma_incidents" ("statut","created_at");
