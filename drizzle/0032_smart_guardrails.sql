-- Smart Engine — Règle finale / Garde-fous (Partie 15)
-- Toute action sensible que le Système Intelligent souhaite entreprendre est
-- mise en file d'attente et ne peut être exécutée qu'après validation humaine
-- (PDG/Directeur/admin). Table isolée, préfixée smart_. Additif.

DO $$ BEGIN
  CREATE TYPE "smart_risk_level" AS ENUM ('faible', 'moyen', 'eleve', 'critique');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "smart_approval_status" AS ENUM ('en_attente', 'approuve', 'rejete', 'execute');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "smart_action_approvals" (
  "id" bigserial PRIMARY KEY,
  "action" varchar(128) NOT NULL,
  "target_type" varchar(64),
  "target_id" integer,
  "reason" text,
  "risk_level" "smart_risk_level" DEFAULT 'moyen',
  "status" "smart_approval_status" DEFAULT 'en_attente',
  "requested_by" varchar(64) DEFAULT 'systeme',
  "decided_by" integer,
  "decided_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_approval_status_idx" ON "smart_action_approvals" ("status");
CREATE INDEX IF NOT EXISTS "smart_approval_action_idx" ON "smart_action_approvals" ("action");
