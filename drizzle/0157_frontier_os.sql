-- Centre Cyber-Électrique MKA.P-MS / Frontier OS (plateforme principale) : base de données du système.
-- Tout est moteur : plateformes, moteurs, paires de contrôle, boutons, interrupteurs, lignes, pointages, mémoire, zones, atelier, journal.
-- Préfixe fo_ : « audit_logs » existe déjà sur la plateforme. Aucun secret, aucune clé d'accès, aucun appel externe.
-- Règles inscrites en base : un bouton a toujours deux moteurs distincts ; un interrupteur réel aussi ; une paire de contrôle
-- a deux moteurs internes distincts ; un moteur externe n'a qu'une seule paire.

CREATE TABLE IF NOT EXISTS fo_platforms (
 id serial PRIMARY KEY,
 code varchar(40) NOT NULL,
 name varchar(120) NOT NULL,
 slug varchar(60) NOT NULL,
 type varchar(24) NOT NULL CHECK (type IN ('main','shop','map','ai','jewelry_shop','future','external')),
 status varchar(16) NOT NULL DEFAULT 'future' CHECK (status IN ('active','inactive','future','locked')),
 security_level smallint NOT NULL DEFAULT 1 CHECK (security_level BETWEEN 0 AND 5),
 is_internal boolean NOT NULL DEFAULT true,
 is_future boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_platforms_code_idx ON fo_platforms(code);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_platforms_slug_idx ON fo_platforms(slug);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_engines (
 id serial PRIMARY KEY,
 code varchar(160) NOT NULL,
 platform_id integer NOT NULL REFERENCES fo_platforms(id),
 name varchar(200) NOT NULL,
 engine_type varchar(32) NOT NULL CHECK (engine_type IN ('real_platform_engine','intermediary_engine','button_engine','switch_engine','connection_engine','security_engine','memory_engine','repair_engine','audit_engine','pointage_engine')),
 role varchar(400) NOT NULL DEFAULT '',
 status varchar(16) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','error','locked','future','maintenance')),
 power_level smallint NOT NULL DEFAULT 0 CHECK (power_level BETWEEN 0 AND 100),
 memory_capacity integer NOT NULL DEFAULT 0,
 security_level smallint NOT NULL DEFAULT 1 CHECK (security_level BETWEEN 0 AND 5),
 autonomous_mode boolean NOT NULL DEFAULT false,
 repair_mode boolean NOT NULL DEFAULT false,
 is_intermediary boolean NOT NULL DEFAULT false,
 is_real_engine boolean NOT NULL DEFAULT true,
 is_future_placeholder boolean NOT NULL DEFAULT false,
 state_source varchar(16) NOT NULL DEFAULT 'frontier' CHECK (state_source IN ('registry','inventory','cable','frontier','placeholder')),
 source_ref varchar(160) NOT NULL DEFAULT '',
 observed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_engines_code_idx ON fo_engines(code);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fo_engines_platform_idx ON fo_engines(platform_id, engine_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_engine_pairs (
 id serial PRIMARY KEY,
 external_engine_id integer NOT NULL REFERENCES fo_engines(id),
 internal_engine_primary_id integer NOT NULL REFERENCES fo_engines(id),
 internal_engine_secondary_id integer NOT NULL REFERENCES fo_engines(id),
 control_mode varchar(16) NOT NULL DEFAULT 'mixte' CHECK (control_mode IN ('surveillance','controle','mixte')),
 status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('ok','invalid','pending')),
 last_check_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fo_engine_pairs_deux_moteurs CHECK (internal_engine_primary_id <> internal_engine_secondary_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_engine_pairs_external_idx ON fo_engine_pairs(external_engine_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_buttons (
 id serial PRIMARY KEY,
 code varchar(60) NOT NULL,
 name varchar(120) NOT NULL,
 button_type varchar(24) NOT NULL CHECK (button_type IN ('all_on','all_off','line_on','line_off','test_current','lock','unlock','diagnostic','repair','pointage_toggle')),
 status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','locked','error')),
 engine_id integer REFERENCES fo_engines(id),
 primary_engine_id integer NOT NULL REFERENCES fo_engines(id),
 secondary_engine_id integer NOT NULL REFERENCES fo_engines(id),
 danger_level smallint NOT NULL DEFAULT 1 CHECK (danger_level BETWEEN 1 AND 5),
 requires_confirmation boolean NOT NULL DEFAULT false,
 last_pressed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fo_buttons_deux_moteurs CHECK (primary_engine_id <> secondary_engine_id),
 CONSTRAINT fo_buttons_critique_confirme CHECK (danger_level < 3 OR requires_confirmation)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_buttons_code_idx ON fo_buttons(code);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_control_groups (
 id serial PRIMARY KEY,
 code varchar(60) NOT NULL,
 name varchar(160) NOT NULL,
 left_platform_id integer NOT NULL REFERENCES fo_platforms(id),
 right_platform_id integer NOT NULL REFERENCES fo_platforms(id),
 status varchar(16) NOT NULL DEFAULT 'future' CHECK (status IN ('active','inactive','future','locked')),
 line_count_real integer NOT NULL DEFAULT 0,
 line_count_future integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_control_groups_code_idx ON fo_control_groups(code);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_connection_lines (
 id serial PRIMARY KEY,
 code varchar(100) NOT NULL,
 group_id integer NOT NULL REFERENCES fo_control_groups(id),
 position integer NOT NULL,
 left_platform_id integer NOT NULL REFERENCES fo_platforms(id),
 right_platform_id integer NOT NULL REFERENCES fo_platforms(id),
 left_real_engine_id integer REFERENCES fo_engines(id),
 left_intermediary_engine_id integer REFERENCES fo_engines(id),
 right_intermediary_engine_id integer REFERENCES fo_engines(id),
 right_real_engine_id integer REFERENCES fo_engines(id),
 central_pointage_id integer,
 engine_id integer REFERENCES fo_engines(id),
 label varchar(200) NOT NULL DEFAULT '',
 real_channel varchar(32),
 contract_ref varchar(80),
 status varchar(10) NOT NULL DEFAULT 'off' CHECK (status IN ('on','off','locked','error','future')),
 current_status varchar(16) NOT NULL DEFAULT 'off' CHECK (current_status IN ('off','simulated_on','locked','error','future')),
 test_status varchar(16) NOT NULL DEFAULT 'untested' CHECK (test_status IN ('untested','passed','failed')),
 is_active boolean NOT NULL DEFAULT false,
 is_future_placeholder boolean NOT NULL DEFAULT false,
 last_test_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fo_lines_future_vide CHECK (NOT is_future_placeholder OR (left_real_engine_id IS NULL AND left_intermediary_engine_id IS NULL AND right_intermediary_engine_id IS NULL AND right_real_engine_id IS NULL AND NOT is_active AND status = 'future'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_connection_lines_code_idx ON fo_connection_lines(code);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fo_connection_lines_group_idx ON fo_connection_lines(group_id, position);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_pointages (
 id serial PRIMARY KEY,
 code varchar(100) NOT NULL,
 name varchar(160) NOT NULL,
 connection_line_id integer NOT NULL REFERENCES fo_connection_lines(id),
 engine_id integer REFERENCES fo_engines(id),
 status varchar(16) NOT NULL DEFAULT 'separated' CHECK (status IN ('connected','separated','locked','error')),
 color_state varchar(8) NOT NULL DEFAULT 'red' CHECK (color_state IN ('red','blue','green')),
 is_master_pointage boolean NOT NULL DEFAULT true,
 last_contact_at timestamptz,
 last_separation_at timestamptz
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_pointages_code_idx ON fo_pointages(code);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_pointages_line_idx ON fo_pointages(connection_line_id);
--> statement-breakpoint
ALTER TABLE fo_connection_lines ADD CONSTRAINT fo_connection_lines_pointage_fk FOREIGN KEY (central_pointage_id) REFERENCES fo_pointages(id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_switches (
 id serial PRIMARY KEY,
 code varchar(100) NOT NULL,
 name varchar(160) NOT NULL,
 switch_type varchar(16) NOT NULL CHECK (switch_type IN ('line_left','line_right')),
 status varchar(10) NOT NULL DEFAULT 'OFF' CHECK (status IN ('ON','OFF','locked','error')),
 engine_id integer REFERENCES fo_engines(id),
 primary_engine_id integer REFERENCES fo_engines(id),
 secondary_engine_id integer REFERENCES fo_engines(id),
 connection_line_id integer NOT NULL REFERENCES fo_connection_lines(id),
 manual_enabled boolean NOT NULL DEFAULT true,
 automatic_enabled boolean NOT NULL DEFAULT false,
 danger_level smallint NOT NULL DEFAULT 3 CHECK (danger_level BETWEEN 1 AND 5),
 is_future_placeholder boolean NOT NULL DEFAULT false,
 last_on_at timestamptz,
 last_off_at timestamptz,
 CONSTRAINT fo_switches_deux_moteurs CHECK (is_future_placeholder OR (primary_engine_id IS NOT NULL AND secondary_engine_id IS NOT NULL AND primary_engine_id <> secondary_engine_id)),
 CONSTRAINT fo_switches_futur_eteint CHECK (NOT is_future_placeholder OR (status = 'OFF' AND NOT manual_enabled AND NOT automatic_enabled))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_switches_code_idx ON fo_switches(code);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fo_switches_line_idx ON fo_switches(connection_line_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_memory_blocks (
 id bigserial PRIMARY KEY,
 owner_type varchar(16) NOT NULL CHECK (owner_type IN ('platform','engine','switch','button','security','repair','line','system')),
 owner_id integer,
 memory_type varchar(32) NOT NULL,
 content_summary varchar(500) NOT NULL,
 importance_level smallint NOT NULL DEFAULT 1 CHECK (importance_level BETWEEN 1 AND 5),
 security_level smallint NOT NULL DEFAULT 1 CHECK (security_level BETWEEN 0 AND 5),
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fo_memory_blocks_owner_idx ON fo_memory_blocks(owner_type, owner_id, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_security_zones (
 id serial PRIMARY KEY,
 code varchar(60) NOT NULL,
 name varchar(160) NOT NULL,
 zone_type varchar(24) NOT NULL,
 access_level varchar(16) NOT NULL DEFAULT 'pdg',
 status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','future','locked')),
 danger_level smallint NOT NULL DEFAULT 1 CHECK (danger_level BETWEEN 1 AND 5),
 description text NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_security_zones_code_idx ON fo_security_zones(code);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_repair_workshop (
 id bigserial PRIMARY KEY,
 target_type varchar(16) NOT NULL,
 target_id integer,
 issue_type varchar(40) NOT NULL,
 diagnostic_status varchar(16) NOT NULL DEFAULT 'detected' CHECK (diagnostic_status IN ('detected','confirmed','dismissed')),
 repair_status varchar(16) NOT NULL DEFAULT 'proposed' CHECK (repair_status IN ('proposed','applied','rolled_back','refused','not_needed')),
 proposed_fix varchar(400) NOT NULL DEFAULT '',
 applied_fix varchar(400),
 fix_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 rollback_available boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS fo_repair_open_idx ON fo_repair_workshop(target_type, COALESCE(target_id, 0), issue_type) WHERE resolved_at IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS fo_audit_logs (
 id bigserial PRIMARY KEY,
 actor_type varchar(16) NOT NULL CHECK (actor_type IN ('pdg','system','engine')),
 actor_id integer,
 action varchar(48) NOT NULL,
 target_type varchar(16) NOT NULL,
 target_id integer,
 before_state jsonb,
 after_state jsonb,
 result varchar(10) NOT NULL CHECK (result IN ('ok','refused','error')),
 error_message varchar(300),
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fo_audit_logs_date_idx ON fo_audit_logs(created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fo_audit_logs_target_idx ON fo_audit_logs(target_type, target_id);
