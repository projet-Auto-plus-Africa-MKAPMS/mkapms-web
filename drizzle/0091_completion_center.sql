-- Points 119-120-121 — règle TERMINÉ, rapports obligatoires, Completion Center.
-- Tables isolées, préfixe cp_. Aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "cp_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "trigger" varchar(24) DEFAULT 'manuel' NOT NULL,
  "requested_by" integer,
  "domaines" integer DEFAULT 0 NOT NULL,
  "termines" integer DEFAULT 0 NOT NULL,
  "avancement" integer DEFAULT 0 NOT NULL,
  "detail" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "cp_domain_verdicts" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "domaine" varchar(48) NOT NULL,
  "label" varchar(160) NOT NULL,
  "termine" boolean DEFAULT false NOT NULL,
  "avancement" integer DEFAULT 0 NOT NULL,
  "maillons" jsonb DEFAULT '{}'::jsonb,
  "manquant" jsonb DEFAULT '[]'::jsonb,
  "dependances_manquantes" jsonb DEFAULT '[]'::jsonb,
  "restant" jsonb DEFAULT '[]'::jsonb,
  "motif" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cp_work_reports" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "tache" text NOT NULL,
  "domaine" varchar(48),
  "existant" text DEFAULT '' NOT NULL,
  "modifie" text DEFAULT '' NOT NULL,
  "active" text DEFAULT '' NOT NULL,
  "moteurs_connectes" jsonb DEFAULT '[]'::jsonb,
  "tests_executes" integer DEFAULT 0 NOT NULL,
  "tests_reussis" integer DEFAULT 0 NOT NULL,
  "regressions" jsonb DEFAULT '[]'::jsonb,
  "dependances_manquantes" jsonb DEFAULT '[]'::jsonb,
  "seo_concerne" text DEFAULT '' NOT NULL,
  "pays_concernes" jsonb DEFAULT '[]'::jsonb,
  "paiement_concerne" boolean DEFAULT false NOT NULL,
  "systeme_informe" boolean DEFAULT false NOT NULL,
  "rollback_disponible" boolean DEFAULT false NOT NULL,
  "statut_final" varchar(16) DEFAULT 'pas_termine' NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "auteur" varchar(64) DEFAULT 'agent' NOT NULL,
  "requested_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cp_domain_verdicts_snapshot_idx" ON "cp_domain_verdicts" ("snapshot_id");
CREATE INDEX IF NOT EXISTS "cp_domain_verdicts_domaine_idx" ON "cp_domain_verdicts" ("domaine");
CREATE INDEX IF NOT EXISTS "cp_work_reports_domaine_idx" ON "cp_work_reports" ("domaine", "created_at");
CREATE INDEX IF NOT EXISTS "cp_work_reports_statut_idx" ON "cp_work_reports" ("statut_final");
