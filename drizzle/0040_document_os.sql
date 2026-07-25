-- Document OS — Fondations (règle MOS #15, additive pure).
-- Aucune modification des tables existantes (devis, factures, invoices,
-- quotes, devisItems, contrats, etc.). Le moteur AJOUTE un registre des
-- types de documents, des templates multi-langues et un journal unifié.

CREATE TABLE IF NOT EXISTS "doc_types" (
  "code" varchar(48) PRIMARY KEY,       -- facture, contrat, devis, bon_commande, attestation, cgv, ...
  "label_fr" varchar(120) NOT NULL,
  "label_en" varchar(120),
  "category" varchar(32) NOT NULL,      -- commerce, legal, comptable, ...
  "requires_signature" boolean NOT NULL DEFAULT false,
  "legal_retention_years" integer NOT NULL DEFAULT 10,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "doc_types" ("code","label_fr","label_en","category","requires_signature","legal_retention_years") VALUES
  ('facture','Facture','Invoice','commerce',false,10),
  ('facture_avoir','Facture d''avoir','Credit note','commerce',false,10),
  ('devis','Devis','Quote','commerce',false,3),
  ('bon_commande','Bon de commande','Purchase order','commerce',false,10),
  ('contrat_vente','Contrat de vente','Sale contract','legal',true,30),
  ('contrat_location','Contrat de location','Rental contract','legal',true,10),
  ('cgv','Conditions générales de vente','Terms of sale','legal',false,10),
  ('cgu','Conditions générales d''utilisation','Terms of use','legal',false,10),
  ('mandat_vente','Mandat de vente','Sale mandate','legal',true,10),
  ('attestation','Attestation','Statement','legal',false,10),
  ('rapport_expertise','Rapport d''expertise','Expertise report','commerce',false,10),
  ('bon_livraison','Bon de livraison','Delivery note','commerce',false,10),
  ('proces_verbal','Procès-verbal','Report','legal',true,30)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS "doc_templates" (
  "id" serial PRIMARY KEY,
  "type_code" varchar(48) NOT NULL,
  "language" varchar(8) NOT NULL,
  "country_code" varchar(2),           -- NULL = universel
  "html_body" text NOT NULL,
  "variables" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "doc_templates_unique" UNIQUE ("type_code","language","country_code")
);
CREATE INDEX IF NOT EXISTS "doc_templates_type_idx" ON "doc_templates" ("type_code");

CREATE TABLE IF NOT EXISTS "doc_documents" (
  "id" bigserial PRIMARY KEY,
  "reference" varchar(64) NOT NULL UNIQUE,   -- numéro visible (FAC-2026-000123)
  "type_code" varchar(48) NOT NULL,
  "language" varchar(8) NOT NULL DEFAULT 'fr',
  "country_code" varchar(2),
  "owner_user_id" integer,
  "counterparty_user_id" integer,
  "linked_entity_type" varchar(32),          -- "annonce","location","vente",...
  "linked_entity_id" integer,
  "amount_ht" numeric(14,2),
  "amount_ttc" numeric(14,2),
  "currency" varchar(4),
  "status" varchar(16) NOT NULL DEFAULT 'brouillon', -- brouillon|émis|signé|annulé|archivé
  "issued_at" timestamptz,
  "signed_at" timestamptz,
  "cancelled_at" timestamptz,
  "storage_key" varchar(255),                -- clé S3/GCS/local
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "doc_documents_type_status_idx" ON "doc_documents" ("type_code","status");
CREATE INDEX IF NOT EXISTS "doc_documents_owner_idx" ON "doc_documents" ("owner_user_id");
CREATE INDEX IF NOT EXISTS "doc_documents_created_idx" ON "doc_documents" ("created_at" DESC);

CREATE TABLE IF NOT EXISTS "doc_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
