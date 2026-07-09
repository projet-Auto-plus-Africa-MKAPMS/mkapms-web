-- Smart Engine — Feature 15 : Apprentissage privé PDG (chat PDG ↔ Système Intelligent)

DO $$ BEGIN CREATE TYPE "smart_teaching_role" AS ENUM ('pdg', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "smart_teachings" (
  "id" bigserial PRIMARY KEY,
  "author_id" integer,
  "role" "smart_teaching_role" NOT NULL,
  "topic" varchar(128),
  "message" text NOT NULL,
  "is_lesson" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_teachings_lesson_idx" ON "smart_teachings" ("is_lesson");
CREATE INDEX IF NOT EXISTS "smart_teachings_created_idx" ON "smart_teachings" ("created_at");
