-- Assistant mondial — domaines d'assistance du côté public.
-- Un domaine construit n'est pas un domaine ouvert : l'interrupteur appartient
-- au PDG. Aucune table existante n'est modifiée, seule la session Intelligence
-- reçoit le domaine réellement utilisé (traçabilité de la consigne appliquée).

CREATE TABLE IF NOT EXISTS "in_domaines" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(48) NOT NULL UNIQUE,
  "actif" boolean DEFAULT false NOT NULL,
  "motif" text DEFAULT '' NOT NULL,
  "actor_id" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "in_sessions" ADD COLUMN IF NOT EXISTS "domaine" varchar(48) DEFAULT 'automobile' NOT NULL;
