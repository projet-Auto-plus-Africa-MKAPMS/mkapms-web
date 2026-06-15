-- Migration 0014: Démarches Carte Grise / SIV
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cg_dossier_type" AS ENUM ('declaration_achat','declaration_cession','changement_titulaire','carte_grise','vehicule_etranger','ww_cpi','w_garage','duplicata','correction','autre'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cg_dossier_status" AS ENUM ('brouillon','documents_a_verifier','en_verification','documents_valides','document_manquant','document_refuse','renvoye','envoye_agence','en_traitement','accepte','bloque','termine','annule','archive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cg_doc_status" AS ENUM ('recu','en_verification','valide','refuse','manquant','renvoye','expire'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cg_agence_status" AS ENUM ('en_attente','documents_soumis','en_verification','validee','refusee','suspendue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cg_audit_action" AS ENUM ('creation_dossier','ajout_document','validation_document','refus_document','remplacement_document','changement_statut','affectation_agence','note_ajoutee','notification_envoyee','cloture_dossier','suppression_document','modification_dossier'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_dossiers" (
  "id" serial PRIMARY KEY,
  "reference" varchar(32) NOT NULL,
  "type" "cg_dossier_type" NOT NULL,
  "status" "cg_dossier_status" NOT NULL DEFAULT 'brouillon',
  "immatriculation" varchar(32),
  "vin" varchar(32),
  "marque" varchar(64),
  "modele" varchar(128),
  "annee" integer,
  "client_id" integer,
  "vo_vehicule_id" integer,
  "annonce_id" integer,
  "agence_id" integer,
  "vendeur_nom" varchar(128),
  "vendeur_id" integer,
  "acheteur_nom" varchar(128),
  "acheteur_id" integer,
  "montant_taxe" numeric(10,2),
  "montant_prestation" numeric(10,2),
  "commission_mkapms" numeric(10,2),
  "facture_id" integer,
  "notes" text,
  "date_creation" timestamp NOT NULL DEFAULT now(),
  "date_cloture" timestamp,
  "created_by" integer,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_documents" (
  "id" serial PRIMARY KEY,
  "dossier_id" integer NOT NULL,
  "type" varchar(64) NOT NULL,
  "nom" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "mime_type" varchar(64),
  "taille" integer,
  "status" "cg_doc_status" NOT NULL DEFAULT 'recu',
  "motif_refus" text,
  "remplace_par_id" integer,
  "verifiee_par" integer,
  "date_verification" timestamp,
  "uploaded_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_agences" (
  "id" serial PRIMARY KEY,
  "nom" varchar(255) NOT NULL,
  "siret" varchar(32),
  "adresse" text,
  "code_postal" varchar(10),
  "ville" varchar(128),
  "telephone" varchar(32),
  "email" varchar(255),
  "site_web" varchar(255),
  "responsable_id" integer NOT NULL,
  "kbis_url" text,
  "identite_dirigeant_url" text,
  "justificatif_domicile_url" text,
  "assurance_pro_url" text,
  "habilitation_siv_url" text,
  "agrement_url" text,
  "status" "cg_agence_status" NOT NULL DEFAULT 'en_attente',
  "valide_par" integer,
  "date_validation" timestamp,
  "dossiers_traites" integer DEFAULT 0,
  "note_qualite" numeric(3,1),
  "active" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_agence_membres" (
  "id" serial PRIMARY KEY,
  "agence_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" varchar(32) NOT NULL DEFAULT 'agent',
  "actif" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_abonnements" (
  "id" serial PRIMARY KEY,
  "code" varchar(32) NOT NULL,
  "nom" varchar(128) NOT NULL,
  "prix_ht" numeric(10,2) NOT NULL,
  "prix_ttc" numeric(10,2) NOT NULL,
  "dossiers_mois" integer NOT NULL,
  "features" jsonb,
  "actif" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_packs" (
  "id" serial PRIMARY KEY,
  "nom" varchar(128) NOT NULL,
  "nb_dossiers" integer NOT NULL,
  "prix_ht" numeric(10,2) NOT NULL,
  "prix_ttc" numeric(10,2) NOT NULL,
  "actif" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_credits" (
  "id" serial PRIMARY KEY,
  "agence_id" integer NOT NULL,
  "credits_restants" integer NOT NULL DEFAULT 0,
  "abonnement_id" integer,
  "pack_id" integer,
  "date_expiration" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_etapes" (
  "id" serial PRIMARY KEY,
  "dossier_id" integer NOT NULL,
  "status" "cg_dossier_status" NOT NULL,
  "status_label" varchar(128) NOT NULL,
  "commentaire" text,
  "responsable" varchar(128),
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cg_audit_log" (
  "id" serial PRIMARY KEY,
  "dossier_id" integer,
  "action" "cg_audit_action" NOT NULL,
  "detail" text,
  "document_id" integer,
  "user_id" integer NOT NULL,
  "user_email" varchar(255),
  "ip_address" varchar(64),
  "user_agent" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
