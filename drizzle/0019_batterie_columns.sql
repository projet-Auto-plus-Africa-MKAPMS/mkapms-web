-- Batterie / énergie — colonnes optionnelles pour véhicules électriques/hybrides
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "type_batterie" varchar(32);
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "etat_batterie" integer;
