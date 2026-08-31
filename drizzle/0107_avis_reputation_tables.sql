-- Reviews & Reputation Engine — création des tables manquantes.
-- La migration 0074 ne fait que des ALTER TABLE (ajout de country_code).
-- Sans ces CREATE TABLE, la sonde avis_reputation reste en état dégradé.

CREATE TABLE IF NOT EXISTS "reviews_v2" (
  "id" serial PRIMARY KEY,
  "author_id" integer NOT NULL,
  "author_display_mode" varchar(16) NOT NULL DEFAULT 'full',
  "target_type" varchar(32) NOT NULL,
  "target_id" integer NOT NULL,
  "univers" varchar(64) NOT NULL,
  "transaction_type" varchar(32),
  "transaction_id" integer,
  "rating_global" integer NOT NULL,
  "criterias" jsonb NOT NULL DEFAULT '{}',
  "comment" text,
  "pros_text" text,
  "cons_text" text,
  "photos" jsonb DEFAULT '[]',
  "videos" jsonb DEFAULT '[]',
  "documents" jsonb DEFAULT '[]',
  "verified" boolean NOT NULL DEFAULT false,
  "verification_proof" varchar(128),
  "status" varchar(20) NOT NULL DEFAULT 'publie',
  "moderation_reason" text,
  "moderated_by" integer,
  "moderated_at" timestamp,
  "response_text" text,
  "response_at" timestamp,
  "response_by" integer,
  "response_documents" jsonb DEFAULT '[]',
  "client_reply_text" text,
  "client_reply_at" timestamp,
  "official_response_text" text,
  "official_response_at" timestamp,
  "official_response_by" integer,
  "helpful_count" integer NOT NULL DEFAULT 0,
  "reported_count" integer NOT NULL DEFAULT 0,
  "language" varchar(8) DEFAULT 'fr',
  "translated_comment" text,
  "translated_language" varchar(8),
  "device_type" varchar(16),
  "ip_city" varchar(128),
  "ip_country" varchar(4),
  "country_code" varchar(4),
  "author_loyalty_tier" varchar(16),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "review_requests" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "transaction_type" varchar(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" integer NOT NULL,
  "univers" varchar(64) NOT NULL,
  "sent_at" timestamp NOT NULL DEFAULT now(),
  "reminder_sent_at" timestamp,
  "completed_at" timestamp,
  "review_id" integer,
  "status" varchar(16) NOT NULL DEFAULT 'envoye',
  "country_code" varchar(4),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "review_aggregates" (
  "id" serial PRIMARY KEY,
  "target_type" varchar(32) NOT NULL,
  "target_id" integer NOT NULL,
  "univers" varchar(64) NOT NULL,
  "total_reviews" integer NOT NULL DEFAULT 0,
  "average_rating_x100" integer NOT NULL DEFAULT 0,
  "rating_5_count" integer NOT NULL DEFAULT 0,
  "rating_4_count" integer NOT NULL DEFAULT 0,
  "rating_3_count" integer NOT NULL DEFAULT 0,
  "rating_2_count" integer NOT NULL DEFAULT 0,
  "rating_1_count" integer NOT NULL DEFAULT 0,
  "verified_count" integer NOT NULL DEFAULT 0,
  "response_rate_pct" integer NOT NULL DEFAULT 0,
  "criteria_averages" jsonb DEFAULT '{}',
  "last_review_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "reviews_v2_target_idx" ON "reviews_v2" ("target_type", "target_id", "univers", "status");
CREATE INDEX IF NOT EXISTS "reviews_v2_author_idx" ON "reviews_v2" ("author_id", "created_at");
CREATE INDEX IF NOT EXISTS "reviews_v2_country_idx" ON "reviews_v2" ("country_code", "univers", "status");
CREATE INDEX IF NOT EXISTS "review_requests_user_idx" ON "review_requests" ("user_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "review_requests_txn_unique" ON "review_requests" ("user_id", "transaction_type", "transaction_id");
CREATE UNIQUE INDEX IF NOT EXISTS "review_aggregates_target_unique" ON "review_aggregates" ("target_type", "target_id", "univers");
