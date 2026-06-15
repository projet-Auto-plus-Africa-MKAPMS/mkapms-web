-- Migration 0015: Amélioration Pro — VTC, Location, Documents, GPS, Livraison pièces

-- Enums
DO $$ BEGIN CREATE TYPE "pro_activity" AS ENUM ('vente_pro','location_pro','vtc_taxi','garage_plus','pieces_auto','livraison','depannage','carte_grise','cabinet_comptable','boutique_stock'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "pro_doc_status" AS ENUM ('envoye','en_analyse','valide','refuse','expire','a_remplacer','suspect'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "pro_doc_alert" AS ENUM ('j_30','j_15','j_7','jour_j','expire'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "vtc_driver_status" AS ENUM ('actif','inactif','bloque','en_validation','suspendu'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "vtc_vehicle_status" AS ENUM ('disponible','en_service','en_entretien','bloque','indisponible'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "location_vehicle_status" AS ENUM ('disponible','reserve','loue','en_entretien','bloque','indisponible'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "gps_connection_status" AS ENUM ('connecte','deconnecte','erreur','en_attente'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "delivery_size_check" AS ENUM ('compatible_moto','trop_volumineux','poids_depasse','interdit_moto'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Pro profiles
CREATE TABLE IF NOT EXISTS "pro_profiles" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "activity" "pro_activity" NOT NULL,
  "company_name" varchar(255),
  "siret" varchar(32),
  "kbis_url" text,
  "address_line" varchar(255),
  "city" varchar(128),
  "postal_code" varchar(16),
  "country" varchar(4) DEFAULT 'FR',
  "phone" varchar(32),
  "email" varchar(255),
  "website" varchar(255),
  "validated" boolean NOT NULL DEFAULT false,
  "validated_at" timestamp,
  "validated_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Pro documents
CREATE TABLE IF NOT EXISTS "pro_documents" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "pro_profile_id" integer,
  "type" varchar(64) NOT NULL,
  "label" varchar(255),
  "file_url" text NOT NULL,
  "file_name" varchar(255),
  "mime_type" varchar(64),
  "file_size" integer,
  "status" "pro_doc_status" NOT NULL DEFAULT 'envoye',
  "refus_motif" text,
  "expires_at" timestamp,
  "last_alert_sent" "pro_doc_alert",
  "last_alert_at" timestamp,
  "verified_by" integer,
  "verified_at" timestamp,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- VTC sociétés
CREATE TABLE IF NOT EXISTS "vtc_societes" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "pro_profile_id" integer,
  "nom" varchar(255) NOT NULL,
  "siret" varchar(32),
  "kbis_url" text,
  "assurance_url" text,
  "assurance_expire" timestamp,
  "adresse" varchar(255),
  "ville" varchar(128),
  "code_postal" varchar(16),
  "telephone" varchar(32),
  "email" varchar(255),
  "validated" boolean NOT NULL DEFAULT false,
  "validated_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- VTC chauffeurs
CREATE TABLE IF NOT EXISTS "vtc_chauffeurs" (
  "id" serial PRIMARY KEY,
  "societe_id" integer NOT NULL,
  "user_id" integer,
  "nom" varchar(128) NOT NULL,
  "prenom" varchar(128) NOT NULL,
  "telephone" varchar(32),
  "email" varchar(255),
  "permis_url" text,
  "permis_expire" timestamp,
  "carte_vtc_url" text,
  "carte_vtc_expire" timestamp,
  "piece_identite_url" text,
  "justificatif_domicile_url" text,
  "assurance_url" text,
  "assurance_expire" timestamp,
  "status" "vtc_driver_status" NOT NULL DEFAULT 'en_validation',
  "bloque_motif" text,
  "rating" numeric(3,2) DEFAULT '0',
  "total_courses" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- VTC véhicules
CREATE TABLE IF NOT EXISTS "vtc_vehicules" (
  "id" serial PRIMARY KEY,
  "societe_id" integer NOT NULL,
  "chauffeur_id" integer,
  "marque" varchar(64) NOT NULL,
  "modele" varchar(64) NOT NULL,
  "annee" integer,
  "immatriculation" varchar(20),
  "vin" varchar(24),
  "carte_grise_url" text,
  "assurance_url" text,
  "assurance_expire" timestamp,
  "controle_technique_url" text,
  "ct_expire" timestamp,
  "autorisation_exploitation_url" text,
  "status" "vtc_vehicle_status" NOT NULL DEFAULT 'disponible',
  "bloque_motif" text,
  "km_actuel" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- VTC demandes
CREATE TABLE IF NOT EXISTS "vtc_demandes" (
  "id" serial PRIMARY KEY,
  "societe_id" integer NOT NULL,
  "client_id" integer,
  "chauffeur_id" integer,
  "vehicule_id" integer,
  "depart" varchar(255),
  "arrivee" varchar(255),
  "date_heure" timestamp,
  "prix_estime" numeric(10,2),
  "prix_final" numeric(10,2),
  "status" varchar(32) NOT NULL DEFAULT 'en_attente',
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Location flotte
CREATE TABLE IF NOT EXISTS "location_flotte" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "pro_profile_id" integer,
  "marque" varchar(64) NOT NULL,
  "modele" varchar(64) NOT NULL,
  "version" varchar(128),
  "annee" integer,
  "immatriculation" varchar(20),
  "vin" varchar(24),
  "photos" jsonb DEFAULT '[]',
  "prix_jour" numeric(10,2),
  "prix_semaine" numeric(10,2),
  "prix_mois" numeric(10,2),
  "caution" numeric(10,2),
  "assurance_incluse" boolean NOT NULL DEFAULT false,
  "km_inclus" integer,
  "status" "location_vehicle_status" NOT NULL DEFAULT 'disponible',
  "carte_grise_url" text,
  "assurance_url" text,
  "assurance_expire" timestamp,
  "ct_url" text,
  "ct_expire" timestamp,
  "description" text,
  "equipements" jsonb DEFAULT '[]',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Location contrats
CREATE TABLE IF NOT EXISTS "location_contrats" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "loueur_id" integer NOT NULL,
  "client_id" integer NOT NULL,
  "date_debut" timestamp NOT NULL,
  "date_fin" timestamp NOT NULL,
  "prix_total" numeric(10,2),
  "caution_montant" numeric(10,2),
  "caution_rendue" boolean NOT NULL DEFAULT false,
  "km_depart" integer,
  "km_retour" integer,
  "etat_depart_photos" jsonb DEFAULT '[]',
  "etat_retour_photos" jsonb DEFAULT '[]',
  "etat_depart_notes" text,
  "etat_retour_notes" text,
  "contrat_url" text,
  "status" varchar(32) NOT NULL DEFAULT 'en_cours',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Location calendrier
CREATE TABLE IF NOT EXISTS "location_calendrier" (
  "id" serial PRIMARY KEY,
  "vehicule_id" integer NOT NULL,
  "date_debut" timestamp NOT NULL,
  "date_fin" timestamp NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT 'reservation',
  "contrat_id" integer,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- GPS devices
CREATE TABLE IF NOT EXISTS "gps_devices" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "vehicule_ref" varchar(64),
  "fournisseur" varchar(128),
  "identifiant_boitier" varchar(128),
  "api_endpoint" varchar(512),
  "api_key" varchar(256),
  "connection_status" "gps_connection_status" NOT NULL DEFAULT 'en_attente',
  "derniere_position" jsonb,
  "dernier_km" integer,
  "dernier_carburant" numeric(5,2),
  "derniere_batterie" numeric(5,2),
  "alertes_actives" jsonb DEFAULT '[]',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- GPS historique
CREATE TABLE IF NOT EXISTS "gps_historique" (
  "id" serial PRIMARY KEY,
  "device_id" integer NOT NULL,
  "lat" numeric(10,7),
  "lng" numeric(10,7),
  "km" integer,
  "carburant" numeric(5,2),
  "batterie" numeric(5,2),
  "vitesse" integer,
  "etat_vehicule" varchar(32),
  "timestamp" timestamp NOT NULL DEFAULT now()
);

-- Livraison pièces rules
CREATE TABLE IF NOT EXISTS "livraison_pieces_rules" (
  "id" serial PRIMARY KEY,
  "categorie_piece" varchar(128) NOT NULL,
  "poids_max_kg" numeric(6,2),
  "longueur_max_cm" integer,
  "largeur_max_cm" integer,
  "hauteur_max_cm" integer,
  "compatible_moto" boolean NOT NULL DEFAULT true,
  "interdite_motif" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Livraison pièces interdites moto
CREATE TABLE IF NOT EXISTS "livraison_pieces_interdites" (
  "id" serial PRIMARY KEY,
  "mot_cle" varchar(128) NOT NULL,
  "motif" varchar(255) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Vente pro véhicules
CREATE TABLE IF NOT EXISTS "vente_pro_vehicules" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "annonce_id" integer,
  "status" varchar(32) NOT NULL DEFAULT 'brouillon',
  "photos_validees" boolean NOT NULL DEFAULT false,
  "documents_valides" boolean NOT NULL DEFAULT false,
  "date_publication" timestamp,
  "date_vente" timestamp,
  "acheteur_id" integer,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Pro dashboard stats
CREATE TABLE IF NOT EXISTS "pro_dashboard_stats" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "activity" "pro_activity" NOT NULL,
  "period" varchar(16) NOT NULL,
  "annonces_total" integer DEFAULT 0,
  "annonces_vues" integer DEFAULT 0,
  "messages_recus" integer DEFAULT 0,
  "reservations_total" integer DEFAULT 0,
  "ventes_total" integer DEFAULT 0,
  "chiffre_affaires" numeric(12,2) DEFAULT '0',
  "stock_vehicules" integer DEFAULT 0,
  "flotte_total" integer DEFAULT 0,
  "chauffeurs" integer DEFAULT 0,
  "avis_positifs" integer DEFAULT 0,
  "avis_total" integer DEFAULT 0,
  "data" jsonb DEFAULT '{}',
  "calculated_at" timestamp NOT NULL DEFAULT now()
);
