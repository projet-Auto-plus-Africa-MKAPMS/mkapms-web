CREATE TABLE IF NOT EXISTS "objectifs_plateforme" (
  "id" serial PRIMARY KEY,
  "cle" varchar(64) NOT NULL UNIQUE,
  "cible" numeric(14, 2),
  "updated_by" integer,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
