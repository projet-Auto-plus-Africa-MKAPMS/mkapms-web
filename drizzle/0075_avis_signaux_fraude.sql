-- Point 49 — signaux anti-faux-avis, tracés et tranchés par un humain.
CREATE TABLE IF NOT EXISTS "review_fraud_signals" (
  "id" serial PRIMARY KEY NOT NULL,
  "review_id" integer NOT NULL,
  "author_id" integer NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" integer NOT NULL,
  "signal_type" varchar(40) NOT NULL,
  "severity" varchar(12) NOT NULL,
  "detail" text NOT NULL,
  "reviewed" boolean DEFAULT false NOT NULL,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "decision" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "review_fraud_signals_review_idx"
  ON "review_fraud_signals" ("review_id");

CREATE INDEX IF NOT EXISTS "review_fraud_signals_open_idx"
  ON "review_fraud_signals" ("reviewed", "severity", "created_at");

CREATE INDEX IF NOT EXISTS "review_fraud_signals_target_idx"
  ON "review_fraud_signals" ("target_type", "target_id");
