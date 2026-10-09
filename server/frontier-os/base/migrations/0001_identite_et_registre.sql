-- Centre Cyber-Électrique MKA.P-MS / Frontier OS — base INDÉPENDANTE (schéma « frontier »), migration 0001.
-- Identité : entreprises propriétaires, plateformes, noms exacts ; registre des moteurs, versions, capacités déclarées / mesurées,
-- liaison commande/vérification, références de secrets (jamais de valeur), emplacements API / abonnements futurs, accès.
-- Cette base a son propre migrateur et son propre journal (frontier.migrations) : elle n'utilise ni le dossier drizzle/ ni sa chaîne.
-- Toute donnée appartient explicitement au centre, à une entreprise ou à une plateforme (owner_kind / owner_code).

CREATE SCHEMA IF NOT EXISTS frontier;

CREATE TABLE frontier.companies (
  code        text PRIMARY KEY CHECK (code ~ '^[a-z0-9][a-z0-9_-]{1,38}$'),
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  role        text NOT NULL CHECK (role IN ('center_owner', 'platform_owner', 'client')),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'prepared', 'suspended')),
  note        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE frontier.platforms (
  code             text PRIMARY KEY CHECK (code ~ '^[a-z0-9][a-z0-9_-]{1,38}$'),
  company_code     text NOT NULL REFERENCES frontier.companies (code),
  name             text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  kind             text NOT NULL CHECK (kind IN ('center', 'main', 'shop', 'map', 'ai', 'jewelry', 'future', 'external')),
  repository       text NOT NULL DEFAULT '',
  exact_names      text[] NOT NULL DEFAULT '{}',
  identity_status  text NOT NULL CHECK (identity_status IN ('verified', 'to_verify')),
  identity_note    text NOT NULL DEFAULT '',
  status           text NOT NULL CHECK (status IN ('active', 'prepared', 'future', 'to_verify')),
  security_level   smallint NOT NULL DEFAULT 1 CHECK (security_level BETWEEN 1 AND 5),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Noms demandés par le PDG : un nom non retrouvé dans le code reste « non trouvé », il n'est jamais rattaché à une plateforme au hasard.
CREATE TABLE frontier.platform_aliases (
  name           text PRIMARY KEY,
  platform_code  text REFERENCES frontier.platforms (code),
  status         text NOT NULL CHECK (status IN ('found', 'not_found', 'to_verify')),
  evidence       text NOT NULL DEFAULT '',
  note           text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'not_found' OR platform_code IS NULL)
);

CREATE TABLE frontier.engines (
  code                 text PRIMARY KEY CHECK (code ~ '^[A-Za-z0-9][A-Za-z0-9_.:/-]{1,118}$'),
  platform_code        text NOT NULL REFERENCES frontier.platforms (code),
  owner_kind           text NOT NULL DEFAULT 'platform' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code           text NOT NULL,
  name                 text NOT NULL CHECK (length(name) BETWEEN 1 AND 240),
  function             text NOT NULL DEFAULT '',
  kind                 text NOT NULL CHECK (kind IN ('real', 'intermediary', 'command', 'verification', 'transport', 'monitor', 'switch_element', 'contact_element')),
  origin               text NOT NULL CHECK (origin IN ('inventory', 'center')),
  inventory_state      text CHECK (inventory_state IN ('incomplet', 'prepare', 'installe', 'teste', 'connecte', 'a_verifier')),
  evidence_level       text CHECK (evidence_level IN ('declare', 'liaison', 'tests', 'mesure')),
  declared_only        boolean NOT NULL DEFAULT true,
  code_location        text[] NOT NULL DEFAULT '{}',
  execution_service    text NOT NULL DEFAULT '',
  planned_intermediary text,
  inputs               text NOT NULL DEFAULT '',
  outputs              text NOT NULL DEFAULT '',
  stop_mechanism       text NOT NULL DEFAULT '',
  running              boolean NOT NULL DEFAULT true,
  health               text NOT NULL DEFAULT 'unknown' CHECK (health IN ('unknown', 'ok', 'degraded', 'down', 'stopped')),
  health_checked_at    timestamptz,
  details              jsonb NOT NULL DEFAULT '{}'::jsonb,
  version              text NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_kind <> 'center' OR owner_code = 'center'),
  CHECK (origin <> 'inventory' OR (inventory_state IS NOT NULL AND evidence_level IS NOT NULL)),
  CHECK (inventory_state IS DISTINCT FROM 'connecte' OR evidence_level = 'mesure')
);
CREATE INDEX engines_platform_idx ON frontier.engines (platform_code, kind);
CREATE INDEX engines_kind_idx ON frontier.engines (kind, running);

-- Historique des versions d'un moteur : chaque relevé d'inventaire à un commit différent ajoute une ligne (jamais écrasée).
CREATE TABLE frontier.engine_versions (
  id               bigserial PRIMARY KEY,
  engine_code      text NOT NULL REFERENCES frontier.engines (code),
  version          text NOT NULL,
  source_repo      text NOT NULL,
  source_commit    text NOT NULL,
  inventory_state  text,
  evidence_level   text,
  snapshot         jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engine_code, source_commit)
);

