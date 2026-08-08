-- MKA.P-MS Pro Account Engine — dossier professionnel avant activation.
-- Les exigences (champs + justificatifs) vivent en base par pays et par
-- métier : ajouter un pays ne demande aucune reconstruction du portail.
-- L'état du dossier et l'état du paiement sont deux colonnes distinctes :
-- l'activation n'est jamais déduite de l'une par l'autre.
-- Additif : aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "pro_account_rules" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"profession_code" varchar(48),
	"required_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_docs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"registration_label" varchar(80),
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "pro_account_rules_country_idx" ON "pro_account_rules" ("country_code","profession_code");

CREATE TABLE IF NOT EXISTS "pro_account_applications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_key" varchar(64),
	"profession_code" varchar(48) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"module_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_first_name" varchar(80),
	"contact_last_name" varchar(80),
	"contact_email" varchar(190),
	"contact_phone" varchar(32),
	"legal_name" varchar(190),
	"legal_form" varchar(80),
	"registration_number" varchar(64),
	"vat_number" varchar(40),
	"address_line" varchar(190),
	"city" varchar(120),
	"postal_code" varchar(20),
	"website" varchar(190),
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"terms_accepted_at" timestamp,
	"status" varchar(24) DEFAULT 'brouillon' NOT NULL,
	"payment_status" varchar(16) DEFAULT 'en_attente' NOT NULL,
	"payment_reference" varchar(120),
	"review_note" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"submitted_at" timestamp,
	"activated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "pro_account_applications_user_idx" ON "pro_account_applications" ("user_id");
CREATE INDEX IF NOT EXISTS "pro_account_applications_status_idx" ON "pro_account_applications" ("status","updated_at");
CREATE INDEX IF NOT EXISTS "pro_account_applications_country_idx" ON "pro_account_applications" ("country_code","profession_code");
