CREATE TABLE IF NOT EXISTS in_deploy_approvers (
 id serial PRIMARY KEY,
 user_id integer NOT NULL,
 actif boolean NOT NULL DEFAULT true,
 motif text NOT NULL DEFAULT '',
 actor_id integer,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS in_deploy_approvers_user_idx ON in_deploy_approvers(user_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS in_deploiements (
 id serial PRIMARY KEY,
 mission_id integer,
 statut varchar(32) NOT NULL DEFAULT 'en_attente_approbation',
 demande_par_id integer,
 approuve_par_id integer,
 approuve_le timestamptz,
 motif_decision text NOT NULL DEFAULT '',
 railway_deployment_id varchar(64) NOT NULL DEFAULT '',
 railway_statut varchar(32) NOT NULL DEFAULT '',
 commit_sha varchar(64) NOT NULL DEFAULT '',
 resultat_verification text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS in_deploiements_statut_idx ON in_deploiements(statut, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS in_deploiements_mission_idx ON in_deploiements(mission_id);
