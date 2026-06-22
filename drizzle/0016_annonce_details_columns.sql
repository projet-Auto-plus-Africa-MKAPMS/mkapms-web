-- Migration 0016: Ajout des colonnes détails véhicule sur annonces
-- (points_forts, equipements jsonb, imperfections, sellerie, cylindree,
--  consommation, classe_emission, confort, multimedia, securite, videos_360, videos_normales)

ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "points_forts" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "equipements" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "imperfections" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "sellerie" varchar(64);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "cylindree" varchar(64);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "consommation" varchar(64);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "classe_emission" varchar(32);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "confort" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "multimedia" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "securite" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "videos_360" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "videos_normales" jsonb DEFAULT '[]';
