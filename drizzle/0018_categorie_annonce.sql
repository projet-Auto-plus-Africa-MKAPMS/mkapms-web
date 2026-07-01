-- Catégorie d'annonce : officielle MKA.P-MS / professionnelle / particulier
DO $$ BEGIN
  CREATE TYPE "categorie_annonce" AS ENUM ('officielle', 'professionnelle', 'particulier');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "categorie_annonce" "categorie_annonce" NOT NULL DEFAULT 'particulier';
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "created_by_employee_id" integer;
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "on_behalf_of_user_id" integer;

-- Back-fill existing annonces based on ownership/vendeurType
UPDATE "annonces" SET "categorie_annonce" = 'officielle' WHERE "ownership" = 'plateforme';
UPDATE "annonces" SET "categorie_annonce" = 'professionnelle' WHERE "vendeur_type" IN ('professionnel', 'concession') AND "ownership" != 'plateforme';
