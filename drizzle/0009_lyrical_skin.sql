CREATE TYPE "public"."goods_receipt_status" AS ENUM('en_attente', 'conforme', 'non_conforme', 'partiel');--> statement-breakpoint
CREATE TYPE "public"."hr_contract_type" AS ENUM('cdi', 'cdd', 'stage', 'freelance', 'autre');--> statement-breakpoint
CREATE TYPE "public"."hr_leave_status" AS ENUM('demande', 'approuve', 'refuse');--> statement-breakpoint
CREATE TYPE "public"."hr_leave_type" AS ENUM('conge', 'absence', 'maladie', 'formation');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('video', 'photo', 'social', 'campagne', 'autre');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('brouillon', 'envoye', 'confirme', 'recu_partiel', 'recu', 'annule');--> statement-breakpoint
CREATE TYPE "public"."quality_grade" AS ENUM('A+', 'A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."quality_target" AS ENUM('garage', 'vendeur', 'livreur', 'vtc', 'partenaire');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"status" "goods_receipt_status" DEFAULT 'en_attente' NOT NULL,
	"quality_note" text,
	"received_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"score" integer,
	"objectifs" text,
	"commentaire" text,
	"prime" numeric(12, 2),
	"evaluated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_leaves" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "hr_leave_type" DEFAULT 'conge' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" "hr_leave_status" DEFAULT 'demande' NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_records" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"poste" varchar(128),
	"contract_type" "hr_contract_type" DEFAULT 'cdi' NOT NULL,
	"salaire" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"date_embauche" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "media_type" DEFAULT 'photo' NOT NULL,
	"title" varchar(200) NOT NULL,
	"url" text,
	"campaign_id" integer,
	"channel" varchar(64),
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer,
	"name" varchar(160) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"designation" varchar(200) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(24),
	"supplier_id" integer,
	"category" varchar(32) DEFAULT 'vehicule' NOT NULL,
	"status" "purchase_order_status" DEFAULT 'brouillon' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quality_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" "quality_target" NOT NULL,
	"target_id" integer NOT NULL,
	"grade" "quality_grade" DEFAULT 'B' NOT NULL,
	"note" text,
	"rated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
