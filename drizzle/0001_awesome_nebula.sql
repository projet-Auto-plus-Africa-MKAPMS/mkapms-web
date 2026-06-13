CREATE TYPE "public"."module_status" AS ENUM('active', 'masque', 'maintenance', 'desactive');--> statement-breakpoint
CREATE TYPE "public"."part_condition" AS ENUM('neuf', 'occasion', 'reconditionne', 'echange_standard');--> statement-breakpoint
CREATE TYPE "public"."parts_order_status" AS ENUM('panier', 'en_attente_paiement', 'payee', 'preparee', 'expediee', 'livree', 'annulee', 'remboursee');--> statement-breakpoint
CREATE TYPE "public"."parts_shop_type" AS ENUM('magasin_pieces', 'casse_auto', 'grossiste', 'distributeur', 'centre_auto', 'garage_vendeur');--> statement-breakpoint
CREATE TYPE "public"."delivery_mission_status" AS ENUM('creee', 'en_recherche', 'acceptee', 'refusee', 'en_cours', 'livree', 'annulee', 'litige');--> statement-breakpoint
CREATE TYPE "public"."delivery_vehicle_type" AS ENUM('moto', 'scooter', 'vehicule_leger', 'utilitaire', 'fourgon', 'camion');--> statement-breakpoint
CREATE TYPE "public"."breakdown_status" AS ENUM('demande', 'en_recherche', 'devis_envoye', 'acceptee', 'en_intervention', 'terminee', 'annulee', 'litige');--> statement-breakpoint
CREATE TYPE "public"."transport_booking_status" AS ENUM('demande', 'confirmee', 'en_cours', 'terminee', 'annulee');--> statement-breakpoint
CREATE TYPE "public"."transport_company_type" AS ENUM('vtc', 'taxi', 'mixte');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('reserve', 'achete', 'prepare', 'charge', 'en_transit', 'port', 'douane', 'entrepot', 'livre', 'annule');--> statement-breakpoint
CREATE TYPE "public"."import_transport_option" AS ENUM('transporteur_personnel', 'transport_mkapms');--> statement-breakpoint
CREATE TYPE "public"."payout_frequency" AS ENUM('manuel', 'hebdomadaire', 'mensuel');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('demande', 'en_cours', 'paye', 'echoue', 'annule');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_type" AS ENUM('credit', 'debit', 'retrait', 'commission', 'remboursement', 'blocage', 'deblocage');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('brouillon', 'genere', 'envoye', 'signe', 'archive', 'annule');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('vente_vehicule', 'reservation', 'location', 'vtc_taxi', 'depannage', 'livraison', 'paiement_fractionne', 'import_export', 'depot_vente', 'partenariat_fournisseur');--> statement-breakpoint
CREATE TYPE "public"."installment_alert_level" AS ENUM('j1', 'j3', 'j7', 'impaye');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('demande', 'dossier', 'valide_admin', 'contrat', 'signe', 'actif', 'termine', 'rejete', 'impaye');--> statement-breakpoint
CREATE TYPE "public"."qr_code_type" AS ENUM('depot_vehicule', 'pro', 'garage', 'location', 'pieces', 'campagne');--> statement-breakpoint
CREATE TYPE "public"."signalement_type" AS ENUM('bug', 'fraude', 'annonce_suspecte', 'paiement', 'compte', 'comportement');--> statement-breakpoint
CREATE TYPE "public"."suggestion_type" AS ENUM('idee', 'amelioration', 'difficulte');--> statement-breakpoint
CREATE TYPE "public"."vehicle_report_status" AS ENUM('en_attente', 'pret', 'echec');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(4) NOT NULL,
	"default_currency" varchar(8),
	"default_language" varchar(8),
	"vat_rate" numeric(6, 3),
	"import_allowed" boolean DEFAULT false NOT NULL,
	"export_allowed" boolean DEFAULT false NOT NULL,
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"symbol" varchar(8) NOT NULL,
	"name" varchar(64) NOT NULL,
	"rate_to_eur" numeric(18, 6),
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"label" varchar(128) NOT NULL,
	"applies_to" varchar(64),
	"required" boolean DEFAULT false NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" integer,
	"status" varchar(32) DEFAULT 'en_attente' NOT NULL,
	"verified_by" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"name" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"nom" varchar(128) NOT NULL,
	"description" text,
	"status" "module_status" DEFAULT 'active' NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"icone" varchar(64),
	"visible_public" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(96) NOT NULL,
	"module" varchar(64) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"label" varchar(128) NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(96) NOT NULL,
	"value" jsonb,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"position" varchar(64) NOT NULL,
	"department" varchar(64),
	"manager_id" integer,
	"salary" numeric(12, 2),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "part_compatibilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_id" integer NOT NULL,
	"marque" varchar(96),
	"modele" varchar(96),
	"motorisation" varchar(96),
	"annee_debut" integer,
	"annee_fin" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "part_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"oem_ref" varchar(96),
	"equipmentier_ref" varchar(96),
	"marque" varchar(96),
	"designation" varchar(192),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"reference_id" integer,
	"nom" varchar(192) NOT NULL,
	"description" text,
	"oem_ref" varchar(96),
	"equipmentier_ref" varchar(96),
	"categorie" varchar(96),
	"condition" "part_condition" DEFAULT 'neuf' NOT NULL,
	"prix_ht" numeric(12, 2) NOT NULL,
	"prix_ttc" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"photo_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"catalog_id" integer NOT NULL,
	"quantite" integer DEFAULT 1 NOT NULL,
	"prix_unitaire_ht" numeric(12, 2) NOT NULL,
	"prix_unitaire_ttc" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"status" "parts_order_status" DEFAULT 'panier' NOT NULL,
	"total_ht" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"commission_amount" numeric(12, 2),
	"delivery_mission_id" integer,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts_shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"type" "parts_shop_type" DEFAULT 'magasin_pieces' NOT NULL,
	"nom" varchar(160) NOT NULL,
	"description" text,
	"logo_url" text,
	"adresse" text,
	"ville" varchar(96),
	"country_code" varchar(4),
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"telephone" varchar(32),
	"whatsapp" varchar(32),
	"horaires" text,
	"commission_rate" numeric(5, 2) DEFAULT '3.00',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_id" integer NOT NULL,
	"quantite" integer DEFAULT 0 NOT NULL,
	"seuil_alerte" integer DEFAULT 0 NOT NULL,
	"emplacement" varchar(96),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"profile_id" integer,
	"status" "delivery_mission_status" DEFAULT 'creee' NOT NULL,
	"type_colis" varchar(96),
	"poids_kg" numeric(10, 2),
	"longueur_cm" integer,
	"largeur_cm" integer,
	"hauteur_cm" integer,
	"adresse_depart" text,
	"adresse_arrivee" text,
	"distance_km" numeric(10, 2),
	"urgent" boolean DEFAULT false NOT NULL,
	"tarif" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"vehicle_type_requis" "delivery_vehicle_type",
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "delivery_vehicle_type" NOT NULL,
	"country_code" varchar(4),
	"base_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"per_km" numeric(12, 2) DEFAULT '0' NOT NULL,
	"urgent_multiplier" numeric(5, 2) DEFAULT '1.50',
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nom" varchar(160) NOT NULL,
	"type" "delivery_vehicle_type" DEFAULT 'moto' NOT NULL,
	"is_societe" boolean DEFAULT false NOT NULL,
	"kbis" varchar(64),
	"zone" text,
	"country_code" varchar(4),
	"active" boolean DEFAULT true NOT NULL,
	"rating" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"label" varchar(160)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"status" "delivery_mission_status" NOT NULL,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"type" "delivery_vehicle_type" NOT NULL,
	"immatriculation" varchar(32),
	"capacite_kg" numeric(10, 2),
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "breakdown_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"status" "breakdown_status" DEFAULT 'acceptee' NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	"montant_final" numeric(12, 2),
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "breakdown_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nom" varchar(160) NOT NULL,
	"kbis" varchar(64),
	"assurance" varchar(96),
	"zone" text,
	"country_code" varchar(4),
	"tarif_base" numeric(12, 2),
	"active" boolean DEFAULT true NOT NULL,
	"rating" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "breakdown_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"montant" numeric(12, 2) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"description" text,
	"accepte" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "breakdown_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider_id" integer,
	"status" "breakdown_status" DEFAULT 'demande' NOT NULL,
	"type_panne" varchar(128),
	"description" text,
	"vehicule" varchar(160),
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"adresse" text,
	"urgent" boolean DEFAULT false NOT NULL,
	"photos" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "driver_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"type_doc" varchar(64) NOT NULL,
	"url" text,
	"expires_at" date,
	"verifie" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"user_id" integer,
	"nom" varchar(160) NOT NULL,
	"type" "transport_company_type" DEFAULT 'vtc' NOT NULL,
	"telephone" varchar(32),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transport_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"vehicle_id" integer,
	"driver_id" integer,
	"status" "transport_booking_status" DEFAULT 'demande' NOT NULL,
	"date_service" timestamp,
	"depart" text,
	"arrivee" text,
	"prix" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transport_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"type" "transport_company_type" DEFAULT 'vtc' NOT NULL,
	"nom" varchar(160) NOT NULL,
	"logo_url" text,
	"kbis" varchar(64),
	"adresse" text,
	"country_code" varchar(4),
	"assurance_pro" varchar(96),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transport_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"categorie" varchar(64),
	"marque" varchar(96),
	"modele" varchar(96),
	"immatriculation" varchar(32),
	"carte_grise" text,
	"assurance" text,
	"controle_technique" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customs_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"status" "import_status" NOT NULL,
	"note" text,
	"lieu" varchar(160),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"type_doc" varchar(64) NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"montant" numeric(12, 2) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"details" text,
	"accepte" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"annonce_id" integer,
	"vehicule_id" integer,
	"status" "import_status" DEFAULT 'reserve' NOT NULL,
	"transport_option" "import_transport_option",
	"pays_destination" varchar(4),
	"warehouse_id" integer,
	"code_retrait" varchar(32),
	"cout_estime" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_transport" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"transporteur" varchar(160),
	"mode_transport" varchar(64),
	"numero_suivi" varchar(96),
	"date_depart" timestamp,
	"date_arrivee_estimee" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"marque" varchar(96),
	"modele" varchar(96),
	"vin" varchar(32),
	"annee" integer,
	"valeur" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(160) NOT NULL,
	"country_code" varchar(4) NOT NULL,
	"ville" varchar(96),
	"adresse" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"montant" numeric(14, 2) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"status" "payout_status" DEFAULT 'demande' NOT NULL,
	"stripe_payout_id" varchar(96),
	"automatique" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"type" "wallet_tx_type" NOT NULL,
	"montant" numeric(14, 2) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"reference" varchar(96),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"solde_disponible" numeric(14, 2) DEFAULT '0' NOT NULL,
	"solde_attente" numeric(14, 2) DEFAULT '0' NOT NULL,
	"solde_bloque" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"stripe_connect_id" varchar(96),
	"payout_frequency" "payout_frequency" DEFAULT 'manuel' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"signer_id" integer,
	"signer_name" varchar(160),
	"signer_email" varchar(192),
	"signed_at" timestamp,
	"signature_data" text,
	"ip_address" varchar(64),
	"signed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generated_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "contract_type" NOT NULL,
	"status" "contract_status" DEFAULT 'brouillon' NOT NULL,
	"user_id" integer,
	"ref_type" varchar(64),
	"ref_id" integer,
	"titre" varchar(192),
	"pdf_url" text,
	"contenu" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installment_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"payment_id" integer,
	"level" "installment_alert_level" NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installment_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"document_id" integer,
	"status" "installment_status" DEFAULT 'contrat' NOT NULL,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installment_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"numero" integer NOT NULL,
	"montant" numeric(14, 2) NOT NULL,
	"due_date" date NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"payment_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installment_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"ref_type" varchar(64),
	"ref_id" integer,
	"status" "installment_status" DEFAULT 'demande' NOT NULL,
	"montant_total" numeric(14, 2) NOT NULL,
	"apport" numeric(14, 2) DEFAULT '0',
	"nb_echeances" integer NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"is_pro" boolean DEFAULT false NOT NULL,
	"validated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"titre" varchar(160),
	"image_url" text,
	"target_url" text,
	"position" varchar(64),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"titre" varchar(160),
	"image_url" text,
	"target_url" text,
	"emplacement" varchar(64),
	"ordre" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(160) NOT NULL,
	"description" text,
	"start_at" timestamp,
	"end_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "qr_code_type" NOT NULL,
	"code" varchar(64) NOT NULL,
	"target_url" text,
	"owner_id" integer,
	"scans" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"owner_id" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"reward" varchar(96),
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signalements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" "signalement_type" NOT NULL,
	"ref_type" varchar(64),
	"ref_id" integer,
	"description" text,
	"ticket_id" integer,
	"status" varchar(32) DEFAULT 'ouvert' NOT NULL,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" "suggestion_type" DEFAULT 'idee' NOT NULL,
	"contenu" text NOT NULL,
	"traite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_report_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"user_id" integer,
	"montant" numeric(12, 2) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"search_type" varchar(16) NOT NULL,
	"search_value" varchar(64) NOT NULL,
	"status" "vehicle_report_status" DEFAULT 'en_attente' NOT NULL,
	"kilometrage" integer,
	"controles_techniques" text,
	"sinistres" text,
	"proprietaires" text,
	"entretien" text,
	"rappels_constructeur" text,
	"score_confiance" integer,
	"result_data" text,
	"paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vin_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" varchar(32) NOT NULL,
	"report_id" integer,
	"result_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financement_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"ref_type" varchar(64),
	"ref_id" integer,
	"montant" numeric(14, 2),
	"type" varchar(64),
	"status" varchar(32) DEFAULT 'demande' NOT NULL,
	"partenaire" varchar(160),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formation_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"formation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"certificat_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formations" (
	"id" serial PRIMARY KEY NOT NULL,
	"titre" varchar(160) NOT NULL,
	"categorie" varchar(64),
	"description" text,
	"video_url" text,
	"certifiante" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "karting_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(160) NOT NULL,
	"country_code" varchar(4),
	"ville" varchar(96),
	"adresse" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "karting_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"center_id" integer,
	"titre" varchar(160) NOT NULL,
	"type" varchar(64),
	"date_event" date,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "karting_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lavage_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"station_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"date_service" timestamp,
	"prestation" varchar(96),
	"prix" numeric(12, 2),
	"status" varchar(32) DEFAULT 'demande' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lavage_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(160) NOT NULL,
	"type" varchar(64),
	"adresse" text,
	"country_code" varchar(4),
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"partenaire" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
