CREATE TYPE "public"."offer_status" AS ENUM('en_attente', 'acceptee', 'refusee', 'contre_offre', 'annulee');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_offers" (
  "id" serial PRIMARY KEY,
  "thread_id" integer NOT NULL,
  "annonce_id" integer NOT NULL,
  "from_user_id" integer NOT NULL,
  "montant" numeric(12, 2) NOT NULL,
  "devise" varchar(4) NOT NULL DEFAULT 'EUR',
  "status" "offer_status" NOT NULL DEFAULT 'en_attente',
  "precedente_offre_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "repondue_a" timestamp
);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "offer_id" integer;
