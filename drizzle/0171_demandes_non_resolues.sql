-- Mission "IA universelle / IA centrale PDG" — signalement des demandes qu'AL-HOUDOUD·M n'a pas pu
-- satisfaire. Deux tables : le journal brut des refus de capacité (jamais d'outil précis, déjà tracé
-- par in_outils_journal) et l'annotation PDG posée sur un regroupement de signaux, jamais une deuxième
-- copie du signal lui-même. Aucune des deux ne porte de texte libre utilisateur.
CREATE TABLE IF NOT EXISTS in_capacite_refus_journal (
	id bigserial PRIMARY KEY,
	capacite varchar(32) NOT NULL,
	moteur varchar(64) NOT NULL DEFAULT '',
	role varchar(24),
	confidentialite varchar(24),
	country_code varchar(8),
	motif text NOT NULL DEFAULT '',
	created_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS in_capacite_refus_capacite_idx ON in_capacite_refus_journal (capacite, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS in_demandes_annotations (
	signature varchar(160) PRIMARY KEY,
	statut varchar(24) NOT NULL DEFAULT 'nouveau',
	note text NOT NULL DEFAULT '',
	actor_id integer,
	updated_at timestamp NOT NULL DEFAULT now()
);
