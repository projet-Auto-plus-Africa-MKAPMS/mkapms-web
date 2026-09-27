CREATE TABLE IF NOT EXISTS in_media_productions (
 id uuid PRIMARY KEY,
 owner_id integer NOT NULL,
 operation text NOT NULL CHECK(operation IN ('image','voix')),
 input_hash text NOT NULL,
 texte text NOT NULL,
 statut text NOT NULL CHECK(statut IN ('PROCESSING','READY','FAILED')),
 mime text CHECK(mime IN ('image/png','audio/mpeg')),
 donnees text,
 motif text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS in_media_productions_owner_date ON in_media_productions(owner_id,created_at DESC);
