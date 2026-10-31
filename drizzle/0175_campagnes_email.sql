ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "unsubscribe_token" varchar(64);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_campaigns" (
  "id" serial PRIMARY KEY,
  "subject" varchar(200) NOT NULL,
  "message" text NOT NULL,
  "pays" varchar(2),
  "status" varchar(16) NOT NULL DEFAULT 'draft',
  "created_by" integer,
  "total_recipients" integer NOT NULL DEFAULT 0,
  "total_sent" integer NOT NULL DEFAULT 0,
  "total_failed" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "sent_at" timestamp
);
