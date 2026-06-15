-- Migration 0012: Dépôt-Vente + devisType column
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "depot_vente_status" AS ENUM ('demande', 'expertise', 'accepte', 'photos_en_cours', 'en_ligne', 'negociation', 'vendu', 'paiement_client', 'termine', 'refuse', 'annule'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "depot_vente" (
  "id" serial PRIMARY KEY,
  "client_id" integer NOT NULL,
  "marque" varchar(64) NOT NULL,
  "modele" varchar(128) NOT NULL,
  "annee" integer,
  "immatriculation" varchar(32),
  "vin" varchar(32),
  "kilometrage" integer,
  "carburant" varchar(32),
  "boite_vitesse" varchar(32),
  "couleur" varchar(32),
  "description" text,
  "prix_souhaite" numeric(12, 2),
  "prix_expertise" numeric(12, 2),
  "prix_vente_effectif" numeric(12, 2),
  "commission_pct" numeric(5, 2) DEFAULT '10.00',
  "commission_montant" numeric(12, 2),
  "photos" text,
  "status" "depot_vente_status" NOT NULL DEFAULT 'demande',
  "annonce_id" integer,
  "agent_id" integer,
  "site_id" integer,
  "notes" text,
  "date_depot" timestamp,
  "date_vente" timestamp,
  "date_paiement" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "devis_garage_requests" ADD COLUMN IF NOT EXISTS "devis_type" varchar(32) DEFAULT 'main_oeuvre';
