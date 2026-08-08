-- Abonnés newsletter : le bouton « S'abonner » du footer n'avait aucune action.
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "email" varchar(190) NOT NULL,
  "pays" varchar(2),
  "langue" varchar(8),
  "source" varchar(64) NOT NULL DEFAULT 'footer',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);

CREATE INDEX IF NOT EXISTS "newsletter_subscribers_active_idx"
  ON "newsletter_subscribers" ("active");
