-- MKA.P-MS Pro Portal Engine — portail professionnel mondial (.pro).
-- Métiers, catalogue de services activables à la carte et parcours en cours.
-- Aucun prix stocké ici : un module pointe vers un code produit du registre
-- central des tarifs (Payment Engine), seule source de vérité des montants.
-- Additif : aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "pro_portal_professions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(48) NOT NULL,
	"label" varchar(120) NOT NULL,
	"description" text,
	"family" varchar(32) DEFAULT 'service' NOT NULL,
	"default_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pro_portal_professions_code_unique" UNIQUE("code")
);

CREATE INDEX IF NOT EXISTS "pro_portal_professions_family_idx" ON "pro_portal_professions" ("family","active");

CREATE TABLE IF NOT EXISTS "pro_portal_modules" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(48) NOT NULL,
	"label" varchar(120) NOT NULL,
	"description" text,
	"family" varchar(32) DEFAULT 'gestion' NOT NULL,
	"product_code" varchar(64),
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pro_portal_modules_code_unique" UNIQUE("code")
);

CREATE INDEX IF NOT EXISTS "pro_portal_modules_family_idx" ON "pro_portal_modules" ("family","active");

CREATE TABLE IF NOT EXISTS "pro_portal_drafts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"session_key" varchar(64) NOT NULL,
	"user_id" integer,
	"profession_code" varchar(48),
	"country_code" varchar(2),
	"module_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"step" varchar(24) DEFAULT 'metier' NOT NULL,
	"quote" jsonb,
	"status" varchar(16) DEFAULT 'en_cours' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pro_portal_drafts_session_key_unique" UNIQUE("session_key")
);

CREATE INDEX IF NOT EXISTS "pro_portal_drafts_user_idx" ON "pro_portal_drafts" ("user_id");
CREATE INDEX IF NOT EXISTS "pro_portal_drafts_status_idx" ON "pro_portal_drafts" ("status","updated_at");
