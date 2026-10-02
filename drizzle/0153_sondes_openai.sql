-- Preuves des tests réels des capacités OpenAI (une ligne par capacité, remplacée à chaque sonde).
-- Jamais de clé ni de message d'erreur brut : seulement le statut HTTP et les codes publics d'erreur.
CREATE TABLE IF NOT EXISTS in_sondes_openai (
 id serial PRIMARY KEY,
 capacite varchar(48) NOT NULL,
 etat varchar(40) NOT NULL,
 modele varchar(80),
 endpoint varchar(120) NOT NULL DEFAULT '',
 http_status integer,
 erreur_type varchar(80) NOT NULL DEFAULT '',
 erreur_code varchar(80) NOT NULL DEFAULT '',
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 teste_le timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS in_sondes_openai_capacite_idx ON in_sondes_openai(capacite);
