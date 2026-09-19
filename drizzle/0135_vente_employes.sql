-- Vente Pro — équipe du vendeur (Commercial, Comptable, Mécanicien…),
-- distincte de l'organigramme interne MKA.P-MS (staffProfiles). Additif pur.
-- `permissions` porte les droits par module édités depuis DroitsAcces.tsx.

CREATE TABLE IF NOT EXISTS "vente_employes" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "nom" varchar(255) NOT NULL,
  "poste" varchar(64),
  "email" varchar(255),
  "telephone" varchar(32),
  "actif" boolean NOT NULL DEFAULT true,
  "permissions" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
