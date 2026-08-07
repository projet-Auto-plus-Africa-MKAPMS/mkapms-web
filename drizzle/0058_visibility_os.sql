-- Global Visibility Engine (MKA.P-MS) — moteur central de visibilité mondiale.
-- Tables isolées et additives : canaux configurables, contenu central unique,
-- déclinaisons par canal, publications (préparées → validées), événements.
-- Ne remplace aucune table existante (SEO OS, audience, etc. restent intacts).

CREATE TABLE IF NOT EXISTS "visibility_channels" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"channel_key" varchar(64) NOT NULL,
	"label" varchar(120) NOT NULL,
	"kind" varchar(32) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"requires_budget" boolean DEFAULT false NOT NULL,
	"auto_publish" boolean DEFAULT false NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "visibility_channels_channel_key_unique" UNIQUE("channel_key")
);

CREATE TABLE IF NOT EXISTS "visibility_content" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_type" varchar(48) NOT NULL,
	"source_id" varchar(64),
	"title" varchar(200) NOT NULL,
	"body" varchar(2000) NOT NULL,
	"lang" varchar(8) DEFAULT 'fr' NOT NULL,
	"country" varchar(2),
	"media_url" varchar(1000),
	"link" varchar(1000),
	"status" varchar(24) DEFAULT 'ready' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "visibility_variants" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"channel_key" varchar(64) NOT NULL,
	"text" varchar(2200) NOT NULL,
	"hashtags" varchar(500),
	"status" varchar(24) DEFAULT 'prepared' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "visibility_publications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"variant_id" integer,
	"content_id" integer NOT NULL,
	"channel_key" varchar(64) NOT NULL,
	"country" varchar(2),
	"lang" varchar(8),
	"status" varchar(24) DEFAULT 'prepared' NOT NULL,
	"external_ref" varchar(255),
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"validated_by" integer,
	"detail" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "visibility_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"channel_key" varchar(64),
	"kind" varchar(32) NOT NULL,
	"source_type" varchar(48),
	"source_id" varchar(64),
	"country" varchar(2),
	"value" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "visibility_content_source_idx" ON "visibility_content" ("source_type","source_id");
CREATE INDEX IF NOT EXISTS "visibility_variants_content_idx" ON "visibility_variants" ("content_id");
CREATE INDEX IF NOT EXISTS "visibility_publications_status_idx" ON "visibility_publications" ("status");
CREATE INDEX IF NOT EXISTS "visibility_events_kind_idx" ON "visibility_events" ("kind","created_at");
