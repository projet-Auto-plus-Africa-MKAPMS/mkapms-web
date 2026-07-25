-- SEO OS — tables de référencement (idempotent, sûr sur base existante)
CREATE TABLE IF NOT EXISTS "seo_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(512) NOT NULL,
	"title" varchar(160) NOT NULL,
	"meta_description" varchar(320) NOT NULL,
	"h1" varchar(200),
	"content" text,
	"keywords" jsonb DEFAULT '[]',
	"page_type" varchar(32) NOT NULL,
	"univers" varchar(32),
	"city" varchar(128),
	"country" varchar(4),
	"canonical_url" text,
	"og_image" text,
	"schema_markup" jsonb,
	"indexed" boolean DEFAULT true NOT NULL,
	"priority" varchar(4) DEFAULT '0.7' NOT NULL,
	"change_freq" varchar(16) DEFAULT 'weekly' NOT NULL,
	"last_indexed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"univers" varchar(32) NOT NULL,
	"keyword" varchar(128) NOT NULL,
	"volume" integer,
	"difficulty" integer,
	"language" varchar(4) DEFAULT 'fr' NOT NULL,
	"country" varchar(4) DEFAULT 'FR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_indexing_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"action" varchar(16) NOT NULL,
	"source" varchar(32) NOT NULL,
	"source_id" integer,
	"success" boolean DEFAULT false NOT NULL,
	"response_code" integer,
	"response_body" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_blog_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(256) NOT NULL,
	"title" varchar(200) NOT NULL,
	"meta_description" varchar(320) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"cover_image" text,
	"category" varchar(64) NOT NULL,
	"tags" jsonb DEFAULT '[]',
	"keywords" jsonb DEFAULT '[]',
	"schema_markup" jsonb,
	"author_id" integer,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_blog_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" text NOT NULL,
	"description" varchar(255),
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_pages_type_idx" ON "seo_pages" ("page_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_pages_indexed_idx" ON "seo_pages" ("indexed");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_pages_city_idx" ON "seo_pages" ("city");
