-- Global Visibility Engine — Moteur d'Audience mondial (table `visibility_audiences`).
-- Audiences construites à partir des signaux réels et gratuits de la plateforme.
-- `source = owner` : audience propriétaire (gratuite). `source = external_ad` :
-- audience de campagne sponsorisée, toujours préparée en `draft` (aucune dépense).
-- Table isolée et additive.

CREATE TABLE IF NOT EXISTS "visibility_audiences" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"audience_key" varchar(180) NOT NULL,
	"label" varchar(200) NOT NULL,
	"dimension" varchar(32) NOT NULL,
	"value" varchar(160) NOT NULL,
	"country" varchar(2),
	"size" integer DEFAULT 0 NOT NULL,
	"source" varchar(24) DEFAULT 'owner' NOT NULL,
	"status" varchar(24) DEFAULT 'ready' NOT NULL,
	"metadata" jsonb,
	"refreshed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "visibility_audiences_audience_key_unique" UNIQUE("audience_key")
);

CREATE INDEX IF NOT EXISTS "visibility_audiences_dim_idx" ON "visibility_audiences" ("dimension","source");
CREATE INDEX IF NOT EXISTS "visibility_audiences_country_idx" ON "visibility_audiences" ("country");