-- Capacités : ce que le moteur ANNONCE et ce qui a été MESURÉ. Deux moteurs logiciels ne prouvent pas une capacité doublée : seule la mesure compte.
CREATE TABLE frontier.engine_capabilities (
  engine_code     text NOT NULL REFERENCES frontier.engines (code),
  metric          text NOT NULL CHECK (metric IN ('throughput_per_min', 'latency_ms', 'memory_mb', 'recovery_ms', 'error_rate', 'capacity_factor')),
  declared_value  double precision,
  measured_value  double precision,
  unit            text NOT NULL DEFAULT '',
  method          text NOT NULL DEFAULT '',
  measured_at     timestamptz,
  PRIMARY KEY (engine_code, metric)
);

-- Chaque cible commandable (bouton, interrupteur, moteur externe pris en charge, ligne, groupe, général) a DEUX moteurs internes distincts :
-- un moteur de commande (prépare et exécute) et un moteur de vérification (contrôle les conditions et le résultat).
CREATE TABLE frontier.engine_bindings (
  id                   serial PRIMARY KEY,
  target_kind          text NOT NULL CHECK (target_kind IN ('button', 'switch', 'external_engine', 'line', 'group', 'general')),
  target_code          text NOT NULL,
  command_engine       text NOT NULL REFERENCES frontier.engines (code),
  verification_engine  text NOT NULL REFERENCES frontier.engines (code),
  owner_kind           text NOT NULL DEFAULT 'center' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code           text NOT NULL DEFAULT 'center',
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_kind, target_code),
  CHECK (command_engine <> verification_engine),
  CHECK (owner_kind <> 'center' OR owner_code = 'center')
);

CREATE FUNCTION frontier.check_binding_roles() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE k1 text; k2 text;
BEGIN
  SELECT kind INTO k1 FROM frontier.engines WHERE code = NEW.command_engine;
  SELECT kind INTO k2 FROM frontier.engines WHERE code = NEW.verification_engine;
  IF k1 IS DISTINCT FROM 'command' THEN
    RAISE EXCEPTION 'le moteur de commande % doit être de type command (trouvé %)', NEW.command_engine, k1;
  END IF;
  IF k2 IS DISTINCT FROM 'verification' THEN
    RAISE EXCEPTION 'le moteur de vérification % doit être de type verification (trouvé %)', NEW.verification_engine, k2;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER engine_bindings_roles BEFORE INSERT OR UPDATE ON frontier.engine_bindings
  FOR EACH ROW EXECUTE FUNCTION frontier.check_binding_roles();

-- Références de secrets : le NOM et l'emplacement protégé, jamais la valeur. Les journaux et la vitrine ne montrent que cette référence.
CREATE TABLE frontier.secret_refs (
  name          text PRIMARY KEY CHECK (name ~ '^[a-z0-9][a-z0-9_.-]{1,78}$'),
  store         text NOT NULL CHECK (store IN ('railway_env', 'platform_vault', 'none')),
  ref           text NOT NULL,
  purpose       text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'declared' CHECK (status IN ('declared', 'missing', 'present_unverified')),
  owner_kind    text NOT NULL DEFAULT 'center' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code    text NOT NULL DEFAULT 'center',
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_kind <> 'center' OR owner_code = 'center'),
  -- La référence est un NOM de variable ou un chemin de coffre, jamais une valeur : un jeton ne passe pas ces formes.
  CHECK ((store = 'railway_env' AND ref ~ '^[A-Z][A-Z0-9_]{2,63}$')
      OR (store = 'platform_vault' AND ref ~ '^vault:[a-z0-9_./:-]{2,100}$')
      OR (store = 'none' AND ref = 'none'))
);

-- Emplacements d'API et d'abonnements : préparés pour plus tard, jamais actifs dans cette version (activation = migration future).
CREATE TABLE frontier.api_slots (
  code          text PRIMARY KEY CHECK (code ~ '^[a-z0-9][a-z0-9_.-]{1,60}$'),
  name          text NOT NULL,
  company_code  text REFERENCES frontier.companies (code),
  scope         text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'inactive' CHECK (status = 'inactive'),
  note          text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE frontier.subscriptions (
  id            serial PRIMARY KEY,
  company_code  text NOT NULL REFERENCES frontier.companies (code),
  plan          text NOT NULL,
  status        text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'inactive')),
  note          text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_code, plan)
);

-- Employés et permissions : l'espace est préparé ; aujourd'hui seul le PDG (super_admin de la plateforme) accède au centre.
CREATE TABLE frontier.access_grants (
  id            serial PRIMARY KEY,
  subject_kind  text NOT NULL CHECK (subject_kind IN ('pdg', 'employee', 'role', 'engine', 'company')),
  subject_ref   text NOT NULL,
  scope         text NOT NULL,
  level         smallint NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  status        text NOT NULL DEFAULT 'prepared' CHECK (status IN ('active', 'prepared', 'revoked')),
  granted_by    text NOT NULL DEFAULT '',
  owner_kind    text NOT NULL DEFAULT 'center' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code    text NOT NULL DEFAULT 'center',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_kind, subject_ref, scope),
  CHECK (owner_kind <> 'center' OR owner_code = 'center')
);
