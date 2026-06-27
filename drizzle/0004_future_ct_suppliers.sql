CREATE TABLE IF NOT EXISTS "controle_technique_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(160) NOT NULL,
	"country_code" varchar(4),
	"ville" varchar(96),
	"adresse" text,
	"horaires" text,
	"telephone" varchar(32),
	"rating" numeric(3, 2) DEFAULT '0',
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "controle_technique_rdv" (
	"id" serial PRIMARY KEY NOT NULL,
	"center_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"vehicule_id" integer,
	"date_rdv" timestamp,
	"prix" numeric(12, 2),
	"status" varchar(32) DEFAULT 'demande' NOT NULL,
	"resultat" varchar(32),
	"prochain_controle" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"type" varchar(64),
	"country_code" varchar(4),
	"services" text,
	"contact_email" varchar(160),
	"contact_telephone" varchar(32),
	"notation_interne" numeric(3, 2) DEFAULT '0',
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
