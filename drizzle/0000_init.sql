CREATE TYPE "public"."account_type" AS ENUM('particulier', 'professionnel');--> statement-breakpoint
CREATE TYPE "public"."annonce_boite" AS ENUM('manuelle', 'automatique', 'semi_automatique');--> statement-breakpoint
CREATE TYPE "public"."annonce_carburant" AS ENUM('essence', 'diesel', 'electrique', 'hybride', 'hybride_rechargeable', 'gpl', 'hydrogene', 'ethanol', 'autre');--> statement-breakpoint
CREATE TYPE "public"."annonce_categorie" AS ENUM('citadine', 'berline', 'break', 'suv', 'coupe', 'cabriolet', 'monospace', 'utilitaire', 'camion', 'moto', 'scooter', 'quad', 'luxe', 'autre');--> statement-breakpoint
CREATE TYPE "public"."annonce_etat" AS ENUM('neuf', 'occasion', 'demonstration', 'accidente');--> statement-breakpoint
CREATE TYPE "public"."annonce_famille" AS ENUM('auto', 'moto');--> statement-breakpoint
CREATE TYPE "public"."annonce_option_type" AS ENUM('annonce_urgente', 'boost_7j', 'boost_15j', 'boost_30j', 'mise_avant_categorie', 'mise_avant_accueil', 'photo_pack');--> statement-breakpoint
CREATE TYPE "public"."annonce_status" AS ENUM('brouillon', 'en_validation', 'publiee', 'vendue', 'louee', 'expiree', 'refusee', 'archivee');--> statement-breakpoint
CREATE TYPE "public"."annonce_type" AS ENUM('vente', 'location');--> statement-breakpoint
CREATE TYPE "public"."annonce_vendeur_type" AS ENUM('particulier', 'professionnel', 'concession');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('available', 'soon', 'sold');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('test_drive', 'rental', 'purchase_visit');--> statement-breakpoint
CREATE TYPE "public"."boost_type" AS ENUM('none', 'boost_7d', 'boost_30d', 'premium_30d');--> statement-breakpoint
CREATE TYPE "public"."caution_status" AS ENUM('none', 'pending', 'paid', 'released', 'captured');--> statement-breakpoint
CREATE TYPE "public"."change_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'archived', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."devis_garage_status" AS ENUM('nouveau', 'recu_par_garages', 'offres_recues', 'accepte', 'refuse', 'annule', 'termine');--> statement-breakpoint
CREATE TYPE "public"."devis_status" AS ENUM('brouillon', 'envoye', 'accepte', 'refuse', 'termine', 'expire');--> statement-breakpoint
CREATE TYPE "public"."facture_status" AS ENUM('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee');--> statement-breakpoint
CREATE TYPE "public"."finance_category" AS ENUM('vente_vehicule', 'abonnement', 'commission', 'reservation', 'prestation', 'option', 'acompte_rdv', 'autre_entree', 'achat_vehicule', 'achat_piece', 'carburant', 'publicite', 'materiel', 'assurance', 'frais_administratifs', 'salaire', 'prestataire', 'remboursement', 'depense', 'autre_sortie');--> statement-breakpoint
CREATE TYPE "public"."finance_doc_category" AS ENUM('facture_fournisseur', 'facture_vente', 'justificatif', 'contrat', 'releve', 'autre');--> statement-breakpoint
CREATE TYPE "public"."finance_flow" AS ENUM('entree', 'sortie');--> statement-breakpoint
CREATE TYPE "public"."fuel" AS ENUM('essence', 'diesel', 'hybrid', 'electric', 'gpl', 'other');--> statement-breakpoint
CREATE TYPE "public"."garage_public_status" AS ENUM('en_attente', 'valide', 'refuse', 'suspendu');--> statement-breakpoint
CREATE TYPE "public"."garage_status" AS ENUM('pending', 'active', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."garage_type" AS ENUM('concession', 'pro', 'franchise', 'independent');--> statement-breakpoint
CREATE TYPE "public"."intervention_status" AS ENUM('planifiee', 'en_cours', 'terminee', 'annulee');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."kyc_doc_type" AS ENUM('piece_identite', 'permis_conduire', 'justificatif_domicile', 'kbis', 'rib', 'carte_grise', 'controle_technique', 'autre');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('non_demarre', 'en_cours', 'en_validation', 'valide', 'refuse', 'expire');--> statement-breakpoint
CREATE TYPE "public"."location_segment" AS ENUM('particulier', 'professionnel', 'vtc_taxi');--> statement-breakpoint
CREATE TYPE "public"."location_status" AS ENUM('demande', 'acceptee', 'refusee', 'payee', 'en_cours', 'terminee', 'annulee', 'litige');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('envoye', 'lu', 'archive');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('rental_caution', 'society_acompte', 'pro_subscription', 'franchise_subscription', 'vehicle_boost');--> statement-breakpoint
CREATE TYPE "public"."plate_lookup_type" AS ENUM('plate', 'vin');--> statement-breakpoint
CREATE TYPE "public"."pro_category" AS ENUM('garage', 'concessionnaire', 'marchand', 'revendeur', 'loueur', 'convoyeur', 'expert_auto', 'centre_ct', 'fournisseur_pieces', 'carrossier', 'depanneur', 'autre');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('pending', 'accepted', 'rejected', 'expired', 'draft');--> statement-breakpoint
CREATE TYPE "public"."rdv_status" AS ENUM('en_attente', 'confirme', 'honore', 'annule_client', 'annule_garage', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."rdv_type" AS ENUM('visite', 'intervention');--> statement-breakpoint
CREATE TYPE "public"."rental_applicant_type" AS ENUM('individual', 'society', 'vtc', 'taxi');--> statement-breakpoint
CREATE TYPE "public"."rental_application_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'paid', 'completed');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('ouvert', 'en_cours', 'traite', 'rejete');--> statement-breakpoint
CREATE TYPE "public"."review_target" AS ENUM('vendeur', 'garage', 'loueur', 'livreur', 'vtc_taxi', 'boutique_pieces', 'annonce');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('sale', 'rental', 'leasing', 'loa');--> statement-breakpoint
CREATE TYPE "public"."staff_position" AS ENUM('pdg', 'directeur', 'adjoint', 'gerant', 'chef_equipe', 'agent');--> statement-breakpoint
CREATE TYPE "public"."subscription_category" AS ENUM('pro_subscription', 'franchise_subscription', 'particulier_boost');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('particulier_free', 'boost_7j', 'boost_30j', 'premium_30j', 'pro_starter', 'pro_business', 'pro_premium', 'franchise', 'pro_start', 'pro_elite', 'pro_max', 'garage_start', 'garage_premium', 'garage_elite', 'garage_max', 'loc_start', 'loc_premium', 'loc_elite', 'loc_max', 'vtc_start', 'vtc_premium', 'vtc_elite', 'vtc_max', 'pieces_boutique', 'pieces_start', 'pieces_premium', 'pieces_elite', 'pieces_max', 'livraison_start', 'livraison_premium', 'livraison_elite');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'active', 'cancelled', 'past_due', 'expired');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('manual', 'auto');--> statement-breakpoint
CREATE TYPE "public"."univers" AS ENUM('vente_pro', 'garage', 'location', 'vtc_taxi', 'pieces', 'livraison');--> statement-breakpoint
CREATE TYPE "public"."upload_type" AS ENUM('image', 'document');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'pro', 'garage', 'employee', 'society', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('pending', 'active', 'sold', 'rejected', 'expired', 'draft');--> statement-breakpoint
CREATE TYPE "public"."vehicule_status" AS ENUM('disponible', 'vendu', 'reserve', 'en_preparation');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"action" varchar(64) NOT NULL,
	"target_type" varchar(32),
	"target_id" integer,
	"metadata" text,
	"ip_address" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"brand" text,
	"category" text,
	"frequency" text,
	"fuel_type" text,
	"is_active" text,
	"location" text,
	"max_mileage" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "annonce_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"annonce_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"option_type" "annonce_option_type" NOT NULL,
	"option_code" varchar(64) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"payment_id" integer,
	"active_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "annonce_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"annonce_id" integer NOT NULL,
	"url" text NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "annonces" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"type" "annonce_type" DEFAULT 'vente' NOT NULL,
	"status" "annonce_status" DEFAULT 'publiee' NOT NULL,
	"titre" varchar(255) NOT NULL,
	"description" text,
	"marque" varchar(64) NOT NULL,
	"modele" varchar(128) NOT NULL,
	"version" varchar(128),
	"categorie" "annonce_categorie" DEFAULT 'berline' NOT NULL,
	"etat" "annonce_etat" DEFAULT 'occasion' NOT NULL,
	"carburant" "annonce_carburant" DEFAULT 'essence' NOT NULL,
	"boite" "annonce_boite" DEFAULT 'manuelle' NOT NULL,
	"annee" integer,
	"kilometrage" integer,
	"couleur" varchar(64),
	"puissance_cv" integer,
	"portes" integer,
	"places" integer,
	"prix" numeric(12, 2) DEFAULT '0' NOT NULL,
	"prix_jour" numeric(12, 2),
	"prix_semaine" numeric(12, 2),
	"prix_mois" numeric(12, 2),
	"devise" varchar(4) DEFAULT 'EUR' NOT NULL,
	"negociable" boolean DEFAULT true NOT NULL,
	"ville" varchar(128),
	"pays" varchar(4) DEFAULT 'FR',
	"code_postal" varchar(16),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"contact_nom" varchar(128),
	"contact_telephone" varchar(32),
	"contact_email" varchar(255),
	"boosted" boolean DEFAULT false NOT NULL,
	"boosted_until" timestamp,
	"vues" integer DEFAULT 0 NOT NULL,
	"contacts" integer DEFAULT 0 NOT NULL,
	"favoris" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"famille" "annonce_famille" DEFAULT 'auto' NOT NULL,
	"segment_location" "location_segment",
	"vendeur_type" "annonce_vendeur_type" DEFAULT 'particulier' NOT NULL,
	"slug" varchar(255),
	"videos" text,
	"urgent" boolean DEFAULT false NOT NULL,
	"urgent_until" timestamp,
	"mise_avant_categorie" boolean DEFAULT false NOT NULL,
	"mise_avant_categorie_until" timestamp,
	"mise_avant_accueil" boolean DEFAULT false NOT NULL,
	"mise_avant_accueil_until" timestamp,
	"photos_quota" integer DEFAULT 4 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" bigint,
	"action" varchar(128) NOT NULL,
	"entity_type" varchar(64),
	"entity_id" bigint,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"vehicle_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"garage_id" bigint,
	"type" "booking_type" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"message" text,
	"caution_amount" numeric(12, 2),
	"caution_currency" varchar(8),
	"caution_status" "caution_status" DEFAULT 'none' NOT NULL,
	"caution_stripe_session_id" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "change_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"category" varchar(64) NOT NULL,
	"current_value" text,
	"requested_value" text,
	"message" text,
	"status" "change_request_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"name" varchar(128) NOT NULL,
	"postal_code" varchar(16),
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"first_name" varchar(128) NOT NULL,
	"last_name" varchar(128) NOT NULL,
	"email" varchar(255),
	"phone" varchar(32),
	"address_line" varchar(255),
	"city" varchar(128),
	"postal_code" varchar(16),
	"country" varchar(4) DEFAULT 'FR',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"vehicle_id" bigint,
	"garage_id" bigint,
	"buyer_id" bigint NOT NULL,
	"seller_id" bigint NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"buyer_unread" integer DEFAULT 0 NOT NULL,
	"seller_unread" integer DEFAULT 0 NOT NULL,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"name" varchar(128) NOT NULL,
	"currency" varchar(8) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devis" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"numero" varchar(32) NOT NULL,
	"client_id" integer,
	"vehicule_id" integer,
	"titre" varchar(255) NOT NULL,
	"description" text,
	"status" "devis_status" DEFAULT 'brouillon' NOT NULL,
	"total_ht" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tva" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(12, 2) DEFAULT '0' NOT NULL,
	"taux_tva" numeric(5, 2) DEFAULT '20' NOT NULL,
	"valid_until" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devis_garage_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"contact_nom" varchar(128) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_telephone" varchar(32),
	"vehicule_marque" varchar(64),
	"vehicule_modele" varchar(128),
	"vehicule_annee" integer,
	"immatriculation" varchar(32),
	"type_intervention" varchar(128) NOT NULL,
	"description" text,
	"ville" varchar(128),
	"code_postal" varchar(16),
	"pays" varchar(4) DEFAULT 'FR',
	"photos" text,
	"status" "devis_garage_status" DEFAULT 'nouveau' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devis_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"devis_id" integer NOT NULL,
	"designation" varchar(255) NOT NULL,
	"quantite" numeric(10, 2) DEFAULT '1' NOT NULL,
	"prix_unitaire_ht" numeric(12, 2) NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "factures" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"numero" varchar(32) NOT NULL,
	"client_id" integer,
	"devis_id" integer,
	"intervention_id" integer,
	"status" "facture_status" DEFAULT 'brouillon' NOT NULL,
	"total_ht" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tva" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(12, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp,
	"due_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favoris" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"annonce_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "finance_doc_category" DEFAULT 'justificatif' NOT NULL,
	"title" varchar(255) NOT NULL,
	"transaction_id" integer,
	"user_id" integer,
	"file_name" varchar(255),
	"mime_type" varchar(120),
	"size_bytes" integer,
	"file_data" text,
	"amount_ttc" numeric(14, 2),
	"amount_ht" numeric(14, 2),
	"tva_amount" numeric(14, 2),
	"tva_rate" numeric(5, 2),
	"currency" varchar(4) DEFAULT 'EUR',
	"supplier" varchar(255),
	"note" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"flow" "finance_flow" NOT NULL,
	"category" "finance_category" NOT NULL,
	"univers" "univers",
	"amount_ttc" numeric(14, 2) NOT NULL,
	"amount_ht" numeric(14, 2),
	"tva_amount" numeric(14, 2),
	"tva_rate" numeric(5, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"label" varchar(255) NOT NULL,
	"payment_id" integer,
	"user_id" integer,
	"source_type" varchar(40),
	"source_ref" varchar(128),
	"vehicule_interne_id" integer,
	"note" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "garages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"owner_id" bigint NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(256) NOT NULL,
	"description" text,
	"logo_url" text,
	"cover_url" text,
	"address" text,
	"city" varchar(128),
	"postal_code" varchar(16),
	"country" varchar(64),
	"phone" varchar(32),
	"email" varchar(320),
	"website" text,
	"hours" jsonb,
	"type" "garage_type" DEFAULT 'pro' NOT NULL,
	"status" "garage_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "garages_publics" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"logo_url" text,
	"cover_url" text,
	"address_line" varchar(255),
	"city" varchar(128),
	"postal_code" varchar(16),
	"country" varchar(4) DEFAULT 'FR',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"phone" varchar(32),
	"email" varchar(255),
	"website" varchar(255),
	"hours" text,
	"services" text,
	"specialites" text,
	"status" "garage_public_status" DEFAULT 'valide' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"garage" text,
	"intervention" text,
	"issued_at" text,
	"pdf_file" text,
	"total_ttc" text,
	"creation_date" text,
	"modified_date" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"doc_type" "kyc_doc_type" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255),
	"mime_type" varchar(64),
	"size_bytes" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" "kyc_status" DEFAULT 'non_demarre' NOT NULL,
	"submitted_at" timestamp,
	"validated_at" timestamp,
	"validated_by" integer,
	"rejection_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"annonce_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"location_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"annonce_id" integer NOT NULL,
	"locataire_id" integer NOT NULL,
	"loueur_id" integer NOT NULL,
	"status" "location_status" DEFAULT 'demande' NOT NULL,
	"date_debut" timestamp NOT NULL,
	"date_fin" timestamp NOT NULL,
	"nb_jours" integer NOT NULL,
	"prix_journalier" numeric(12, 2) NOT NULL,
	"montant_location" numeric(12, 2) NOT NULL,
	"montant_caution" numeric(12, 2) DEFAULT '0' NOT NULL,
	"montant_assurance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"montant_total" numeric(12, 2) NOT NULL,
	"devise" varchar(4) DEFAULT 'EUR' NOT NULL,
	"payment_id" integer,
	"contrat_url" text,
	"etat_depart_url" text,
	"etat_retour_url" text,
	"km_depart" integer,
	"km_retour" integer,
	"km_inclus" integer DEFAULT 200,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1_id" integer NOT NULL,
	"user2_id" integer NOT NULL,
	"annonce_id" integer,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"status" "message_status" DEFAULT 'envoye' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"type" "payment_type" NOT NULL,
	"booking_id" bigint,
	"rental_application_id" bigint,
	"subscription_id" bigint,
	"vehicle_id" bigint,
	"stripe_session_id" varchar(256),
	"stripe_payment_intent_id" varchar(256),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'EUR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"reference" varchar(64) NOT NULL,
	"designation" varchar(255) NOT NULL,
	"description" text,
	"prix_achat" numeric(12, 2),
	"prix_vente" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_min" integer DEFAULT 0 NOT NULL,
	"fournisseur" varchar(255),
	"emplacement" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plate_lookups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"type" "plate_lookup_type" NOT NULL,
	"query" varchar(64) NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"number" varchar(64) NOT NULL,
	"vehicle_id" bigint,
	"garage_id" bigint,
	"user_id" bigint NOT NULL,
	"status" "quote_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"lines" jsonb,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(8) DEFAULT 'EUR' NOT NULL,
	"notes" text,
	"pdf_url" text,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rdv_fidelite" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"garage_id" integer NOT NULL,
	"nb_honores" integer DEFAULT 0 NOT NULL,
	"nb_no_show" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rdv_garage" (
	"id" serial PRIMARY KEY NOT NULL,
	"garage_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"annonce_id" integer,
	"type" "rdv_type" DEFAULT 'visite' NOT NULL,
	"status" "rdv_status" DEFAULT 'en_attente' NOT NULL,
	"date_heure" timestamp NOT NULL,
	"motif" varchar(255),
	"notes" text,
	"acompte_cents" integer DEFAULT 0 NOT NULL,
	"acompte_paid" boolean DEFAULT false NOT NULL,
	"payment_id" integer,
	"stripe_session_id" varchar(255),
	"annule_prevenance_ok" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rental_applications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"token" varchar(128) NOT NULL,
	"user_id" bigint NOT NULL,
	"vehicle_id" bigint,
	"garage_id" bigint,
	"applicant_type" "rental_applicant_type" DEFAULT 'individual' NOT NULL,
	"data" jsonb,
	"current_step" integer DEFAULT 0 NOT NULL,
	"status" "rental_application_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"deposit_amount" numeric(12, 2),
	"deposit_currency" varchar(8),
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"deposit_stripe_session_id" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"target_user_id" integer,
	"target_type" varchar(32) NOT NULL,
	"target_id" integer,
	"reason" varchar(128) NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'ouvert' NOT NULL,
	"handled_by" integer,
	"handled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"booking_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"garage_id" bigint,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" integer,
	"target_user_id" integer,
	"target_type" "review_target" DEFAULT 'vendeur',
	"ref_type" varchar(32),
	"ref_id" integer,
	"note" integer,
	"hidden" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"user_agent" text,
	"ip_address" varchar(64),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"user_id" integer,
	"stage" varchar(16) NOT NULL,
	"period_end" timestamp,
	"channel" varchar(16) DEFAULT 'email' NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"garage_id" bigint,
	"plan_code" varchar(64) NOT NULL,
	"category" "subscription_category" NOT NULL,
	"stripe_session_id" varchar(256),
	"stripe_subscription_id" varchar(256),
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"current_period_end" timestamp with time zone,
	"amount" numeric(12, 2),
	"currency" varchar(8) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"univers" "univers",
	"quota_annonces" integer,
	"quota_photos" integer,
	"quota_videos" integer,
	"quota_vehicules" integer,
	"quota_employes" integer,
	"quota_devis_mois" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"contact_nom" varchar(128) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"sujet" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(32) DEFAULT 'ouvert' NOT NULL,
	"priority" varchar(16) DEFAULT 'normale' NOT NULL,
	"assigned_to" integer,
	"response" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uploads" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"type" "upload_type" NOT NULL,
	"category" varchar(64),
	"url" text NOT NULL,
	"file_key" varchar(256) NOT NULL,
	"filename" varchar(256),
	"mime_type" varchar(64),
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_assurances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vehicule_id" integer,
	"compagnie" varchar(128) NOT NULL,
	"numero_police" varchar(64),
	"formule" varchar(64),
	"date_debut" timestamp,
	"date_fin" timestamp,
	"prime_annuelle" numeric(12, 2),
	"document_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255),
	"mime_type" varchar(64),
	"size_bytes" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"google_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"first_name" varchar(128),
	"last_name" varchar(128),
	"phone" varchar(32),
	"avatar_url" text,
	"account_type" "account_type" DEFAULT 'particulier' NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"company_name" varchar(255),
	"company_siret" varchar(32),
	"address_line" varchar(255),
	"city" varchar(128),
	"postal_code" varchar(16),
	"country" varchar(4) DEFAULT 'FR',
	"currency" varchar(4) DEFAULT 'EUR',
	"stripe_customer_id" varchar(128),
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"pro_category" "pro_category",
	"staff_position" "staff_position",
	"manager_id" integer,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_code" varchar(12),
	"two_factor_expires_at" timestamp,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"logo_url" text,
	"horaires" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_availability_subscriptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"vehicle_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicule_dossiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"immatriculation" varchar(32),
	"vin" varchar(32),
	"marque" varchar(64),
	"modele" varchar(128),
	"annee" integer,
	"dernier_km" integer,
	"indice_confiance" integer DEFAULT 50 NOT NULL,
	"annonce_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicule_historique" (
	"id" serial PRIMARY KEY NOT NULL,
	"dossier_id" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"titre" varchar(255) NOT NULL,
	"description" text,
	"kilometrage" integer,
	"cout" numeric(12, 2),
	"devise" varchar(4) DEFAULT 'EUR',
	"source" varchar(32) DEFAULT 'interne' NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicules" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"marque" varchar(64) NOT NULL,
	"modele" varchar(128) NOT NULL,
	"version" varchar(128),
	"annee" integer,
	"kilometrage" integer,
	"carburant" varchar(32),
	"boite" varchar(32),
	"couleur" varchar(64),
	"immatriculation" varchar(32),
	"vin" varchar(32),
	"prix_vente" numeric(12, 2),
	"prix_achat" numeric(12, 2),
	"status" "vehicule_status" DEFAULT 'disponible' NOT NULL,
	"description" text,
	"photos" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
