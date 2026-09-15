-- LOT 5 du Plan Maître Fournisseurs (paiements) — Payout Engine (§32) et
-- extension du Ledger existant (§29, `wallets`/`payouts`/`bank_accounts`/
-- `wallet_transactions`, server/modules/wallet.ts).
--
-- Audit préalable (obligatoire avant tout LOT) : le schéma Drizzle de ces
-- quatre tables déclarait déjà plusieurs colonnes que la base réelle n'a
-- jamais reçues (dérive schéma/DB du même type que celle corrigée en LOT 3
-- pour `parts_stock`, drizzle/0124_parts_stock_columns_fix.sql) :
--   - wallets : next_payout_date, total_encaisse, total_vire absents ;
--   - payouts : bank_account_id, frais, note, processed_at absents ;
--   - bank_accounts : wallet_id absent, et la colonne existait sous le nom
--     stripe_bank_account_id alors que schema.ts/routers/wallet.ts
--     référencent stripe_external_account_id ;
--   - wallet_transactions : source_type, source_id absents.
-- Ces quatre tables étaient vides (0 ligne) au moment de l'audit : correction
-- directe, sans risque de perte de donnée réelle. Sans ce correctif, le
-- Ledger existant (routers/wallet.ts) échouait déjà silencieusement sur
-- addBankAccount/setPayoutFrequency/adminUpdatePayoutStatus/adminCreditWallet.

CREATE TYPE "wallet_owner_type" AS ENUM ('user', 'supplier', 'carrier', 'platform');

ALTER TABLE "wallets"
  ADD COLUMN IF NOT EXISTS "owner_type" "wallet_owner_type" NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "supplier_profile_id" integer,
  ADD COLUMN IF NOT EXISTS "carrier_code" varchar(32),
  ADD COLUMN IF NOT EXISTS "next_payout_date" timestamp,
  ADD COLUMN IF NOT EXISTS "total_encaisse" numeric(14, 2) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS "total_vire" numeric(14, 2) NOT NULL DEFAULT '0';
ALTER TABLE "wallets" ALTER COLUMN "user_id" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "wallets_owner_idx" ON "wallets" ("owner_type", "user_id", "supplier_profile_id", "carrier_code");
--> statement-breakpoint

ALTER TABLE "payouts"
  ADD COLUMN IF NOT EXISTS "bank_account_id" integer,
  ADD COLUMN IF NOT EXISTS "frais" numeric(10, 2) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS "note" text,
  ADD COLUMN IF NOT EXISTS "processed_at" timestamp;
--> statement-breakpoint

ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "wallet_id" integer;
ALTER TABLE "bank_accounts" RENAME COLUMN "stripe_bank_account_id" TO "stripe_external_account_id";
ALTER TABLE "bank_accounts" ALTER COLUMN "wallet_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "source_type" varchar(64),
  ADD COLUMN IF NOT EXISTS "source_id" integer;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "payout_policies" (
  "id" serial PRIMARY KEY NOT NULL,
  "target_type" varchar(16) NOT NULL,
  "supplier_profile_id" integer,
  "carrier_code" varchar(32),
  "contract_ref" varchar(64),
  "split_code" varchar(32) NOT NULL,
  "stages" jsonb NOT NULL,
  "requires_human_validation" boolean DEFAULT true NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payout_policies_target_idx" ON "payout_policies" ("target_type","supplier_profile_id","carrier_code","active");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "payout_schedules" (
  "id" serial PRIMARY KEY NOT NULL,
  "policy_id" integer,
  "source_type" varchar(32) NOT NULL,
  "source_id" integer NOT NULL,
  "target_type" varchar(16) NOT NULL,
  "supplier_profile_id" integer,
  "carrier_code" varchar(32),
  "target_wallet_id" integer NOT NULL,
  "gross_amount" numeric(14, 2) NOT NULL,
  "commission_rate_pct" numeric(6, 3) DEFAULT '0' NOT NULL,
  "commission_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
  "net_amount" numeric(14, 2) NOT NULL,
  "currency" varchar(4) DEFAULT 'EUR' NOT NULL,
  "stages" jsonb NOT NULL,
  "status" varchar(16) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payout_schedules_source_idx" ON "payout_schedules" ("source_type","source_id");
CREATE INDEX IF NOT EXISTS "payout_schedules_target_idx" ON "payout_schedules" ("target_type","supplier_profile_id","carrier_code");
CREATE INDEX IF NOT EXISTS "payout_schedules_status_idx" ON "payout_schedules" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "payout_audit_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "schedule_id" integer,
  "action" varchar(48) NOT NULL,
  "actor_id" integer,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payout_audit_log_schedule_idx" ON "payout_audit_log" ("schedule_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "payout_health_log" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
