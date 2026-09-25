CREATE TYPE "public"."waitlist_status" AS ENUM('en_attente', 'annule');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "annonce_id" integer NOT NULL,
  "status" "waitlist_status" NOT NULL DEFAULT 'en_attente',
  "created_at" timestamp NOT NULL DEFAULT now()
);
