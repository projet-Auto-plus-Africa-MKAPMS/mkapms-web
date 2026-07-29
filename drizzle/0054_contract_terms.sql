-- Phase 45 — Contrat OS : cycle de vie des contrats (durée, renouvellement,
-- expiration, résiliation, historique) au-dessus de generated_documents.
CREATE TABLE IF NOT EXISTS "contract_terms" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "document_id" integer NOT NULL,
  "party" varchar(32) NOT NULL,
  "counterparty_name" varchar(192),
  "start_at" timestamp with time zone,
  "end_at" timestamp with time zone,
  "renewal_months" integer,
  "auto_renew" boolean NOT NULL DEFAULT false,
  "status" varchar(16) NOT NULL DEFAULT 'actif',
  "terminated_at" timestamp with time zone,
  "termination_reason" varchar(255),
  "created_by" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "contract_terms_document_idx" ON "contract_terms" ("document_id");
CREATE INDEX IF NOT EXISTS "contract_terms_expiry_idx" ON "contract_terms" ("status", "end_at");
