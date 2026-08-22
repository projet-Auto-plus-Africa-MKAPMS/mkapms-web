-- Points 134 et 139 — mémoire MKA.P-MS à grande capacité et apprentissage
-- après chaque action. Tables isolées, préfixe in_. Aucune table existante
-- n'est modifiée : les mémoires déjà détenues par d'autres moteurs (code,
-- automobile, erreurs, pays, moteurs, utilisateurs, clients) ne sont pas
-- recopiées ici.

CREATE TABLE IF NOT EXISTS "in_memoire" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "categorie" varchar(32) NOT NULL,
  "cycle" varchar(16) DEFAULT 'actif' NOT NULL,
  "cle" varchar(200) DEFAULT '' NOT NULL,
  "titre" varchar(240) DEFAULT '' NOT NULL,
  "contenu" text DEFAULT '' NOT NULL,
  "mots_cles" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "liens" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "source" varchar(64) DEFAULT 'intelligences' NOT NULL,
  "country_code" varchar(8),
  "poids" integer DEFAULT 1 NOT NULL,
  "rappels" integer DEFAULT 0 NOT NULL,
  "actor_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_memoire_categorie_idx" ON "in_memoire" ("categorie", "cycle");
CREATE INDEX IF NOT EXISTS "in_memoire_cle_idx" ON "in_memoire" ("cle");

CREATE TABLE IF NOT EXISTS "in_experiences" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "signature" varchar(160) NOT NULL,
  "domaine" varchar(48) DEFAULT 'inconnu' NOT NULL,
  "probleme" text DEFAULT '' NOT NULL,
  "diagnostic" text DEFAULT '' NOT NULL,
  "solution" text DEFAULT '' NOT NULL,
  "resultat" varchar(32) DEFAULT 'inconnu' NOT NULL,
  "blocage" text DEFAULT '' NOT NULL,
  "mission_id" integer,
  "test_run_id" integer,
  "dev_request_id" integer,
  "occurrences" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "in_experiences_signature_idx" ON "in_experiences" ("signature");
CREATE INDEX IF NOT EXISTS "in_experiences_domaine_idx" ON "in_experiences" ("domaine");
