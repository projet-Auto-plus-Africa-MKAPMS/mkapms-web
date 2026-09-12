-- Corrige 0111 après revue : supprime le statut KYC/KYB dupliqué (le vrai
-- moteur kycProfiles/kycDocuments, server/schema.ts, reste la seule source
-- de vérité — investors.user_id / investor_organizations.proprietaire_user_id
-- y pointent directement, voir server/investment/kyc.ts) et complète
-- investor_payouts avec les champs minimums exigés (investment_id,
-- contract_document_id, dates prévue/réelle, échec/tentatives, historique).

ALTER TABLE "investors" DROP COLUMN IF EXISTS "kyc_status";
ALTER TABLE "investor_organizations" DROP COLUMN IF EXISTS "kyb_status";

DO $$ BEGIN
  DROP TYPE "investor_kyc_status";
EXCEPTION WHEN dependent_objects_still_exist OR undefined_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "investor_payout_status" ADD VALUE IF NOT EXISTS 'litige';
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Table encore vide (créée par 0111, jamais peuplée avant ce correctif) :
-- investment_id/date_prevue peuvent donc être NOT NULL dès cette migration,
-- comme dans server/investment/schema.ts — aucune ligne existante à violer.
ALTER TABLE "investor_payouts"
  ADD COLUMN IF NOT EXISTS "investment_id" integer NOT NULL,
  ADD COLUMN IF NOT EXISTS "contract_document_id" integer,
  ADD COLUMN IF NOT EXISTS "date_prevue" timestamp with time zone NOT NULL,
  ADD COLUMN IF NOT EXISTS "date_reelle" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "motif_echec" varchar(255),
  ADD COLUMN IF NOT EXISTS "tentatives" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "investor_payouts_investment_idx" ON "investor_payouts" ("investment_id");

CREATE TABLE IF NOT EXISTS "investor_payout_history" (
  "id" bigserial PRIMARY KEY,
  "payout_id" integer NOT NULL,
  "from_status" "investor_payout_status",
  "to_status" "investor_payout_status" NOT NULL,
  "motif" varchar(255),
  "changed_by" integer,
  "changed_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "investor_payout_history_payout_idx" ON "investor_payout_history" ("payout_id", "changed_at");
