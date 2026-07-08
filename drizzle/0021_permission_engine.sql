-- Permission Engine — Moteur de Permissions MKA.P-MS (tables isolées, préfixées perm_)

-- Journal de sécurité : chaque tentative d'accès sensible (autorisée ou refusée)
CREATE TABLE IF NOT EXISTS "perm_security_log" (
  "id" bigserial PRIMARY KEY,
  "user_id" integer,
  "role" varchar(32),
  "module" varchar(64),
  "action" varchar(32),
  "path" varchar(255),
  "side" varchar(16) DEFAULT 'api',
  "allowed" boolean NOT NULL,
  "reason" varchar(128),
  "ip" varchar(64),
  "user_agent" text,
  "created_at" timestamp DEFAULT now()
);

-- Accès temporaires accordés par le PDG
CREATE TABLE IF NOT EXISTS "perm_temporary_grants" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "module" varchar(64) NOT NULL,
  "action" varchar(32) DEFAULT 'voir',
  "read_only" boolean DEFAULT true,
  "granted_by" integer NOT NULL,
  "reason" text,
  "expires_at" timestamp,
  "revoked" boolean DEFAULT false,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "perm_security_log_created_idx" ON "perm_security_log" ("created_at");
CREATE INDEX IF NOT EXISTS "perm_security_log_allowed_idx" ON "perm_security_log" ("allowed");
