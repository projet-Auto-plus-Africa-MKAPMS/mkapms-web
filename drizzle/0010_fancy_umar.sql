CREATE TABLE IF NOT EXISTS "karting_fleet" (
	"id" serial PRIMARY KEY NOT NULL,
	"center_id" integer,
	"modele" varchar(160) NOT NULL,
	"marque" varchar(96) DEFAULT 'MKA.P-MS' NOT NULL,
	"fabrication_maison" boolean DEFAULT true NOT NULL,
	"numero_serie" varchar(64),
	"puissance" varchar(48),
	"statut" varchar(32) DEFAULT 'operationnel' NOT NULL,
	"photo_url" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "karting_centers" ADD COLUMN "lat" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "karting_centers" ADD COLUMN "lng" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "karting_centers" ADD COLUMN "partenaire" boolean DEFAULT false NOT NULL;