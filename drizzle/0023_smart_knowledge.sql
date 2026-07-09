-- Smart Engine — Feature 16 : Connaissances externes (veille / benchmark)

CREATE TABLE IF NOT EXISTS "smart_knowledge" (
  "id" bigserial PRIMARY KEY,
  "category" varchar(64) NOT NULL,
  "source" varchar(160),
  "insight" text NOT NULL,
  "recommendation" text,
  "url" varchar(512),
  "added_by" integer,
  "applied" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_knowledge_category_idx" ON "smart_knowledge" ("category");
