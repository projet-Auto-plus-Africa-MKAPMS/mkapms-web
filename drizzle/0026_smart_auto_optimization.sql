-- Smart Engine — Auto-optimisation (Partie 8)
-- Le Smart Engine PROPOSE des optimisations (vitesse recherche, classement,
-- qualité résultats, mots-clés, filtres, suggestions). Il ne modifie jamais
-- une règle métier sans validation : chaque proposition attend l'accord du PDG.
-- Table isolée, préfixée smart_. Aucune donnée existante n'est modifiée.

DO $$ BEGIN
  CREATE TYPE "smart_optimization_status" AS ENUM ('proposed', 'applied', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "smart_optimizations" (
  "id" bigserial PRIMARY KEY,
  "category" varchar(32) NOT NULL,
  "title" varchar(240) NOT NULL,
  "detail" text,
  "recommendation" text,
  "impact" varchar(16) DEFAULT 'moyen',
  "evidence" jsonb,
  "signature" varchar(400) NOT NULL UNIQUE,
  "status" "smart_optimization_status" DEFAULT 'proposed',
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "smart_opt_status_idx" ON "smart_optimizations" ("status");
CREATE INDEX IF NOT EXISTS "smart_opt_category_idx" ON "smart_optimizations" ("category");
