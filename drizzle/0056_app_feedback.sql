-- Notation de l'application / d'un service / d'un client par les comptes particuliers.
-- Table dédiée : ne remplace pas `reviews` (avis vendeur/garage lié à une réservation).
CREATE TABLE IF NOT EXISTS "app_feedback" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"target_type" varchar(32) DEFAULT 'application' NOT NULL,
	"target_ref" varchar(160),
	"target_label" varchar(200),
	"rating" integer NOT NULL,
	"comment" text,
	"status" varchar(24) DEFAULT 'nouveau' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_feedback_user_idx" ON "app_feedback" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_feedback_target_idx" ON "app_feedback" ("target_type");
