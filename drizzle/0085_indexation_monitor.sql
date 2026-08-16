-- MKA.P-MS — Indexation Monitor (points 92-93-98-99-100-101).
-- Additif : trois tables nouvelles, aucune table existante modifiée.

CREATE TABLE IF NOT EXISTS "indexation_audits" (
  "id" serial PRIMARY KEY,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "finished_at" timestamp,
  "trigger" varchar(32) NOT NULL DEFAULT 'manuel',
  "requested_by" integer,
  "base_url" varchar(255) NOT NULL DEFAULT '',
  "robots_found" boolean NOT NULL DEFAULT false,
  "sitemap_found" boolean NOT NULL DEFAULT false,
  "sitemap_urls" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL DEFAULT 0,
  "par_statut" jsonb DEFAULT '{}'::jsonb,
  "par_famille" jsonb DEFAULT '{}'::jsonb,
  "search_console" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "indexation_url_checks" (
  "id" bigserial PRIMARY KEY,
  "audit_id" integer NOT NULL,
  "url" varchar(512) NOT NULL,
  "famille" varchar(32) NOT NULL,
  "pipeline" varchar(16) NOT NULL DEFAULT 'annonce',
  "http_status" integer,
  "publique" boolean NOT NULL DEFAULT false,
  "indexable" boolean NOT NULL DEFAULT false,
  "crawl_autorise" boolean NOT NULL DEFAULT false,
  "dans_sitemap" boolean NOT NULL DEFAULT false,
  "canonical" varchar(512),
  "canonical_coherent" boolean NOT NULL DEFAULT false,
  "title" varchar(320),
  "description" text,
  "contenu_visible" integer NOT NULL DEFAULT 0,
  "donnees_structurees" jsonb DEFAULT '[]'::jsonb,
  "langue" varchar(16),
  "pays" varchar(8),
  "statut" varchar(32) NOT NULL,
  "cause_probable" varchar(32),
  "motif" text NOT NULL DEFAULT '',
  "manquant" jsonb DEFAULT '[]'::jsonb,
  "checked_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "indexation_url_checks_audit_idx" ON "indexation_url_checks" ("audit_id");
CREATE INDEX IF NOT EXISTS "indexation_url_checks_url_idx" ON "indexation_url_checks" ("url");

CREATE TABLE IF NOT EXISTS "indexation_watch" (
  "id" bigserial PRIMARY KEY,
  "url" varchar(512) NOT NULL UNIQUE,
  "famille" varchar(32) NOT NULL,
  "pipeline" varchar(16) NOT NULL DEFAULT 'annonce',
  "pays" varchar(8),
  "langue" varchar(16),
  "creee_le" timestamp NOT NULL DEFAULT now(),
  "validee" boolean NOT NULL DEFAULT false,
  "seo_prepare" boolean NOT NULL DEFAULT false,
  "dans_sitemap" boolean NOT NULL DEFAULT false,
  "crawl_autorise" boolean NOT NULL DEFAULT false,
  "indexable" boolean NOT NULL DEFAULT false,
  "index_google" varchar(24) NOT NULL DEFAULT 'en_attente',
  "soumis_le" timestamp,
  "dernier_controle" timestamp,
  "dernier_motif" text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS "indexation_watch_famille_idx" ON "indexation_watch" ("famille");
CREATE INDEX IF NOT EXISTS "indexation_watch_statut_idx" ON "indexation_watch" ("index_google");
