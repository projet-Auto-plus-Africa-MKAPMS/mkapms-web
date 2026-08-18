-- MKA.P-MS Intelligences — échanges, consommation et commandes.
-- Tables isolées, préfixe in_. Aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "in_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "cote" varchar(16) DEFAULT 'public' NOT NULL,
  "titre" varchar(200) DEFAULT '' NOT NULL,
  "user_id" integer,
  "visiteur" varchar(64),
  "country_code" varchar(8),
  "langue" varchar(8) DEFAULT 'fr' NOT NULL,
  "messages" integer DEFAULT 0 NOT NULL,
  "dernier_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "in_messages" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "session_id" integer NOT NULL,
  "cote" varchar(16) DEFAULT 'public' NOT NULL,
  "role" varchar(16) NOT NULL,
  "contenu" text DEFAULT '' NOT NULL,
  "fournisseur" varchar(48),
  "modele" varchar(64),
  "ok" boolean DEFAULT true NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "jetons_entree" integer DEFAULT 0 NOT NULL,
  "jetons_sortie" integer DEFAULT 0 NOT NULL,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "contexte" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "in_usage" (
  "id" serial PRIMARY KEY NOT NULL,
  "jour" varchar(10) NOT NULL,
  "cote" varchar(16) NOT NULL,
  "appels" integer DEFAULT 0 NOT NULL,
  "echecs" integer DEFAULT 0 NOT NULL,
  "jetons" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "in_actions" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" integer,
  "commande" varchar(48) NOT NULL,
  "argument" text DEFAULT '' NOT NULL,
  "resultat" varchar(16) DEFAULT 'propose' NOT NULL,
  "detail" text DEFAULT '' NOT NULL,
  "dev_request_id" integer,
  "pipeline_run_id" integer,
  "actor_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_messages_session_idx" ON "in_messages" ("session_id");
CREATE INDEX IF NOT EXISTS "in_sessions_cote_idx" ON "in_sessions" ("cote", "dernier_at");
CREATE UNIQUE INDEX IF NOT EXISTS "in_usage_jour_cote_idx" ON "in_usage" ("jour", "cote");
