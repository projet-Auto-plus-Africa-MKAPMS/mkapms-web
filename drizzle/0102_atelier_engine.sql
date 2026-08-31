-- Moteur d'Atelier : capacités serveur qui manquaient réellement derrière trois
-- boutons (validation interne, contrôle qualité, stock de pièces du garage) et
-- derrière le report d'un rendez-vous atelier.

CREATE TABLE IF NOT EXISTS atelier_validations (
  id serial PRIMARY KEY,
  garage_id integer,
  dossier varchar(96) NOT NULL,
  type varchar(32) NOT NULL,
  etape varchar(96),
  conforme boolean NOT NULL,
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  remarque text,
  valide_par integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_validations_dossier_idx ON atelier_validations (dossier);
CREATE INDEX IF NOT EXISTS atelier_validations_type_idx ON atelier_validations (type);

CREATE TABLE IF NOT EXISTS atelier_stock (
  id serial PRIMARY KEY,
  garage_id integer NOT NULL,
  reference varchar(96) NOT NULL,
  designation varchar(200) NOT NULL,
  quantite integer NOT NULL DEFAULT 0,
  seuil integer NOT NULL DEFAULT 0,
  prix_achat_cents integer,
  prix_vente_cents integer,
  emplacement varchar(96),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT atelier_stock_garage_reference_unique UNIQUE (garage_id, reference)
);

CREATE INDEX IF NOT EXISTS atelier_stock_garage_idx ON atelier_stock (garage_id);

CREATE TABLE IF NOT EXISTS atelier_stock_mouvements (
  id serial PRIMARY KEY,
  stock_id integer NOT NULL,
  delta integer NOT NULL,
  quantite_apres integer NOT NULL,
  motif varchar(200),
  par_user integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_stock_mouvements_stock_idx ON atelier_stock_mouvements (stock_id);

CREATE TABLE IF NOT EXISTS atelier_rdv_reports (
  id serial PRIMARY KEY,
  rdv_id integer NOT NULL,
  ancienne_date timestamptz NOT NULL,
  nouvelle_date timestamptz NOT NULL,
  motif varchar(300) NOT NULL,
  par_user integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_rdv_reports_rdv_idx ON atelier_rdv_reports (rdv_id);
