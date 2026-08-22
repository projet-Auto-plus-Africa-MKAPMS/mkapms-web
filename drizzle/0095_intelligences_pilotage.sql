-- Points 145-149 — actions du propriétaire, attribution des permissions,
-- mesure des appels fournisseurs, mode shadow.
-- Tables isolées, préfixe in_. Aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "in_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "portee" varchar(16) NOT NULL,
  "cible" varchar(64) NOT NULL,
  "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "actor_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_permissions_cible_idx"
  ON "in_permissions" ("portee", "cible");

CREATE TABLE IF NOT EXISTS "in_capacite_etat" (
  "id" serial PRIMARY KEY NOT NULL,
  "capacite" varchar(32) NOT NULL UNIQUE,
  "actif" boolean DEFAULT true NOT NULL,
  "fournisseur_impose" varchar(48),
  "motif" text DEFAULT '' NOT NULL,
  "actor_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "in_appels" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "capacite" varchar(32) NOT NULL,
  "tache" varchar(64) DEFAULT '' NOT NULL,
  "moteur" varchar(64) DEFAULT '' NOT NULL,
  "fournisseur" varchar(48),
  "rang" varchar(16) DEFAULT 'principal' NOT NULL,
  "ok" boolean DEFAULT false NOT NULL,
  "duree_ms" integer DEFAULT 0 NOT NULL,
  "jetons_entree" integer DEFAULT 0 NOT NULL,
  "jetons_sortie" integer DEFAULT 0 NOT NULL,
  "cout_cents" integer DEFAULT 0 NOT NULL,
  "cout_mesure" boolean DEFAULT false NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "note" integer,
  "note_actor_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_appels_capacite_idx"
  ON "in_appels" ("capacite", "created_at");

CREATE INDEX IF NOT EXISTS "in_appels_fournisseur_idx"
  ON "in_appels" ("fournisseur", "created_at");

CREATE TABLE IF NOT EXISTS "in_shadow" (
  "id" serial PRIMARY KEY NOT NULL,
  "capacite" varchar(32) NOT NULL UNIQUE,
  "candidat" varchar(48) NOT NULL,
  "actif" boolean DEFAULT false NOT NULL,
  "part" integer DEFAULT 0 NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "actor_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "in_shadow_runs" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "capacite" varchar(32) NOT NULL,
  "tache" varchar(64) DEFAULT '' NOT NULL,
  "fournisseur" varchar(48),
  "candidat" varchar(48) NOT NULL,
  "ok_fournisseur" boolean DEFAULT false NOT NULL,
  "ok_candidat" boolean DEFAULT false NOT NULL,
  "duree_fournisseur_ms" integer DEFAULT 0 NOT NULL,
  "duree_candidat_ms" integer DEFAULT 0 NOT NULL,
  "similarite" integer,
  "verdict" varchar(24) DEFAULT 'candidat_absent' NOT NULL,
  "motif_candidat" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_shadow_runs_capacite_idx"
  ON "in_shadow_runs" ("capacite", "created_at");
