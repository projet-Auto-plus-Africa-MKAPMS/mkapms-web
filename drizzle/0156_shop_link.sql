-- Moteur intermédiaire Boutique (côté plateforme principale) : câble, clés publiques, journal, boîte d'échange IA.
-- Rien ici ne contient de secret ni de contenu de la Boutique en clair hors boîte d'échange (mise en attente, validée par le PDG).
-- Défaut : tous les canaux sont COUPÉS (aucune ligne = coupé) ; le maître est branché tant qu'aucune ligne ne dit le contraire.

CREATE TABLE IF NOT EXISTS shop_link_cables (
 canal varchar(32) PRIMARY KEY,
 etat varchar(10) NOT NULL DEFAULT 'coupe',
 motif varchar(240) NOT NULL DEFAULT '',
 modifie_par integer,
 modifie_le timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_link_cles (
 id serial PRIMARY KEY,
 libelle varchar(80) NOT NULL,
 cle_publique text NOT NULL,
 empreinte varchar(64) NOT NULL,
 etat varchar(10) NOT NULL DEFAULT 'active',
 cree_par integer,
 cree_le timestamptz NOT NULL DEFAULT now(),
 revoquee_le timestamptz
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS shop_link_cles_empreinte_idx ON shop_link_cles(empreinte);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_link_rejeu (
 nonce varchar(32) PRIMARY KEY,
 canal varchar(32) NOT NULL,
 cree_le timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS shop_link_rejeu_canal_idx ON shop_link_rejeu(canal, cree_le);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_link_journal (
 id bigserial PRIMARY KEY,
 canal varchar(32) NOT NULL,
 sens varchar(10) NOT NULL,
 evenement varchar(32) NOT NULL,
 resultat varchar(16) NOT NULL,
 statut_http integer,
 duree_ms integer,
 acteur varchar(60) NOT NULL DEFAULT '',
 detail varchar(300) NOT NULL DEFAULT '',
 cree_le timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS shop_link_journal_date_idx ON shop_link_journal(cree_le);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS shop_link_journal_canal_idx ON shop_link_journal(canal, cree_le);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_link_etat_boutique (
 id serial PRIMARY KEY,
 recu_le timestamptz NOT NULL DEFAULT now(),
 observe_le timestamptz NOT NULL,
 cle_id integer,
 contenu jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_link_documents (
 id serial PRIMARY KEY,
 reference varchar(80) NOT NULL,
 statut varchar(40) NOT NULL,
 total_minor bigint,
 devise char(3),
 reference_commande varchar(80),
 emis_le timestamptz,
 recu_le timestamptz NOT NULL DEFAULT now(),
 cle_id integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS shop_link_documents_reference_idx ON shop_link_documents(reference);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shop_link_ia_boite (
 id serial PRIMARY KEY,
 sens varchar(10) NOT NULL,
 type varchar(24) NOT NULL,
 titre varchar(160) NOT NULL,
 contenu text NOT NULL,
 source varchar(120) NOT NULL DEFAULT '',
 empreinte varchar(64) NOT NULL,
 etat varchar(16) NOT NULL DEFAULT 'en_attente',
 connaissance_id integer,
 cle_id integer,
 cree_par integer,
 decide_par integer,
 decide_le timestamptz,
 transmis_le timestamptz,
 cree_le timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS shop_link_ia_boite_empreinte_idx ON shop_link_ia_boite(sens, empreinte);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS shop_link_ia_boite_etat_idx ON shop_link_ia_boite(sens, etat, cree_le);
