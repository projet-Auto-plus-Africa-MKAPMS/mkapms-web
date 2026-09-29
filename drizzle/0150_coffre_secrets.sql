CREATE TABLE IF NOT EXISTS in_coffre_secrets (
 id serial PRIMARY KEY,
 owner_id integer NOT NULL,
 nom varchar(120) NOT NULL,
 service varchar(120) NOT NULL DEFAULT '',
 type varchar(16) NOT NULL,
 apercu varchar(160) NOT NULL DEFAULT '',
 taille integer NOT NULL DEFAULT 0,
 version integer NOT NULL DEFAULT 1,
 sel varchar(64) NOT NULL,
 iv varchar(32) NOT NULL,
 tag varchar(32) NOT NULL,
 contenu_chiffre text NOT NULL,
 dernier_usage_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS in_coffre_secrets_owner_nom_idx ON in_coffre_secrets(owner_id, nom);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS in_coffre_acces (
 id bigserial PRIMARY KEY,
 secret_id integer,
 nom_secret varchar(120) NOT NULL DEFAULT '',
 acteur_id integer,
 action varchar(24) NOT NULL,
 outil varchar(96) NOT NULL DEFAULT '',
 motif text NOT NULL DEFAULT '',
 ok boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS in_coffre_acces_secret_idx ON in_coffre_acces(secret_id, created_at DESC);
