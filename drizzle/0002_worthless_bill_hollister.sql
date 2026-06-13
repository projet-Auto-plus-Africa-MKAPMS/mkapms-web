CREATE TYPE "public"."promo_code_type" AS ENUM('pourcentage', 'montant');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(48) NOT NULL,
	"type" "promo_code_type" DEFAULT 'pourcentage' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"description" text,
	"scope" varchar(48),
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"valid_until" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN "selection_mka" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN "selection_mka_by" integer;--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN "selection_mka_at" timestamp;