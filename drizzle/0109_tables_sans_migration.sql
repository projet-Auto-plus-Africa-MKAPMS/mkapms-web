-- Tables déclarées dans le schéma Drizzle mais jamais créées par aucune migration.
-- Relevé par comparaison schéma ↔ drizzle/*.sql : 53 tables, dont celles du
-- Core Engine (ce_*, 29 tables : journal, santé, orchestration, ...), du moteur
-- Avis & Réputation (review_*, 17), de Finance+ (finplus_*, 6) et des demandes
-- de publicité (pub_requests). En production, le seed de structure échouait sur
-- « relation review_univers_registry does not exist » et toute procédure du
-- Core Engine Beta touchant ces tables levait une erreur.
-- Généré depuis le schéma (drizzle-kit/api) ; IF NOT EXISTS pour rester idempotent.

CREATE TABLE IF NOT EXISTS "review_badge_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(32) NOT NULL,
	"label" varchar(64) NOT NULL,
	"label_en" varchar(64),
	"description" varchar(255) NOT NULL,
	"icon" varchar(32) NOT NULL,
	"color" varchar(16) DEFAULT '#FFD700' NOT NULL,
	"category" varchar(32) NOT NULL,
	"conditions" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_badge_definitions_key_unique" UNIQUE("key")
);

CREATE TABLE IF NOT EXISTS "review_badges_awarded" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_key" varchar(32) NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "review_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" jsonb NOT NULL,
	"label" varchar(128) NOT NULL,
	"description" text,
	"category" varchar(32) NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_config_key_unique" UNIQUE("key")
);

CREATE TABLE IF NOT EXISTS "review_contestations" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"contester_id" integer NOT NULL,
	"reason" varchar(32) NOT NULL,
	"explanation" text,
	"evidence" jsonb DEFAULT '[]',
	"status" varchar(16) DEFAULT 'en_attente' NOT NULL,
	"handled_by" integer,
	"handled_at" timestamp,
	"decision" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_criteria_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"univers" varchar(64) NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"criteria_key" varchar(32) NOT NULL,
	"criteria_label" varchar(128) NOT NULL,
	"criteria_label_en" varchar(128),
	"criteria_icon" varchar(32),
	"ordre" integer DEFAULT 0 NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"business_type" varchar(32) NOT NULL,
	"employee_name" varchar(128) NOT NULL,
	"employee_role" varchar(64) NOT NULL,
	"user_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_exit_surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"annonce_id" integer,
	"reason" varchar(32) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_feature_satisfaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feature_key" varchar(64) NOT NULL,
	"feature_label" varchar(200) NOT NULL,
	"satisfied" boolean,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_helpful" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"action" varchar(32) NOT NULL,
	"actor_id" integer,
	"previous_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_monthly_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"target_id" integer NOT NULL,
	"univers" varchar(64) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"average_rating_x100" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"verified_count" integer DEFAULT 0 NOT NULL,
	"criteria_averages" jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "review_objectives" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"univers" varchar(64),
	"target_rating_x100" integer NOT NULL,
	"current_rating_x100" integer DEFAULT 0 NOT NULL,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"status" varchar(12) DEFAULT 'actif' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"reason" varchar(32) NOT NULL,
	"details" text,
	"status" varchar(12) DEFAULT 'ouvert' NOT NULL,
	"handled_by" integer,
	"handled_at" timestamp,
	"decision" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_trust_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"anciennete_points" integer DEFAULT 0 NOT NULL,
	"transactions_points" integer DEFAULT 0 NOT NULL,
	"avis_verifies_points" integer DEFAULT 0 NOT NULL,
	"taux_reponse_points" integer DEFAULT 0 NOT NULL,
	"taux_annulation_points" integer DEFAULT 0 NOT NULL,
	"litiges_points" integer DEFAULT 0 NOT NULL,
	"documents_verifies_points" integer DEFAULT 0 NOT NULL,
	"activite_recente_points" integer DEFAULT 0 NOT NULL,
	"respect_delais_points" integer DEFAULT 0 NOT NULL,
	"last_calculated_at" timestamp DEFAULT now() NOT NULL,
	"history" jsonb DEFAULT '[]',
	CONSTRAINT "review_trust_scores_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "review_univers_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"label" varchar(128) NOT NULL,
	"label_en" varchar(128),
	"icon" varchar(32),
	"active" boolean DEFAULT true NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_univers_registry_key_unique" UNIQUE("key")
);

CREATE TABLE IF NOT EXISTS "review_webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_id" integer NOT NULL,
	"event" varchar(64) NOT NULL,
	"payload" jsonb,
	"status_code" integer,
	"response_body" text,
	"success" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(128),
	"events" jsonb DEFAULT '[]' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_ai_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(64) NOT NULL,
	"period" varchar(32) NOT NULL,
	"data" jsonb NOT NULL,
	"insights" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_ai_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" integer,
	"predicted_value" numeric(12, 2),
	"confidence" numeric(5, 2),
	"horizon" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(128) NOT NULL,
	"key_hash" varchar(128) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"scopes" jsonb NOT NULL,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_api_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key_id" integer NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(8) NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_automation_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"action_type" varchar(64) NOT NULL,
	"target_module" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'en_attente' NOT NULL,
	"result" jsonb,
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_automation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"source_module" varchar(64) NOT NULL,
	"source_id" integer,
	"user_id" integer,
	"payload" jsonb,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_b2b_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"seller_type" varchar(64) NOT NULL,
	"category" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"marque" varchar(64),
	"reference" varchar(64),
	"prix_unitaire_ht" numeric(12, 2),
	"devise" varchar(8) DEFAULT 'EUR' NOT NULL,
	"quantite_min" integer DEFAULT 1 NOT NULL,
	"stock" integer,
	"delai_jours" integer,
	"country" varchar(4),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_b2b_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(32),
	"buyer_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"total_ht" numeric(12, 2),
	"status" varchar(32) DEFAULT 'en_attente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ce_b2b_orders_reference_unique" UNIQUE("reference")
);

CREATE TABLE IF NOT EXISTS "ce_engine_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"centre" varchar(64) NOT NULL,
	"status" varchar(16) DEFAULT 'actif' NOT NULL,
	"last_checked_at" timestamp DEFAULT now() NOT NULL,
	"avg_response_ms" integer,
	"error_count_24h" integer DEFAULT 0 NOT NULL,
	"request_count_24h" integer DEFAULT 0 NOT NULL,
	"uptime" numeric(5, 2) DEFAULT '100' NOT NULL,
	"last_error" text,
	"metadata" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ce_engine_health_centre_unique" UNIQUE("centre")
);

CREATE TABLE IF NOT EXISTS "ce_engine_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"centre" varchar(64) NOT NULL,
	"action" varchar(128) NOT NULL,
	"level" varchar(16) DEFAULT 'info' NOT NULL,
	"message" text,
	"duration_ms" integer,
	"user_id" integer,
	"metadata" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_formation_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(64) NOT NULL,
	"level" varchar(32) DEFAULT 'debutant' NOT NULL,
	"duration_minutes" integer,
	"video_url" varchar(500),
	"thumbnail_url" varchar(500),
	"badge_on_completion" varchar(64),
	"certification_on_completion" boolean DEFAULT false NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_formation_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"passed" boolean,
	"certification_url" varchar(500),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "ce_formation_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"questions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_formation_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text,
	"video_url" varchar(500),
	"ordre" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_supplier_catalogue" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"reference" varchar(64) NOT NULL,
	"designation" varchar(255) NOT NULL,
	"marque" varchar(64),
	"prix_ht" numeric(12, 2),
	"devise" varchar(8) DEFAULT 'EUR' NOT NULL,
	"stock" integer,
	"delai_jours" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"country" varchar(4) NOT NULL,
	"city" varchar(128),
	"category" varchar(64) NOT NULL,
	"specialites" jsonb,
	"marques" jsonb,
	"contact_email" varchar(255),
	"contact_phone" varchar(32),
	"website" varchar(255),
	"delai_moyen_jours" integer,
	"note_moyenne" numeric(3, 2),
	"certified" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_distribution_depots" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"country" varchar(4) NOT NULL,
	"city" varchar(128) NOT NULL,
	"address" text,
	"capacity" integer,
	"current_load" integer DEFAULT 0 NOT NULL,
	"manager_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_distribution_shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(32),
	"from_depot_id" integer,
	"to_depot_id" integer,
	"transporteur_id" integer,
	"status" varchar(32) DEFAULT 'prepare' NOT NULL,
	"nb_colis" integer DEFAULT 1 NOT NULL,
	"poids_kg" numeric(8, 2),
	"tracking_url" varchar(255),
	"estimated_delivery" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ce_distribution_shipments_reference_unique" UNIQUE("reference")
);

CREATE TABLE IF NOT EXISTS "ce_document_vault" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"owner_type" varchar(32) NOT NULL,
	"category" varchar(64) NOT NULL,
	"title" varchar(200) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"mime_type" varchar(64),
	"size_bytes" integer,
	"encrypted" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_ecosystem_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_module" varchar(64) NOT NULL,
	"source_action" varchar(64) NOT NULL,
	"target_module" varchar(64) NOT NULL,
	"target_action" varchar(64) NOT NULL,
	"description" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_expansion_countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(4) NOT NULL,
	"country_name" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'etude' NOT NULL,
	"default_language" varchar(8) DEFAULT 'fr' NOT NULL,
	"default_currency" varchar(8) DEFAULT 'EUR' NOT NULL,
	"vat_rate" numeric(5, 2),
	"payment_methods" jsonb,
	"legal_requirements" jsonb,
	"launch_date" timestamp,
	"manager_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ce_expansion_countries_country_code_unique" UNIQUE("country_code")
);

CREATE TABLE IF NOT EXISTS "ce_orchestration_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"source_module" varchar(64) NOT NULL,
	"actions_triggered" integer DEFAULT 0 NOT NULL,
	"actions_succeeded" integer DEFAULT 0 NOT NULL,
	"actions_failed" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"reason" varchar(255),
	"seen" boolean DEFAULT false NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);

CREATE TABLE IF NOT EXISTS "ce_search_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" integer NOT NULL,
	"univers" varchar(64) NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"keywords" jsonb,
	"city" varchar(128),
	"country" varchar(4),
	"image_url" varchar(500),
	"url" varchar(500),
	"score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_service_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"trigger_event" varchar(64) NOT NULL,
	"trigger_univers" varchar(64) NOT NULL,
	"recommended_service" varchar(64) NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb,
	"message_template" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_strategic_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"sector" varchar(64) NOT NULL,
	"country" varchar(4),
	"contact_name" varchar(128),
	"contact_email" varchar(255),
	"contact_phone" varchar(32),
	"contract_url" varchar(500),
	"commission_rate" numeric(5, 2),
	"status" varchar(32) DEFAULT 'prospect' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_user_behavior" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(64) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ce_workflow_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"event_id" integer,
	"status" varchar(32) DEFAULT 'en_cours' NOT NULL,
	"steps_completed" integer DEFAULT 0 NOT NULL,
	"steps_total" integer DEFAULT 0 NOT NULL,
	"logs" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "ce_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"trigger_event" varchar(64) NOT NULL,
	"trigger_conditions" jsonb,
	"actions" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" integer NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"last_executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "finplus_action_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"contrat_id" integer,
	"vehicule_id" integer,
	"admin_id" integer,
	"action" varchar(64) NOT NULL,
	"details" text,
	"ip_address" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "finplus_contrats" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"annonce_id" integer,
	"type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'simulation' NOT NULL,
	"prix_vehicule" numeric(14, 2),
	"apport_initial" numeric(14, 2) DEFAULT '0',
	"duree_mois" integer,
	"mensualite" numeric(14, 2),
	"option_achat" numeric(14, 2),
	"nombre_fois" integer,
	"montant_par_fois" numeric(14, 2),
	"total_financement" numeric(14, 2),
	"vehicule_type" varchar(32),
	"vehicule_marque" varchar(96),
	"vehicule_modele" varchar(96),
	"vehicule_plaque" varchar(32),
	"client_type" varchar(16) DEFAULT 'particulier',
	"signature_date" timestamp,
	"signature_contrat" boolean DEFAULT false,
	"signature_conditions" boolean DEFAULT false,
	"signature_autorisations" boolean DEFAULT false,
	"livraison_statut" varchar(32),
	"livraison_date" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "finplus_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"contrat_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"nom" varchar(256),
	"url" text,
	"statut" varchar(32) DEFAULT 'en_attente',
	"ia_score" integer,
	"ia_analyse" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "finplus_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"contrat_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"titre" varchar(256),
	"message" text,
	"lu" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "finplus_paiements" (
	"id" serial PRIMARY KEY NOT NULL,
	"contrat_id" integer NOT NULL,
	"numero" integer NOT NULL,
	"montant" numeric(14, 2) NOT NULL,
	"date_echeance" timestamp NOT NULL,
	"date_paiement" timestamp,
	"status" varchar(32) DEFAULT 'a_venir' NOT NULL,
	"stripe_payment_id" varchar(256),
	"facture_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "finplus_vehicules" (
	"id" serial PRIMARY KEY NOT NULL,
	"contrat_id" integer NOT NULL,
	"annonce_id" integer,
	"gps_device_id" varchar(128),
	"finance_status" varchar(32) DEFAULT 'actif',
	"immobilizer_status" varchar(32) DEFAULT 'inactif',
	"last_vehicle_position" jsonb,
	"payment_status" varchar(32) DEFAULT 'a_jour',
	"kilometrage" integer,
	"niveau_batterie" integer,
	"alerte_entretien" boolean DEFAULT false,
	"historique_deplacements" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pub_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"entreprise" varchar(200) NOT NULL,
	"type" varchar(100) NOT NULL,
	"emplacement" varchar(64) NOT NULL,
	"description" text,
	"contact_name" varchar(128),
	"contact_email" varchar(255),
	"contact_phone" varchar(32),
	"budget" varchar(64),
	"duree" varchar(64),
	"status" varchar(32) DEFAULT 'en_attente' NOT NULL,
	"user_id" integer,
	"decided_by" integer,
	"decided_at" timestamp,
	"refusal_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

