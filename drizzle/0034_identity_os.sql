-- Identity Operating System — Sprint 1 (Fondations DB)
-- Tables isolées préfixées `identity_`. Aucune table existante n'est modifiée.
-- La table legacy `users` reste intacte : l'Identity OS y fait référence via
-- la colonne `legacy_user_id` (référence molle, aucune FK dure).
--
-- Migration idempotente — peut être rejouée sans effet secondaire.

CREATE TABLE IF NOT EXISTS "identity_identities" (
  "id" serial PRIMARY KEY,
  "legacy_user_id" integer,
  "type" varchar(32) NOT NULL,
  "roles" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "email" varchar(255),
  "display_name" varchar(160),
  "password_hash" varchar(255),
  "country_code" varchar(4),
  "language_code" varchar(8),
  "status" varchar(16) NOT NULL DEFAULT 'active',
  "email_verified" boolean NOT NULL DEFAULT false,
  "phone_verified" boolean NOT NULL DEFAULT false,
  "mfa_enabled" boolean NOT NULL DEFAULT false,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_login_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "identity_identities_type_idx" ON "identity_identities" ("type");
CREATE INDEX IF NOT EXISTS "identity_identities_status_idx" ON "identity_identities" ("status");
CREATE INDEX IF NOT EXISTS "identity_identities_email_idx" ON "identity_identities" ("email");
CREATE INDEX IF NOT EXISTS "identity_identities_legacy_user_idx" ON "identity_identities" ("legacy_user_id");

CREATE TABLE IF NOT EXISTS "identity_sessions" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer NOT NULL,
  "session_token" varchar(128) NOT NULL UNIQUE,
  "device_id" varchar(128),
  "user_agent" varchar(255),
  "ip_address" varchar(64),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_active_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz,
  "revoked_at" timestamptz,
  "revoked_reason" varchar(32)
);

CREATE INDEX IF NOT EXISTS "identity_sessions_identity_idx" ON "identity_sessions" ("identity_id");
CREATE INDEX IF NOT EXISTS "identity_sessions_active_idx" ON "identity_sessions" ("identity_id", "revoked_at");

CREATE TABLE IF NOT EXISTS "identity_audit_log" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer,
  "actor_identity_id" integer,
  "action" varchar(64) NOT NULL,
  "reason" text,
  "metadata" jsonb,
  "ip_address" varchar(64),
  "user_agent" varchar(255),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "identity_audit_identity_idx" ON "identity_audit_log" ("identity_id");
CREATE INDEX IF NOT EXISTS "identity_audit_action_idx" ON "identity_audit_log" ("action");
CREATE INDEX IF NOT EXISTS "identity_audit_created_idx" ON "identity_audit_log" ("created_at" DESC);

CREATE TABLE IF NOT EXISTS "identity_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "identity_health_created_idx" ON "identity_health_log" ("created_at" DESC);
