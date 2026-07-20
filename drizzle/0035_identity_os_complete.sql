-- Identity Operating System — Complétude fonctionnelle (règle MOS #15)
-- Ajoute les tables nécessaires aux fonctions manquantes identifiées lors
-- de l'audit d'Identity OS : récupération de compte, vérifications email/
-- téléphone, MFA TOTP, gestion des appareils, tentatives de connexion
-- (détection d'anomalies), et clés d'agents IA.
--
-- Migration idempotente, purement additive. Aucune table existante n'est
-- modifiée. Zéro régression sur `users`, `sessions`, `audit_logs` ou
-- `identity_*` livrées en Sprint 1.

-- ─── Vérifications email (double opt-in) ────────────────────────────────
CREATE TABLE IF NOT EXISTS "identity_email_verifications" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer NOT NULL,
  "email" varchar(255) NOT NULL,
  "token_hash" varchar(128) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "verified_at" timestamptz,
  "requested_ip" varchar(64),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "identity_email_verif_identity_idx" ON "identity_email_verifications" ("identity_id");
CREATE INDEX IF NOT EXISTS "identity_email_verif_token_idx" ON "identity_email_verifications" ("token_hash");

-- ─── Vérifications téléphone (OTP SMS 6 chiffres) ───────────────────────
CREATE TABLE IF NOT EXISTS "identity_phone_verifications" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer NOT NULL,
  "phone" varchar(32) NOT NULL,
  "code_hash" varchar(128) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "verified_at" timestamptz,
  "attempts" integer NOT NULL DEFAULT 0,
  "requested_ip" varchar(64),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "identity_phone_verif_identity_idx" ON "identity_phone_verifications" ("identity_id");

-- ─── Réinitialisations mot de passe (token opaque + expiration) ─────────
CREATE TABLE IF NOT EXISTS "identity_password_resets" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer NOT NULL,
  "token_hash" varchar(128) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "requested_ip" varchar(64),
  "user_agent" varchar(255),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "identity_password_resets_identity_idx" ON "identity_password_resets" ("identity_id");

-- ─── Secrets MFA TOTP (RFC 6238) + codes de secours ─────────────────────
CREATE TABLE IF NOT EXISTS "identity_mfa_secrets" (
  "id" bigserial PRIMARY KEY,
  "identity_id" integer NOT NULL UNIQUE,
  "secret_base32" varchar(64) NOT NULL,
  "backup_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "activated_at" timestamptz,
  "last_used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- ─── Tentatives de connexion (détection d'anomalies) ────────────────────
CREATE TABLE IF NOT EXISTS "identity_login_attempts" (
  "id" bigserial PRIMARY KEY,
  "email" varchar(255),
  "identity_id" integer,
  "success" boolean NOT NULL,
  "reason" varchar(64),
  "ip_address" varchar(64),
  "user_agent" varchar(255),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "identity_login_attempts_email_idx" ON "identity_login_attempts" ("email");
CREATE INDEX IF NOT EXISTS "identity_login_attempts_ip_idx" ON "identity_login_attempts" ("ip_address");
CREATE INDEX IF NOT EXISTS "identity_login_attempts_created_idx" ON "identity_login_attempts" ("created_at" DESC);

-- ─── Comptes agents IA (clés d'API dédiées) ─────────────────────────────
CREATE TABLE IF NOT EXISTS "identity_ai_agents" (
  "id" serial PRIMARY KEY,
  "identity_id" integer NOT NULL,
  "label" varchar(160) NOT NULL,
  "purpose" varchar(64) NOT NULL,
  "api_key_hash" varchar(128) NOT NULL UNIQUE,
  "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz,
  "revoked_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "identity_ai_agents_identity_idx" ON "identity_ai_agents" ("identity_id");
