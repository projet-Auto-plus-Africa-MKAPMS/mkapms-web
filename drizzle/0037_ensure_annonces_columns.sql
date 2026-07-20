-- Sécurité de déploiement — garantit que les colonnes JSONB critiques
-- d'annonces existent, avec un défaut safe `[]`. Rejouable N fois sans effet.
--
-- Cette migration existe en défense en profondeur : si `0033_annonces_garanties.sql`
-- a échoué silencieusement sur un environnement, cette migration corrige
-- immédiatement. Aucune donnée n'est perdue.

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "garanties" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "points_forts" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "equipements" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "imperfections" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "confort" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "multimedia" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "securite" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "videos360" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "videos_normales" jsonb DEFAULT '[]'::jsonb;

-- Remplace les NULL éventuels par des tableaux vides pour éviter tout
-- comportement inattendu côté frontend.
UPDATE "annonces" SET "garanties"      = '[]'::jsonb WHERE "garanties"      IS NULL;
UPDATE "annonces" SET "points_forts"   = '[]'::jsonb WHERE "points_forts"   IS NULL;
UPDATE "annonces" SET "equipements"    = '[]'::jsonb WHERE "equipements"    IS NULL;
UPDATE "annonces" SET "imperfections"  = '[]'::jsonb WHERE "imperfections"  IS NULL;
UPDATE "annonces" SET "confort"        = '[]'::jsonb WHERE "confort"        IS NULL;
UPDATE "annonces" SET "multimedia"     = '[]'::jsonb WHERE "multimedia"     IS NULL;
UPDATE "annonces" SET "securite"       = '[]'::jsonb WHERE "securite"       IS NULL;
UPDATE "annonces" SET "videos360"      = '[]'::jsonb WHERE "videos360"      IS NULL;
UPDATE "annonces" SET "videos_normales" = '[]'::jsonb WHERE "videos_normales" IS NULL;
