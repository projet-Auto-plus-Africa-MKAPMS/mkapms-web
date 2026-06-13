-- Migration 0013: VO Interne + Comptabilité + Cabinets Comptables
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "vo_status" AS ENUM ('achat_enregistre','en_attente_recuperation','en_cours_transport','vehicule_recu','diagnostic_en_cours','diagnostic_termine','en_attente_pieces','en_reparation','reparation_terminee','controle_final','preparation_esthetique','pret','en_vente','en_location','vendu','loue','exporte','stock_interne','a_revoir','archive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "vo_mode_achat" AS ENUM ('auto1','fournisseur','particulier','pro','enchere','depot_vente','autre'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "vo_destination" AS ENUM ('vente','location','vente_directe','export_africa','stock_interne','a_revoir'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "vo_diag_result" AS ENUM ('ok','a_reparer','a_controler','piece_a_commander'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "vo_doc_category" AS ENUM ('facture_achat','bon_commande','certificat_cession','carte_grise','controle_technique','photo_achat','preuve_paiement','facture_transport','bon_enlevement','bon_livraison','rapport_diagnostic','photo_defaut','devis_interne','facture_piece','bon_commande_piece','photo_avant_reparation','photo_apres_reparation','facture_lavage','photo_avant_lavage','photo_apres_lavage','facture_vente','contrat_vente','piece_identite_acheteur','contrat_location','assurance','etat_lieux','autre'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "compta_type" AS ENUM ('achat_vehicule','vente_vehicule','facture_fournisseur','facture_client','depense','remboursement','abonnement','commission','salaire','tva','transport','reparation','piece','lavage','autre'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "compta_doc_type" AS ENUM ('facture','recu','bon_commande','avoir','devis','releve','contrat','photo','scan','autre'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "compta_statut" AS ENUM ('brouillon','a_valider','valide','paye','en_retard','annule','rembourse','archive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cabinet_role" AS ENUM ('expert_comptable','collaborateur','assistant','stagiaire'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vo_vehicules" (
  "id" serial PRIMARY KEY,
  "immatriculation" varchar(32),
  "vin" varchar(32),
  "marque" varchar(64) NOT NULL,
  "modele" varchar(128) NOT NULL,
  "version" varchar(128),
  "annee" integer,
  "kilometrage" integer,
  "kilometrage_reception" integer,
  "carburant" varchar(32),
  "boite_vitesse" varchar(32),
  "couleur" varchar(32),
  "puissance" varchar(32),
  "niveau_carburant" varchar(16),
  "etat_carrosserie" varchar(32),
  "etat_interieur" varchar(32),
  "prix_achat" numeric(12,2),
  "fournisseur" varchar(128),
  "mode_achat" "vo_mode_achat",
  "date_achat" timestamp,
  "lieu_achat" varchar(255),
  "cout_transport" numeric(10,2),
  "transporteur" varchar(128),
  "adresse_depart" varchar(255),
  "adresse_arrivee" varchar(255),
  "date_recup_prevue" timestamp,
  "date_reception" timestamp,
  "responsable_transport" varchar(128),
  "cout_reparation" numeric(12,2) DEFAULT '0',
  "cout_pieces" numeric(12,2) DEFAULT '0',
  "cout_main_oeuvre" numeric(12,2) DEFAULT '0',
  "cout_lavage" numeric(12,2) DEFAULT '0',
  "cout_total" numeric(12,2) DEFAULT '0',
  "destination" "vo_destination",
  "prix_vente" numeric(12,2),
  "prix_vente_effectif" numeric(12,2),
  "marge_brute" numeric(12,2),
  "marge_nette" numeric(12,2),
  "date_vente" timestamp,
  "acheteur_nom" varchar(128),
  "acheteur_id" integer,
  "annonce_id" integer,
  "prix_jour" numeric(8,2),
  "prix_semaine" numeric(8,2),
  "prix_mois" numeric(10,2),
  "caution" numeric(10,2),
  "km_inclus" integer,
  "status" "vo_status" NOT NULL DEFAULT 'achat_enregistre',
  "description" text,
  "equipements" text,
  "garantie" varchar(128),
  "badge_officiel" boolean DEFAULT true,
  "created_by" integer,
  "agent_id" integer,
  "site_id" integer,
  "duree_stock" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vo_documents" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "category" "vo_doc_category" NOT NULL,
  "etape" varchar(64),
  "nom" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "mime_type" varchar(64),
  "taille" integer,
  "uploaded_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vo_etapes" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "status" "vo_status" NOT NULL,
  "status_label" varchar(128) NOT NULL,
  "responsable" varchar(128),
  "commentaire" text,
  "docs_obligatoires" jsonb,
  "docs_presents" jsonb,
  "valide_par" integer,
  "date_validation" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vo_diagnostics" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "categorie" varchar(64) NOT NULL,
  "resultat" "vo_diag_result" NOT NULL,
  "detail" text,
  "code_defaut" varchar(32),
  "photo_url" text,
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vo_reparations" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "prestation" varchar(255) NOT NULL,
  "mecanicien" varchar(128),
  "pieces_utilisees" text,
  "temps_main_oeuvre" numeric(6,2),
  "cout_pieces" numeric(10,2) DEFAULT '0',
  "cout_main_oeuvre" numeric(10,2) DEFAULT '0',
  "cout_total" numeric(10,2) DEFAULT '0',
  "photo_avant" text,
  "photo_apres" text,
  "status" varchar(32) DEFAULT 'en_attente',
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vo_lavage" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "lavage_interieur" boolean DEFAULT false,
  "lavage_exterieur" boolean DEFAULT false,
  "detailing" boolean DEFAULT false,
  "renovation_optique" boolean DEFAULT false,
  "nettoyage_moteur" boolean DEFAULT false,
  "photo_avant" text,
  "photo_apres" text,
  "cout" numeric(10,2) DEFAULT '0',
  "prestataire_externe" boolean DEFAULT false,
  "facture_url" text,
  "status" varchar(32) DEFAULT 'a_faire',
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compta_ecritures" (
  "id" serial PRIMARY KEY,
  "type" "compta_type" NOT NULL,
  "label" varchar(255) NOT NULL,
  "montant_ht" numeric(14,2) NOT NULL,
  "tva_rate" numeric(5,2) DEFAULT '20.00',
  "tva_montant" numeric(14,2) DEFAULT '0',
  "montant_ttc" numeric(14,2) NOT NULL,
  "sens" varchar(8) NOT NULL DEFAULT 'debit',
  "statut" "compta_statut" NOT NULL DEFAULT 'brouillon',
  "date_ecriture" timestamp NOT NULL DEFAULT now(),
  "date_echeance" timestamp,
  "vehicule_id" integer,
  "client_id" integer,
  "fournisseur" varchar(128),
  "annonce_id" integer,
  "vo_vehicule_id" integer,
  "abonnement_id" integer,
  "reference" varchar(64),
  "notes" text,
  "valide_par" integer,
  "date_validation" timestamp,
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compta_documents" (
  "id" serial PRIMARY KEY,
  "ecriture_id" integer,
  "vehicule_id" integer,
  "client_id" integer,
  "type" "compta_doc_type" NOT NULL,
  "nom" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "mime_type" varchar(64),
  "taille" integer,
  "ocr_data" text,
  "uploaded_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compta_rapports" (
  "id" serial PRIMARY KEY,
  "type" varchar(32) NOT NULL,
  "periode" varchar(32) NOT NULL,
  "date_debut" timestamp NOT NULL,
  "date_fin" timestamp NOT NULL,
  "total_achats" numeric(14,2) DEFAULT '0',
  "total_ventes" numeric(14,2) DEFAULT '0',
  "total_depenses" numeric(14,2) DEFAULT '0',
  "total_commissions" numeric(14,2) DEFAULT '0',
  "total_abonnements" numeric(14,2) DEFAULT '0',
  "total_tva" numeric(14,2) DEFAULT '0',
  "benefice_net" numeric(14,2) DEFAULT '0',
  "data" jsonb,
  "pdf_url" text,
  "excel_url" text,
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cabinets_comptables" (
  "id" serial PRIMARY KEY,
  "nom" varchar(255) NOT NULL,
  "siret" varchar(32),
  "adresse" text,
  "telephone" varchar(32),
  "email" varchar(255),
  "site_web" varchar(255),
  "responsable_id" integer NOT NULL,
  "active" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cabinet_membres" (
  "id" serial PRIMARY KEY,
  "cabinet_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" "cabinet_role" NOT NULL DEFAULT 'collaborateur',
  "actif" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cabinet_clients" (
  "id" serial PRIMARY KEY,
  "cabinet_id" integer NOT NULL,
  "client_user_id" integer,
  "nom" varchar(255) NOT NULL,
  "siret" varchar(32),
  "email" varchar(255),
  "telephone" varchar(32),
  "notes" text,
  "actif" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cabinet_dossiers" (
  "id" serial PRIMARY KEY,
  "cabinet_id" integer NOT NULL,
  "client_id" integer NOT NULL,
  "titre" varchar(255) NOT NULL,
  "type" varchar(64),
  "status" varchar(32) DEFAULT 'ouvert',
  "responsable_id" integer,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cabinet_documents" (
  "id" serial PRIMARY KEY,
  "dossier_id" integer NOT NULL,
  "cabinet_id" integer NOT NULL,
  "nom" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "type_doc" "compta_doc_type" NOT NULL,
  "mime_type" varchar(64),
  "taille" integer,
  "uploaded_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
