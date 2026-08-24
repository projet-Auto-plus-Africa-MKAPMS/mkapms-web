-- Suppression de compte — demandes tracées.
-- Exigence de publication mobile (Google Play, App Store) et droit du titulaire :
-- une suppression doit être possible, datée et vérifiable. Aucune table
-- existante n'est modifiée : la suppression efface l'identité sur `users` et
-- n'a donc pas besoin de nouvelle colonne.

CREATE TABLE IF NOT EXISTS "ad_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "email" varchar(255) NOT NULL,
  "origine" varchar(24) DEFAULT 'compte_connecte' NOT NULL,
  "statut" varchar(24) DEFAULT 'recue' NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "effets" jsonb,
  "decision" text DEFAULT '' NOT NULL,
  "traitee_par" integer,
  "traitee_le" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ad_requests_email_idx" ON "ad_requests" ("email");
CREATE INDEX IF NOT EXISTS "ad_requests_statut_idx" ON "ad_requests" ("statut");
