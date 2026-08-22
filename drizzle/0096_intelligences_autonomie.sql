-- Points 150-151 — fonctionnalités du fournisseur, plateforme développeur, plan d'autonomie.
CREATE TABLE IF NOT EXISTS "in_fonctions" (
  "id" serial PRIMARY KEY,
  "fonction" varchar(48) NOT NULL UNIQUE,
  "active" boolean NOT NULL DEFAULT false,
  "motif" text NOT NULL DEFAULT '',
  "actor_id" integer,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "in_dev_cles" (
  "id" serial PRIMARY KEY,
  "nom" varchar(80) NOT NULL,
  "prefixe" varchar(16) NOT NULL,
  "empreinte" varchar(64) NOT NULL UNIQUE,
  "portee" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "role" varchar(24) NOT NULL DEFAULT 'user',
  "quota_jour" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT false,
  "motif" text NOT NULL DEFAULT '',
  "actor_id" integer,
  "dernier_usage" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "in_dev_cles_empreinte_idx" ON "in_dev_cles" ("empreinte");

CREATE TABLE IF NOT EXISTS "in_dev_appels" (
  "id" bigserial PRIMARY KEY,
  "cle_id" integer NOT NULL,
  "capacite" varchar(32) NOT NULL DEFAULT '',
  "ok" boolean NOT NULL DEFAULT false,
  "motif" text NOT NULL DEFAULT '',
  "duree_ms" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "in_dev_appels_cle_idx" ON "in_dev_appels" ("cle_id", "created_at");

CREATE TABLE IF NOT EXISTS "in_plan_autonomie" (
  "id" serial PRIMARY KEY,
  "etape" varchar(48) NOT NULL UNIQUE,
  "statut" varchar(16) NOT NULL DEFAULT 'attente',
  "motif" text NOT NULL DEFAULT '',
  "actor_id" integer,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
