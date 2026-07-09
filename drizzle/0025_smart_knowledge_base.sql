-- Smart Engine — Base de connaissances officielle MKA.P-MS (Parties 6 & 7)
-- Mémoire officielle alimentée automatiquement à chaque action. Table isolée,
-- préfixée smart_. Aucune donnée existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "smart_kb_entries" (
  "id" bigserial PRIMARY KEY,
  "domain" varchar(24) NOT NULL,
  "type" varchar(48) NOT NULL,
  "value" varchar(320) NOT NULL,
  "parent_key" varchar(320),
  "attributes" jsonb,
  "signature" varchar(768) NOT NULL UNIQUE,
  "observations" integer DEFAULT 1,
  "status" "smart_learned_status" DEFAULT 'proposed',
  "first_source" varchar(48),
  "created_by" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_kb_domain_idx" ON "smart_kb_entries" ("domain");
CREATE INDEX IF NOT EXISTS "smart_kb_status_idx" ON "smart_kb_entries" ("status");
CREATE INDEX IF NOT EXISTS "smart_kb_domain_type_idx" ON "smart_kb_entries" ("domain", "type");
