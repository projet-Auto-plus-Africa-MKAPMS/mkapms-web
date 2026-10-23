-- Code secret du coffre : chaque personne autorisée (PDG ou employé explicitement
-- habilité) choisit son propre code numérique pour confirmer les actions sensibles
-- du coffre, à la place d'une simple session déjà ouverte.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coffre_acces" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_coffre_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "in_coffre_codes_user_id_unique" UNIQUE("user_id")
);
