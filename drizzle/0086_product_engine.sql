-- MKA.P-MS Google Product Engine (points 94-95-96-97).
-- Additif : trois tables nouvelles. Le catalogue métier (parts_catalog, pieces)
-- n'est pas modifié — ces tables ne contiennent que la projection commerciale.

CREATE TABLE IF NOT EXISTS "product_feed_items" (
  "id" bigserial PRIMARY KEY,
  "source" varchar(32) NOT NULL,
  "source_id" integer NOT NULL,
  "offer_id" varchar(96) NOT NULL,
  "titre" varchar(255) NOT NULL DEFAULT '',
  "description" text NOT NULL DEFAULT '',
  "url" varchar(512) NOT NULL DEFAULT '',
  "image_url" text,
  "prix" numeric(12, 2),
  "devise" varchar(4) NOT NULL DEFAULT 'EUR',
  "disponibilite" varchar(24) NOT NULL DEFAULT 'indisponible',
  "etat" varchar(24) NOT NULL DEFAULT 'neuf',
  "marque" varchar(128),
  "gtin" varchar(32),
  "mpn" varchar(64),
  "pays" varchar(8) NOT NULL DEFAULT 'FR',
  "langue" varchar(16) NOT NULL DEFAULT 'fr',
  "categorie" varchar(160),
  "eligible" boolean NOT NULL DEFAULT false,
  "motif_ineligible" text NOT NULL DEFAULT '',
  "attributs_manquants" jsonb DEFAULT '[]'::jsonb,
  "envoye" boolean NOT NULL DEFAULT false,
  "approuve" boolean NOT NULL DEFAULT false,
  "visible" boolean NOT NULL DEFAULT false,
  "etat_canal" text NOT NULL DEFAULT '',
  "empreinte" varchar(64) NOT NULL DEFAULT '',
  "cree_le" timestamp NOT NULL DEFAULT now(),
  "maj_le" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "product_feed_items_source_unique" UNIQUE ("source", "source_id")
);

CREATE INDEX IF NOT EXISTS "product_feed_items_eligible_idx" ON "product_feed_items" ("eligible");

CREATE TABLE IF NOT EXISTS "product_sync_events" (
  "id" bigserial PRIMARY KEY,
  "item_id" integer,
  "source" varchar(32) NOT NULL,
  "source_id" integer NOT NULL,
  "declencheur" varchar(24) NOT NULL DEFAULT 'depot',
  "maillon" varchar(32) NOT NULL,
  "resultat" varchar(16) NOT NULL DEFAULT 'attente',
  "detail" text NOT NULL DEFAULT '',
  "cree_le" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "product_sync_events_source_idx" ON "product_sync_events" ("source", "source_id");

CREATE TABLE IF NOT EXISTS "product_feed_runs" (
  "id" serial PRIMARY KEY,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "finished_at" timestamp,
  "trigger" varchar(32) NOT NULL DEFAULT 'manuel',
  "requested_by" integer,
  "examines" integer NOT NULL DEFAULT 0,
  "eligibles" integer NOT NULL DEFAULT 0,
  "inelligibles" integer NOT NULL DEFAULT 0,
  "par_motif" jsonb DEFAULT '{}'::jsonb,
  "destination" jsonb DEFAULT '{}'::jsonb
);
