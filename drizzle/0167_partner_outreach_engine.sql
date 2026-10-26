-- Partner Outreach Engine — registre de prospection à froid (mission
-- Direction 26/10). Couvre l'étape qui manquait entre "liste de contacts
-- approchés" et les moteurs existants (partner-engine : candidatures
-- entrantes ; supplier-engine : fiches fournisseur déjà en onboarding).
-- Aucune table existante modifiée ou supprimée.

CREATE TABLE IF NOT EXISTS "outreach_contacts" (
  "id" serial PRIMARY KEY,
  "reference" varchar(24) NOT NULL UNIQUE,
  "email" varchar(255) NOT NULL UNIQUE,
  "domain" varchar(160),
  "company_name" varchar(200),
  "country" varchar(80),
  "city" varchar(120),
  "phone" varchar(32),
  "website" varchar(255),
  "category" varchar(32),
  "capacities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "zones_desservies" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "langues" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "modele_commercial" varchar(16),
  "documents" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "licences" text,
  "assurances" text,
  "conditions_commerciales" text,
  "status" varchar(24) NOT NULL DEFAULT 'identifie',
  "email_sent_at" timestamp,
  "email_delivery_confirmed" boolean NOT NULL DEFAULT false,
  "email_bounced" boolean NOT NULL DEFAULT false,
  "response_received_at" timestamp,
  "response_summary" text,
  "qualification_note" text,
  "draft_reply_text" text,
  "promoted_to_application_id" integer,
  "promoted_to_supplier_profile_id" integer,
  "source" varchar(32) NOT NULL DEFAULT 'campagne_26_10',
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "outreach_contacts_status_idx" ON "outreach_contacts" ("status", "category");
CREATE INDEX IF NOT EXISTS "outreach_contacts_domain_idx" ON "outreach_contacts" ("domain");
CREATE INDEX IF NOT EXISTS "outreach_contacts_country_idx" ON "outreach_contacts" ("country");

CREATE TABLE IF NOT EXISTS "outreach_status_log" (
  "id" bigserial PRIMARY KEY,
  "outreach_contact_id" integer NOT NULL,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "from_status" varchar(24),
  "to_status" varchar(24),
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "outreach_status_log_contact_idx" ON "outreach_status_log" ("outreach_contact_id", "created_at");

CREATE TABLE IF NOT EXISTS "outreach_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
