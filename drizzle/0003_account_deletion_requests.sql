CREATE TABLE IF NOT EXISTS "account_deletion_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_user_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"reason" text,
	"status" varchar(24) DEFAULT 'en_attente' NOT NULL,
	"decided_by" integer,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
