-- Point 91 — Audit d'activation général.
-- Tables isolées (préfixe activation_) : aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "activation_audit_runs" (
  "id" serial PRIMARY KEY,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "finished_at" timestamp,
  "trigger" varchar(24) NOT NULL DEFAULT 'manuel',
  "requested_by" integer,
  "total" integer NOT NULL DEFAULT 0,
  "par_etat" jsonb DEFAULT '{}'::jsonb,
  "couverture" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "activation_audit_items" (
  "id" bigserial PRIMARY KEY,
  "run_id" integer NOT NULL,
  "domain" varchar(64) NOT NULL,
  "label" varchar(160) NOT NULL,
  "category" varchar(32) NOT NULL DEFAULT 'inconnu',
  "existe" boolean NOT NULL DEFAULT false,
  "connecte" boolean NOT NULL DEFAULT false,
  "active" boolean NOT NULL DEFAULT false,
  "accessible" boolean NOT NULL DEFAULT false,
  "teste" boolean NOT NULL DEFAULT false,
  "utilise" boolean NOT NULL DEFAULT false,
  "moteur_connecte" boolean NOT NULL DEFAULT false,
  "systeme_intelligent_connecte" boolean NOT NULL DEFAULT false,
  "etat" varchar(24) NOT NULL,
  "motif" text NOT NULL DEFAULT '',
  "preuves" jsonb DEFAULT '{}'::jsonb,
  "manquant" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "activation_audit_items_run_idx" ON "activation_audit_items" ("run_id");
CREATE INDEX IF NOT EXISTS "activation_audit_items_domain_idx" ON "activation_audit_items" ("domain");

-- Preuves de test : seule source pouvant rendre un domaine « testé ».
CREATE TABLE IF NOT EXISTS "activation_test_evidence" (
  "id" bigserial PRIMARY KEY,
  "domain" varchar(64) NOT NULL,
  "kind" varchar(24) NOT NULL DEFAULT 'integration',
  "scenario" varchar(255) NOT NULL,
  "passed" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL DEFAULT 0,
  "success" boolean NOT NULL DEFAULT false,
  "detail" text,
  "source" varchar(64) NOT NULL DEFAULT 'continuous-test-engine',
  "recorded_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "activation_test_evidence_domain_idx" ON "activation_test_evidence" ("domain");
