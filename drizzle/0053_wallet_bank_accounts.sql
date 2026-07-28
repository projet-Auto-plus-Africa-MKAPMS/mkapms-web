-- Migration 0053 : table bank_accounts pour les comptes bancaires liés aux wallets
CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "titulaire" varchar(255) NOT NULL,
  "iban" varchar(64) NOT NULL,
  "bic" varchar(16),
  "banque" varchar(128),
  "is_default" boolean NOT NULL DEFAULT false,
  "stripe_bank_account_id" varchar(128),
  "verified" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "bank_accounts_user_idx" ON "bank_accounts" ("user_id");
