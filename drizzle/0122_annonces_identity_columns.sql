-- Ajoute vin/plaque à `annonces` (nullable, 100 % additif).
-- Déjà lues par server/smart-engine/services/duplicate-detection.ts mais
-- absentes du schéma jusqu'ici : 2 de ses 3 règles de détection de doublon
-- restaient inertes. Alimentées par le Vehicle Engine (LOT 2) à la
-- publication d'un véhicule fournisseur.
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "vin" varchar(17);
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "plaque" varchar(16);
