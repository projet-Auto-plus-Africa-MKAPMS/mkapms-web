-- Permission OS — Complétude fonctionnelle (règle MOS #15)
-- Additive pure. Les tables existantes `perm_security_log` et
-- `perm_temporary_grants` restent INTACTES.

-- ─── Politiques contextuelles (niveau 2 — permissions intelligentes) ────
CREATE TABLE IF NOT EXISTS "perm_policies" (
  "id" serial PRIMARY KEY,
  "name" varchar(160) NOT NULL,
  "module" varchar(64) NOT NULL,
  "action" varchar(32) NOT NULL,
  "effect" varchar(8) NOT NULL,
  "priority" integer NOT NULL DEFAULT 100,
  "conditions" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "active" boolean NOT NULL DEFAULT true,
  "created_by" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "perm_policies_active_prio_idx" ON "perm_policies" ("active", "priority");
CREATE INDEX IF NOT EXISTS "perm_policies_module_idx" ON "perm_policies" ("module");

-- ─── Délégations de droits (temporaires, entre identités) ───────────────
CREATE TABLE IF NOT EXISTS "perm_delegations" (
  "id" serial PRIMARY KEY,
  "from_identity_id" integer NOT NULL,
  "to_identity_id" integer NOT NULL,
  "module" varchar(64) NOT NULL,
  "action" varchar(32) NOT NULL DEFAULT 'voir',
  "reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz,
  "revoked_at" timestamptz,
  "revoked_reason" varchar(64)
);
CREATE INDEX IF NOT EXISTS "perm_delegations_to_idx" ON "perm_delegations" ("to_identity_id");
CREATE INDEX IF NOT EXISTS "perm_delegations_from_idx" ON "perm_delegations" ("from_identity_id");

-- ─── Journal de résolution (traçabilité de chaque décision) ─────────────
CREATE TABLE IF NOT EXISTS "perm_resolution_log" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer,
  "user_id" integer,
  "role" varchar(32),
  "module" varchar(64) NOT NULL,
  "action" varchar(32) NOT NULL DEFAULT 'voir',
  "allowed" boolean NOT NULL,
  "reason" varchar(48) NOT NULL,
  "policy_id" integer,
  "context" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "perm_resolution_created_idx" ON "perm_resolution_log" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "perm_resolution_identity_idx" ON "perm_resolution_log" ("identity_id");

-- ─── Santé Permission OS (règle MOS #11) ────────────────────────────────
CREATE TABLE IF NOT EXISTS "perm_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
