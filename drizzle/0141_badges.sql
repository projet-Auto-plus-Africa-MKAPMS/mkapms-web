CREATE TABLE IF NOT EXISTS "badges" (
  "id" serial PRIMARY KEY,
  "code" varchar(64) NOT NULL UNIQUE,
  "nom" varchar(128) NOT NULL,
  "description" text,
  "criteres" text,
  "updated_by" integer,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "badge_attributions" (
  "id" serial PRIMARY KEY,
  "badge_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "awarded_by" integer,
  "awarded_at" timestamp NOT NULL DEFAULT now()
);
