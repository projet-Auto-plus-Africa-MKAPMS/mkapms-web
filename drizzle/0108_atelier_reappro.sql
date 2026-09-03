-- Moteur d'Atelier : réapprovisionnement de bout en bout.
-- seuil (atelier_stock.seuil) → proposition → décision humaine → commande
-- fournisseur sous plafond mensuel → réception dans le stock.

CREATE TABLE IF NOT EXISTS atelier_reappro_reglages (
  id serial PRIMARY KEY,
  garage_id integer NOT NULL UNIQUE,
  plafond_mensuel_cents integer NOT NULL DEFAULT 0,
  proposition_auto boolean NOT NULL DEFAULT true,
  fournisseur_nom varchar(160),
  fournisseur_email varchar(200),
  fournisseur_telephone varchar(40),
  par_user integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atelier_reappro_propositions (
  id serial PRIMARY KEY,
  garage_id integer NOT NULL,
  stock_id integer NOT NULL,
  reference varchar(96) NOT NULL,
  designation varchar(200) NOT NULL,
  quantite_constatee integer NOT NULL,
  seuil integer NOT NULL,
  quantite_proposee integer NOT NULL,
  prix_unitaire_cents integer,
  origine varchar(24) NOT NULL,
  statut varchar(24) NOT NULL DEFAULT 'proposee',
  decide_par integer,
  decide_at timestamptz,
  motif_decision varchar(300),
  commande_id integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_reappro_prop_garage_idx ON atelier_reappro_propositions (garage_id);
CREATE INDEX IF NOT EXISTS atelier_reappro_prop_stock_statut_idx ON atelier_reappro_propositions (stock_id, statut);

CREATE TABLE IF NOT EXISTS atelier_commandes_fournisseur (
  id serial PRIMARY KEY,
  garage_id integer NOT NULL,
  numero varchar(40) NOT NULL UNIQUE,
  fournisseur_nom varchar(160) NOT NULL,
  fournisseur_email varchar(200),
  fournisseur_telephone varchar(40),
  lignes jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL,
  statut varchar(24) NOT NULL DEFAULT 'a_transmettre',
  email_envoye boolean NOT NULL DEFAULT false,
  passee_par integer NOT NULL,
  receptionnee_par integer,
  receptionnee_at timestamptz,
  annulee_par integer,
  annulee_at timestamptz,
  motif_annulation varchar(300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_cmd_fourn_garage_idx ON atelier_commandes_fournisseur (garage_id);
CREATE INDEX IF NOT EXISTS atelier_cmd_fourn_statut_idx ON atelier_commandes_fournisseur (statut);
