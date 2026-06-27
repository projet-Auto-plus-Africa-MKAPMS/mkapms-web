CREATE TYPE "public"."backup_status" AS ENUM('success', 'failed', 'running');--> statement-breakpoint
CREATE TYPE "public"."experiment_status" AS ENUM('brouillon', 'test', 'actif', 'desactive');--> statement-breakpoint
CREATE TYPE "public"."franchise_status" AS ENUM('prospect', 'active', 'suspendue', 'resiliee');--> statement-breakpoint
CREATE TYPE "public"."franchise_type" AS ENUM('garage', 'lavage', 'karting', 'agence', 'autre');--> statement-breakpoint
CREATE TYPE "public"."insurance_status" AS ENUM('active', 'expiree', 'suspendue');--> statement-breakpoint
CREATE TYPE "public"."insurance_type" AS ENUM('location', 'transport', 'garage', 'vtc', 'livraison', 'autre');--> statement-breakpoint
CREATE TYPE "public"."monitoring_severity" AS ENUM('info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TYPE "public"."site_type" AS ENUM('agence', 'entrepot', 'garage', 'karting', 'lavage', 'autre');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backup_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(32) DEFAULT 'database' NOT NULL,
	"status" "backup_status" DEFAULT 'success' NOT NULL,
	"location" text,
	"size_bytes" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "franchises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "franchise_type" DEFAULT 'garage' NOT NULL,
	"country_code" varchar(4) NOT NULL,
	"zone" varchar(160),
	"owner_id" integer,
	"redevance" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"contract_start" timestamp,
	"contract_end" timestamp,
	"status" "franchise_status" DEFAULT 'prospect' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "insurance_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "insurance_type" DEFAULT 'autre' NOT NULL,
	"compagnie" varchar(160) NOT NULL,
	"numero_police" varchar(96),
	"ref_type" varchar(32),
	"ref_id" integer,
	"country_code" varchar(4),
	"prime_mensuelle" numeric(12, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"date_debut" timestamp,
	"date_fin" timestamp,
	"document_url" text,
	"status" "insurance_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lab_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(48),
	"description" text,
	"status" "experiment_status" DEFAULT 'brouillon' NOT NULL,
	"config" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_experiments_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(48) NOT NULL,
	"severity" "monitoring_severity" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"meta" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"subsidiary_id" integer,
	"type" "site_type" DEFAULT 'agence' NOT NULL,
	"name" varchar(160) NOT NULL,
	"country_code" varchar(4) NOT NULL,
	"city" varchar(96),
	"address" text,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"manager_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subsidiaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"country_code" varchar(4) NOT NULL,
	"city" varchar(96),
	"manager_id" integer,
	"budget" numeric(14, 2),
	"currency" varchar(4) DEFAULT 'EUR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
