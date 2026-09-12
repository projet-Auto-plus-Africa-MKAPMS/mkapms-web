-- Chantier de développement MKA.P-MS Intelligence (server/intelligences/chantier/) —
-- projets de site, exécutions shell/build/test, aperçus temporaires.
ALTER TABLE "in_sessions" ADD COLUMN IF NOT EXISTS "projet_actif_id" integer;

CREATE TABLE IF NOT EXISTS "in_projets" (
  "id" serial PRIMARY KEY,
  "owner_id" integer NOT NULL,
  "nom" varchar(120) NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "type_projet" varchar(32) NOT NULL DEFAULT 'site_vitrine',
  "workspace_path" varchar(300) NOT NULL,
  "statut" varchar(24) NOT NULL DEFAULT 'cree',
  "country_code" varchar(8),
  "permissions" jsonb NOT NULL DEFAULT '[]',
  "provider_context" jsonb NOT NULL DEFAULT '{}',
  "deployment_status" varchar(24) NOT NULL DEFAULT 'non_deploye',
  "session_id" integer,
  "dernier_plan" text NOT NULL DEFAULT '',
  "actor_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "in_projets_owner_idx" ON "in_projets" ("owner_id", "created_at");

CREATE TABLE IF NOT EXISTS "in_chantier_executions" (
  "id" bigserial PRIMARY KEY,
  "projet_id" integer NOT NULL,
  "type" varchar(24) NOT NULL,
  "commande" text NOT NULL DEFAULT '',
  "statut" varchar(24) NOT NULL DEFAULT 'execute',
  "code_sortie" integer,
  "duree_ms" integer NOT NULL DEFAULT 0,
  "log_path" varchar(400),
  "resume" text NOT NULL DEFAULT '',
  "actor_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "in_chantier_executions_projet_idx" ON "in_chantier_executions" ("projet_id", "created_at");

CREATE TABLE IF NOT EXISTS "in_chantier_previews" (
  "id" serial PRIMARY KEY,
  "projet_id" integer NOT NULL UNIQUE,
  "port" integer,
  "pid" integer,
  "mode" varchar(24) NOT NULL DEFAULT 'statique',
  "statut" varchar(24) NOT NULL DEFAULT 'arrete',
  "url" varchar(200),
  "motif" text NOT NULL DEFAULT '',
  "demarre_at" timestamp,
  "arrete_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
