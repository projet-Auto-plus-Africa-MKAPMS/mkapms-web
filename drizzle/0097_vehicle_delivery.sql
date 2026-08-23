-- Vehicle Delivery Engine — livraison de véhicules (distincte de la livraison de pièces/colis).
CREATE TABLE IF NOT EXISTS "vd_tarifs" (
  "id" serial PRIMARY KEY,
  "mode" varchar(32) NOT NULL,
  "categorie" varchar(24) NOT NULL,
  "pays_depart" varchar(4),
  "pays_arrivee" varchar(4),
  "etape" varchar(32) NOT NULL DEFAULT 'transport_principal',
  "prix_fixe" numeric(12,2) NOT NULL DEFAULT '0',
  "prix_par_km" numeric(10,4) NOT NULL DEFAULT '0',
  "prix_minimum" numeric(12,2) NOT NULL DEFAULT '0',
  "devise" varchar(4) NOT NULL DEFAULT 'EUR',
  "delai_jours_min" integer,
  "delai_jours_max" integer,
  "origine" varchar(24) NOT NULL DEFAULT 'interne',
  "source" text NOT NULL DEFAULT '',
  "transporteur" varchar(120),
  "verifie" boolean NOT NULL DEFAULT false,
  "actif" boolean NOT NULL DEFAULT true,
  "valid_du" timestamp,
  "valid_au" timestamp,
  "actor_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "vd_tarifs_corridor_idx" ON "vd_tarifs" ("mode", "categorie", "pays_depart", "pays_arrivee");

CREATE TABLE IF NOT EXISTS "vd_options" (
  "id" serial PRIMARY KEY,
  "code" varchar(48) NOT NULL UNIQUE,
  "label" varchar(120) NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "prix_fixe" numeric(12,2),
  "prix_pourcent" numeric(6,2),
  "devise" varchar(4) NOT NULL DEFAULT 'EUR',
  "premium" boolean NOT NULL DEFAULT false,
  "actif" boolean NOT NULL DEFAULT false,
  "verifie" boolean NOT NULL DEFAULT false,
  "motif" text NOT NULL DEFAULT '',
  "actor_id" integer,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "vd_devis" (
  "id" bigserial PRIMARY KEY,
  "annonce_id" integer,
  "user_id" integer,
  "mode" varchar(32) NOT NULL,
  "categorie" varchar(24) NOT NULL,
  "pays_depart" varchar(4),
  "pays_arrivee" varchar(4),
  "ville_depart" varchar(120),
  "ville_arrivee" varchar(120),
  "distance_km" numeric(10,2),
  "total" numeric(12,2),
  "devise" varchar(4) NOT NULL DEFAULT 'EUR',
  "qualite" varchar(24) NOT NULL,
  "etapes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "manques" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "resume" text NOT NULL DEFAULT '',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "vd_devis_annonce_idx" ON "vd_devis" ("annonce_id");

CREATE TABLE IF NOT EXISTS "vd_expeditions" (
  "id" serial PRIMARY KEY,
  "devis_id" integer,
  "annonce_id" integer,
  "client_id" integer NOT NULL,
  "reference" varchar(32) NOT NULL UNIQUE,
  "mode" varchar(32) NOT NULL,
  "statut" varchar(32) NOT NULL DEFAULT 'a_planifier',
  "etape_courante" varchar(32),
  "transporteur" varchar(120),
  "total" numeric(12,2),
  "devise" varchar(4) NOT NULL DEFAULT 'EUR',
  "qualite_prix" varchar(24) NOT NULL DEFAULT 'estime',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "vd_expeditions_client_idx" ON "vd_expeditions" ("client_id");

CREATE TABLE IF NOT EXISTS "vd_suivi" (
  "id" bigserial PRIMARY KEY,
  "expedition_id" integer NOT NULL,
  "etape" varchar(32) NOT NULL,
  "statut" varchar(24) NOT NULL DEFAULT 'attendu',
  "note" text NOT NULL DEFAULT '',
  "auteur_id" integer,
  "constate_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "vd_suivi_expedition_idx" ON "vd_suivi" ("expedition_id");
