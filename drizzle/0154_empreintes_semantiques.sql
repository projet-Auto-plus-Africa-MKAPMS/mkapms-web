-- Empreintes sémantiques (embeddings) de la mémoire et des connaissances de l'IA.
-- Une ligne par source et par modèle ; le hash du texte évite de recalculer ce qui n'a pas changé.
CREATE TABLE IF NOT EXISTS in_empreintes (
 id serial PRIMARY KEY,
 source_type varchar(24) NOT NULL,
 source_id bigint NOT NULL,
 modele varchar(60) NOT NULL,
 dimensions integer NOT NULL,
 hash varchar(64) NOT NULL,
 vecteur real[] NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS in_empreintes_source_idx ON in_empreintes(source_type, source_id, modele);
