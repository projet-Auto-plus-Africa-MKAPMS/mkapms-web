CREATE TYPE "public"."annonce_ownership" AS ENUM('client', 'plateforme', 'partenaire');--> statement-breakpoint
CREATE TYPE "public"."warehouse_type" AS ENUM('vehicules', 'pieces', 'mixte');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('ouvert', 'en_analyse', 'resolu', 'rembourse', 'clos');--> statement-breakpoint
CREATE TYPE "public"."dispute_univers" AS ENUM('vente', 'location', 'livraison', 'pieces', 'garage', 'autre');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('fournisseur_vehicules', 'fournisseur_pieces', 'transporteur', 'garage', 'vtc', 'depanneur', 'lavage', 'karting', 'autre');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" varchar(96) NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"import_rules" text,
	"customs_rules" text,
	"taxes" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "country_configs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dispute_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"dispute_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"kind" varchar(16) DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(24),
	"opened_by" integer NOT NULL,
	"against_user_id" integer,
	"univers" "dispute_univers" DEFAULT 'autre' NOT NULL,
	"ref_type" varchar(32),
	"ref_id" integer,
	"category" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'ouvert' NOT NULL,
	"resolution" text,
	"amount_refunded" numeric(12, 2),
	"decided_by" integer,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "partner_type" DEFAULT 'autre' NOT NULL,
	"country" varchar(4),
	"contact_email" varchar(255),
	"contact_phone" varchar(32),
	"rating" numeric(3, 2) DEFAULT '0',
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"kind" varchar(16) DEFAULT 'entree' NOT NULL,
	"item_type" varchar(32) DEFAULT 'vehicule' NOT NULL,
	"item_ref" varchar(128),
	"quantity" integer DEFAULT 1 NOT NULL,
	"note" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN "ownership" "annonce_ownership" DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "ip_address" varchar(64);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" varchar(255);--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "responsable" varchar(160);--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "type" "warehouse_type" DEFAULT 'mixte' NOT NULL;