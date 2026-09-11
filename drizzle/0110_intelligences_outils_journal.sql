-- Tool Registry (server/intelligences/outils/) — journal d'audit des outils demandés par un modèle.
CREATE TABLE IF NOT EXISTS "in_outils_journal" (
  "id" bigserial PRIMARY KEY,
  "tool_id" varchar(80) NOT NULL,
  "moteur" varchar(48) NOT NULL,
  "role" varchar(24),
  "verdict_politique" varchar(32) NOT NULL,
  "statut_execution" varchar(24),
  "motif" text NOT NULL DEFAULT '',
  "arguments_json" text,
  "resultat_json" text,
  "duree_ms" integer NOT NULL DEFAULT 0,
  "audit_category" varchar(40),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "in_outils_journal_tool_idx" ON "in_outils_journal" ("tool_id", "created_at");
CREATE INDEX IF NOT EXISTS "in_outils_journal_moteur_idx" ON "in_outils_journal" ("moteur", "created_at");
