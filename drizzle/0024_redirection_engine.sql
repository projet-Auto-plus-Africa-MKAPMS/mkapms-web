-- Redirection Engine — Moteur de Redirection MKA.P-MS (tables isolées, préfixées redir_)

CREATE TABLE IF NOT EXISTS "redir_rules" (
  "id" serial PRIMARY KEY,
  "key" varchar(128) NOT NULL UNIQUE,
  "label" varchar(200) NOT NULL,
  "kind" varchar(16) DEFAULT 'button',
  "target" varchar(512) NOT NULL,
  "external" boolean DEFAULT false,
  "active" boolean DEFAULT true,
  "priority" integer DEFAULT 0,
  "description" text,
  "hit_count" integer DEFAULT 0,
  "created_by" integer,
  "updated_by" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "redir_logs" (
  "id" bigserial PRIMARY KEY,
  "key" varchar(128) NOT NULL,
  "matched" boolean NOT NULL,
  "resolved_to" varchar(512),
  "user_id" integer,
  "role" varchar(32),
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "redir_logs_key_idx" ON "redir_logs" ("key");
CREATE INDEX IF NOT EXISTS "redir_logs_matched_idx" ON "redir_logs" ("matched");

-- Règles de départ (destinations vers des routes réelles existantes)
INSERT INTO "redir_rules" ("key", "label", "kind", "target", "external", "active", "priority", "description")
VALUES
  ('bouton_devenir_partenaire', 'Bouton « Devenir partenaire » (accueil)', 'button', '/espace-pro', false, true, 10, 'Redirige vers l''espace professionnel depuis la page d''accueil.'),
  ('service_abonnements', 'Service « Abonnements »', 'service', '/abonnements', false, true, 0, 'Page des abonnements de la plateforme.'),
  ('service_encheres', 'Service « Enchères »', 'service', '/acheter/encheres', false, true, 0, 'Espace enchères.'),
  ('service_estimation', 'Service « Estimation »', 'service', '/acheter/estimation', false, true, 0, 'Estimation de véhicule.')
ON CONFLICT ("key") DO NOTHING;
