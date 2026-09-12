-- MKA.P-MS Investissement (server/investment/) — droit économique temporaire
-- univers + pays + durée. Distinct du "Mode Investisseurs" existant
-- (investorRouter, /investisseurs/*), qui reste un tableau de bord interne
-- de croissance/valorisation pour investisseurs en capital, jamais touché ici.

DO $$ BEGIN
  CREATE TYPE "investor_type" AS ENUM ('PASSIVE_INVESTOR', 'OPERATOR_INVESTOR', 'STRATEGIC_PARTNER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "investor_kyc_status" AS ENUM ('non_verifie', 'en_cours', 'verifie', 'refuse');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "investment_status" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'AWAITING_SIGNATURE', 'AWAITING_PAYMENT', 'ACTIVATING', 'ACTIVE', 'SUSPENDED', 'EXPIRING', 'EXPIRED', 'TERMINATED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "investment_pricing_model" AS ENUM ('fixed_price', 'revenue_share', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "investment_payout_frequency" AS ENUM ('hebdomadaire', 'mensuel', 'autre');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "investor_ledger_status" AS ENUM ('en_attente', 'disponible', 'verse', 'litige');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "investor_payout_status" AS ENUM ('en_attente', 'paye', 'echoue', 'annule');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Complète le type existant (server/modules/contracts.ts) : le contrat
-- d'investissement réutilise le Document OS déjà en place, jamais un
-- stockage de contrat dupliqué.
DO $$ BEGIN
  ALTER TYPE "contract_type" ADD VALUE IF NOT EXISTS 'investissement';
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "investor_organizations" (
  "id" bigserial PRIMARY KEY,
  "nom" varchar(192) NOT NULL,
  "proprietaire_user_id" integer NOT NULL,
  "kyb_status" "investor_kyc_status" NOT NULL DEFAULT 'non_verifie',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "investors" (
  "id" bigserial PRIMARY KEY,
  "user_id" integer NOT NULL UNIQUE,
  "investor_type" "investor_type" NOT NULL DEFAULT 'PASSIVE_INVESTOR',
  "organization_id" integer,
  "kyc_status" "investor_kyc_status" NOT NULL DEFAULT 'non_verifie',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "investments" (
  "id" bigserial PRIMARY KEY,
  "investor_id" integer NOT NULL,
  "organization_id" integer,
  "universe_id" varchar(64) NOT NULL,
  "country_code" varchar(2) NOT NULL,
  "contract_document_id" integer,
  "start_at" timestamp with time zone,
  "end_at" timestamp with time zone,
  "status" "investment_status" NOT NULL DEFAULT 'DRAFT',
  "exclusive" boolean NOT NULL DEFAULT true,
  "pricing_model" "investment_pricing_model" NOT NULL DEFAULT 'fixed_price',
  "fixed_price" numeric(14, 2),
  "revenue_share" numeric(6, 4),
  "currency" varchar(4) NOT NULL DEFAULT 'EUR',
  "payout_schedule" "investment_payout_frequency" NOT NULL DEFAULT 'mensuel',
  "created_by" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "investments_investor_idx" ON "investments" ("investor_id");
CREATE INDEX IF NOT EXISTS "investments_perimeter_idx" ON "investments" ("country_code", "universe_id", "status");

CREATE TABLE IF NOT EXISTS "investment_status_history" (
  "id" bigserial PRIMARY KEY,
  "investment_id" integer NOT NULL,
  "from_status" "investment_status",
  "to_status" "investment_status" NOT NULL,
  "motif" varchar(255),
  "changed_by" integer,
  "changed_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "investment_status_history_investment_idx" ON "investment_status_history" ("investment_id", "changed_at");

CREATE TABLE IF NOT EXISTS "investor_ledger" (
  "id" bigserial PRIMARY KEY,
  "investment_id" integer NOT NULL,
  "investor_id" integer NOT NULL,
  "country_code" varchar(2) NOT NULL,
  "universe_id" varchar(64) NOT NULL,
  "transaction_ref" varchar(128) NOT NULL UNIQUE,
  "montant_brut" numeric(14, 2) NOT NULL,
  "commission" numeric(14, 2) NOT NULL DEFAULT 0,
  "taxe" numeric(14, 2) NOT NULL DEFAULT 0,
  "remboursement" numeric(14, 2) NOT NULL DEFAULT 0,
  "montant_net" numeric(14, 2) NOT NULL,
  "devise" varchar(4) NOT NULL,
  "statut" "investor_ledger_status" NOT NULL DEFAULT 'en_attente',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "investor_ledger_investor_idx" ON "investor_ledger" ("investor_id", "created_at");

CREATE TABLE IF NOT EXISTS "investor_payouts" (
  "id" bigserial PRIMARY KEY,
  "investor_id" integer NOT NULL,
  "periode_debut" timestamp with time zone NOT NULL,
  "periode_fin" timestamp with time zone NOT NULL,
  "montant_brut" numeric(14, 2) NOT NULL,
  "deductions" numeric(14, 2) NOT NULL DEFAULT 0,
  "montant_net" numeric(14, 2) NOT NULL,
  "devise" varchar(4) NOT NULL,
  "statut" "investor_payout_status" NOT NULL DEFAULT 'en_attente',
  "reference" varchar(128),
  "preuve_url" varchar(512),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "investor_payouts_investor_idx" ON "investor_payouts" ("investor_id", "periode_debut");
