-- Migration 0052 : ajout colonnes SIREN, TVA et logo professionnel sur la table users
-- Toutes les colonnes sont optionnelles (nullable) pour ne pas casser les lignes existantes.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "company_siren" varchar(16),
  ADD COLUMN IF NOT EXISTS "has_vat" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "vat_number" varchar(32);
