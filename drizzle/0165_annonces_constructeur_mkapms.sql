ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "est_constructeur_mkapms" boolean NOT NULL DEFAULT false;
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "constructeur_fiche_technique" text;
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "constructeur_disponibilite" varchar(120);
ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "constructeur_entretien_services" text;
