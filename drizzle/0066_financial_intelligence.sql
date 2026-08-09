-- Financial Intelligence (point 27) : registre des anomalies financières détectées.
CREATE TABLE IF NOT EXISTS "finance_anomalies" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(48) NOT NULL,
  "severity" varchar(16) DEFAULT 'a_surveiller' NOT NULL,
  "entity_type" varchar(32) NOT NULL,
  "entity_id" varchar(64) NOT NULL,
  "user_id" integer,
  "amount" numeric(12, 2),
  "currency" varchar(8),
  "detail" text NOT NULL,
  "status" varchar(16) DEFAULT 'ouverte' NOT NULL,
  "resolution_note" text,
  "resolved_by" integer,
  "resolved_at" timestamp,
  "context" jsonb,
  "detected_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "finance_anomalies_unique_idx" ON "finance_anomalies" ("code","entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "finance_anomalies_status_idx" ON "finance_anomalies" ("status","severity");
