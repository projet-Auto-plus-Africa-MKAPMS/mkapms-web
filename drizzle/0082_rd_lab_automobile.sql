-- Points 79-80-81-82 — MKA.P-MS AUTOMOTIVE R&D LAB.
-- Migration strictement additive : aucune table existante n'est modifiée.
-- Le laboratoire vit dans ses propres tables `rd_*`, séparées des services
-- commerciaux. La mémoire automobile reste celle du graphe `ake_*` : un actif
-- n'y est versé que si son droit d'usage est établi (point 82).

CREATE TABLE IF NOT EXISTS "rd_projects" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "code" varchar(48) NOT NULL UNIQUE,
  "title" varchar(240) NOT NULL,
  "branch" varchar(32) NOT NULL,
  "domain" varchar(48) NOT NULL,
  "objective" text NOT NULL,
  "country_code" varchar(4),
  "confidentiality" varchar(16) DEFAULT 'confidentiel' NOT NULL,
  "status" varchar(12) DEFAULT 'etude' NOT NULL,
  "notes" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rd_projects_branch_idx" ON "rd_projects" ("branch", "status");
CREATE INDEX IF NOT EXISTS "rd_projects_country_idx" ON "rd_projects" ("country_code");

CREATE TABLE IF NOT EXISTS "rd_chain_links" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL,
  "link" varchar(32) NOT NULL,
  "signature" varchar(120) NOT NULL UNIQUE,
  "content" text NOT NULL,
  "evidence" text,
  "node_id" integer,
  "status" varchar(16) DEFAULT 'a_confirmer' NOT NULL,
  "updated_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rd_chain_links_project_idx" ON "rd_chain_links" ("project_id", "link");

CREATE TABLE IF NOT EXISTS "rd_assets" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "title" varchar(240) NOT NULL,
  "branch" varchar(32) NOT NULL,
  "domain" varchar(48) NOT NULL,
  "summary" text,
  "data_class" varchar(20) NOT NULL,
  "license" varchar(24) DEFAULT 'inconnue' NOT NULL,
  "license_ref" text,
  "source_label" varchar(160),
  "source_ref" text,
  "supplier" varchar(160),
  "country_code" varchar(4),
  "project_id" integer,
  "shareable" boolean DEFAULT false NOT NULL,
  "node_id" integer,
  "blocked_reason" text,
  "declared_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rd_assets_class_idx" ON "rd_assets" ("data_class", "shareable");
CREATE INDEX IF NOT EXISTS "rd_assets_project_idx" ON "rd_assets" ("project_id");
CREATE INDEX IF NOT EXISTS "rd_assets_created_idx" ON "rd_assets" ("created_at");

CREATE TABLE IF NOT EXISTS "rd_ecosystem_snapshots" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "country_code" varchar(4) NOT NULL,
  "counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "missing" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rd_ecosystem_country_idx" ON "rd_ecosystem_snapshots" ("country_code", "created_at");
