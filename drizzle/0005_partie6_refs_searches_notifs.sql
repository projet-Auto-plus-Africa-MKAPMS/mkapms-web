CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(48) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text,
	"url" varchar(255),
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"label" varchar(128) NOT NULL,
	"univers" varchar(32) DEFAULT 'vente' NOT NULL,
	"filters" jsonb NOT NULL,
	"alert_enabled" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annonces" ADD COLUMN "reference" varchar(24);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reference" varchar(24);--> statement-breakpoint
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_reference_unique" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reference_unique" UNIQUE("reference");