CREATE TYPE "public"."dossier_event_type" AS ENUM('achat', 'entretien', 'reparation', 'controle_technique', 'sinistre', 'photo', 'vente', 'autre');--> statement-breakpoint
CREATE TYPE "public"."loyalty_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'elite');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_accounts" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tier" "loyalty_tier" DEFAULT 'bronze' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer NOT NULL,
	"reason" varchar(128) NOT NULL,
	"ref_type" varchar(32),
	"ref_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_dossier_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"dossier_id" integer NOT NULL,
	"type" "dossier_event_type" DEFAULT 'autre' NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"amount" numeric(12, 2),
	"event_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_dossiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"marque" varchar(96),
	"modele" varchar(96),
	"immatriculation" varchar(32),
	"vin" varchar(32),
	"annee" integer,
	"kilometrage" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customs_steps" ADD COLUMN "photo_url" text;